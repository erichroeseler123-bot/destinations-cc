import { getDb } from "@/lib/db/client";
import {
  octoSupplierConnections,
  octoNormalizedProducts,
  octoAuditLogs,
  octoBookings,
} from "@/lib/db/schema";
import { OctoAdapter, OctoApiError } from "./adapter";
import { encryptCredential, decryptCredential } from "./security";
import { OctoOnboardingStage, OctoProduct, OctoSupplierConnection } from "./types";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface OnboardingRegisterParams {
  operatorSlug: string;
  operatorName: string;
  endpoint: string;
  apiKey?: string;
  bearerToken?: string;
  isSandbox?: boolean;
  capabilities?: string[];
  operatorLegalName?: string;
  businessAddress?: string;
  signatoryName?: string;
  signatoryEmail?: string;
  consentAgreementVersion?: string;
  consentTermsText?: string;
  paymentModel?: "supplier_hosted" | "supplier_api" | "reseller_merchant_of_record" | "split_payment";
  commissionPercent?: number; // e.g. 5.0%
  settlementTerms?: string;
}

export interface VerificationResult {
  success: boolean;
  stage: OctoOnboardingStage;
  message: string;
  details?: unknown;
}

export class OctoOnboardingService {
  /**
   * 1. Register or update an operator connection in the onboarding pipeline
   * Lifecycle: discovered -> consented -> credentials_configured
   */
  static async registerOperator(params: OnboardingRegisterParams): Promise<string> {
    const db = getDb();
    if (!db) {
      throw new Error("DATABASE_UNAVAILABLE: Neon connection is required for operator onboarding");
    }

    const connectionId = `conn_${params.operatorSlug.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    // Determine initial stage
    let initialStage: OctoOnboardingStage = "discovered";
    if (params.signatoryName && params.signatoryEmail) {
      initialStage = "consented";
    }
    if (params.apiKey || params.bearerToken) {
      initialStage = "credentials_configured";
    }

    const encryptedApiKey = params.apiKey ? encryptCredential(params.apiKey) : null;
    const encryptedBearerToken = params.bearerToken ? encryptCredential(params.bearerToken) : null;

    const existing = await db
      .select()
      .from(octoSupplierConnections)
      .where(eq(octoSupplierConnections.id, connectionId));

    if (existing.length > 0) {
      await db
        .update(octoSupplierConnections)
        .set({
          operatorName: params.operatorName,
          endpoint: params.endpoint,
          encryptedApiKey: encryptedApiKey || existing[0].encryptedApiKey,
          encryptedBearerToken: encryptedBearerToken || existing[0].encryptedBearerToken,
          capabilities: params.capabilities || (existing[0].capabilities as string[]),
          isSandbox: params.isSandbox !== undefined ? params.isSandbox : existing[0].isSandbox,
          onboardingStage: initialStage,
          operatorLegalName: params.operatorLegalName || existing[0].operatorLegalName,
          businessAddress: params.businessAddress || existing[0].businessAddress,
          signatoryName: params.signatoryName || existing[0].signatoryName,
          signatoryEmail: params.signatoryEmail || existing[0].signatoryEmail,
          consentAgreementVersion: params.consentAgreementVersion || existing[0].consentAgreementVersion,
          consentTermsText: params.consentTermsText || existing[0].consentTermsText,
          consentedAt: params.signatoryName ? new Date() : existing[0].consentedAt,
          paymentModel: params.paymentModel || (existing[0].paymentModel as any),
          commissionPercent: params.commissionPercent !== undefined ? params.commissionPercent.toFixed(2) : existing[0].commissionPercent,
          settlementTerms: params.settlementTerms || existing[0].settlementTerms,
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));
    } else {
      await db.insert(octoSupplierConnections).values({
        id: connectionId,
        operatorSlug: params.operatorSlug,
        operatorName: params.operatorName,
        endpoint: params.endpoint,
        encryptedApiKey,
        encryptedBearerToken,
        capabilities: params.capabilities || ["octo/core"],
        isSandbox: params.isSandbox ?? false,
        onboardingStage: initialStage,
        operatorLegalName: params.operatorLegalName || null,
        businessAddress: params.businessAddress || null,
        signatoryName: params.signatoryName || null,
        signatoryEmail: params.signatoryEmail || null,
        consentAgreementVersion: params.consentAgreementVersion || "1.0",
        consentTermsText: params.consentTermsText || null,
        consentedAt: params.signatoryName ? new Date() : null,
        paymentModel: params.paymentModel || "supplier_hosted",
        commissionPercent: (params.commissionPercent ?? 5.0).toFixed(2),
        settlementTerms: params.settlementTerms || null,
        healthStatus: "untested",
      });
    }

    await db.insert(octoAuditLogs).values({
      action: "OPERATOR_ONBOARDING_REGISTERED",
      entityType: "SUPPLIER_CONNECTION",
      entityId: connectionId,
      status: "SUCCESS",
      payload: {
        operatorSlug: params.operatorSlug,
        stage: initialStage,
        isSandbox: params.isSandbox,
      },
    });

    return connectionId;
  }

  /**
   * Helper to get initialized adapter for a connection
   */
  private static async getAdapter(connectionId: string): Promise<{ adapter: OctoAdapter; connection: any }> {
    const db = getDb();
    if (!db) throw new Error("DATABASE_UNAVAILABLE");

    const rows = await db
      .select()
      .from(octoSupplierConnections)
      .where(eq(octoSupplierConnections.id, connectionId));

    if (!rows.length) throw new Error(`Connection not found: ${connectionId}`);
    const conn = rows[0];

    let apiKey: string | undefined;
    let bearerToken: string | undefined;

    if (conn.encryptedApiKey) {
      try {
        apiKey = decryptCredential(conn.encryptedApiKey);
      } catch (e: any) {
        throw new Error(`Failed to decrypt API key: ${e.message}`);
      }
    }
    if (conn.encryptedBearerToken) {
      try {
        bearerToken = decryptCredential(conn.encryptedBearerToken);
      } catch (e: any) {
        throw new Error(`Failed to decrypt Bearer token: ${e.message}`);
      }
    }

    const adapter = new OctoAdapter({
      endpoint: conn.endpoint,
      apiKey,
      bearerToken,
    });

    return { adapter, connection: conn };
  }

  /**
   * Stage 4: Verify Connection & Endpoint Health
   * Checks /suppliers or /products
   */
  static async verifyConnection(connectionId: string): Promise<VerificationResult> {
    const db = getDb();
    if (!db) throw new Error("DATABASE_UNAVAILABLE");

    try {
      const { adapter } = await this.getAdapter(connectionId);
      const supplier = await adapter.getSupplier();

      await db
        .update(octoSupplierConnections)
        .set({
          onboardingStage: "connection_verified",
          healthStatus: "healthy",
          lastHealthCheckAt: new Date(),
          lastHealthCheckStatus: "healthy",
          lastErrorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      await db.insert(octoAuditLogs).values({
        action: "ONBOARDING_CONNECTION_VERIFIED",
        entityType: "SUPPLIER_CONNECTION",
        entityId: connectionId,
        status: "SUCCESS",
        payload: { supplier },
      });

      return {
        success: true,
        stage: "connection_verified",
        message: "Endpoint connection and authentication verified successfully.",
        details: supplier,
      };
    } catch (err: any) {
      await db
        .update(octoSupplierConnections)
        .set({
          healthStatus: "error",
          lastHealthCheckAt: new Date(),
          lastHealthCheckStatus: "error",
          lastErrorMessage: err.message,
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      return {
        success: false,
        stage: "credentials_configured",
        message: `Connection verification failed: ${err.message}`,
      };
    }
  }

  /**
   * Stage 5: Sync & Normalize Catalog
   * Queries /products and saves normalized products into octo_normalized_products
   */
  static async syncCatalog(connectionId: string): Promise<VerificationResult> {
    const db = getDb();
    if (!db) throw new Error("DATABASE_UNAVAILABLE");

    try {
      const { adapter, connection } = await this.getAdapter(connectionId);
      const products = await adapter.getProducts();

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error("Supplier returned 0 products in catalog.");
      }

      for (const p of products) {
        const dccProductId = `dcc:octo:prod:${connection.operatorSlug}:${p.id}`;
        const minPrice = p.options?.[0]?.units?.[0]?.pricingFrom?.[0]?.retail ?? null;

        await db
          .insert(octoNormalizedProducts)
          .values({
            id: dccProductId,
            supplierConnectionId: connectionId,
            supplierProductReference: p.id,
            title: p.title,
            description: p.description || null,
            destinationSlug: p.destinationSlug || connection.operatorSlug,
            destinationName: p.location || null,
            country: p.country || null,
            locationName: p.location || null,
            latitude: p.placeCoordinates ? String(p.placeCoordinates.lat) : null,
            longitude: p.placeCoordinates ? String(p.placeCoordinates.lng) : null,
            defaultCurrency: p.defaultCurrency || "USD",
            durationMinutes: p.durationMinutes || null,
            meetingPoint: p.meetingPoint || null,
            cancellationPolicy: p.cancellationPolicy || null,
            capabilities: (p.capabilities as string[]) || ["octo/core"],
            options: (p.options as any) || [],
            pricingFrom: minPrice ? (minPrice / 100).toFixed(2) : null,
            sourceFreshness: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: octoNormalizedProducts.id,
            set: {
              title: p.title,
              description: p.description || null,
              destinationSlug: p.destinationSlug || connection.operatorSlug,
              options: (p.options as any) || [],
              pricingFrom: minPrice ? (minPrice / 100).toFixed(2) : null,
              sourceFreshness: new Date(),
              updatedAt: new Date(),
            },
          });
      }

      await db
        .update(octoSupplierConnections)
        .set({
          onboardingStage: "catalog_synced",
          catalogSyncStatus: "success",
          catalogSyncedAt: new Date(),
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      return {
        success: true,
        stage: "catalog_synced",
        message: `Catalog synchronized successfully. ${products.length} products normalized.`,
        details: { productCount: products.length },
      };
    } catch (err: any) {
      await db
        .update(octoSupplierConnections)
        .set({
          catalogSyncStatus: "error",
          lastErrorMessage: err.message,
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      return {
        success: false,
        stage: "connection_verified",
        message: `Catalog sync failed: ${err.message}`,
      };
    }
  }

  /**
   * Stage 6: Verify Live Availability
   * Queries /availability for the first product
   */
  static async verifyAvailability(
    connectionId: string,
    productId?: string,
    optionId?: string,
    localDate?: string
  ): Promise<VerificationResult> {
    const db = getDb();
    if (!db) throw new Error("DATABASE_UNAVAILABLE");

    try {
      const { adapter, connection } = await this.getAdapter(connectionId);

      // Find product to test if not provided
      let targetProductId = productId;
      let targetOptionId = optionId;

      if (!targetProductId) {
        const prods = await db
          .select()
          .from(octoNormalizedProducts)
          .where(eq(octoNormalizedProducts.supplierConnectionId, connectionId))
          .limit(1);

        if (!prods.length) {
          throw new Error("No normalized products found. Please run catalog sync first.");
        }
        targetProductId = prods[0].supplierProductReference;
        const options = prods[0].options as any[];
        targetOptionId = options[0]?.id || "opt_default";
      }

      const checkDate = localDate || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
      const slots = await adapter.checkAvailability(targetProductId!, targetOptionId || "default", checkDate);

      await db
        .update(octoSupplierConnections)
        .set({
          onboardingStage: "availability_verified",
          availabilityTestStatus: "success",
          availabilityTestedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      return {
        success: true,
        stage: "availability_verified",
        message: `Live availability verified successfully for ${checkDate}.`,
        details: { slotsCount: slots.length, slots },
      };
    } catch (err: any) {
      await db
        .update(octoSupplierConnections)
        .set({
          availabilityTestStatus: "error",
          lastErrorMessage: err.message,
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      return {
        success: false,
        stage: "catalog_synced",
        message: `Availability verification failed: ${err.message}`,
      };
    }
  }

  /**
   * Stage 7: Test Complete Booking Lifecycle (Hold -> Confirm -> Cancel)
   */
  static async testBookingLifecycle(
    connectionId: string,
    testHoldParams: {
      productId: string;
      optionId: string;
      availabilityId: string;
      unitId: string;
      unitQuantity: number;
    }
  ): Promise<VerificationResult> {
    const db = getDb();
    if (!db) throw new Error("DATABASE_UNAVAILABLE");

    const testUuid = crypto.randomUUID();
    const testDccBookingId = `dcc:bk:test:${testUuid.slice(0, 8)}`;

    try {
      const { adapter } = await this.getAdapter(connectionId);

      // 1. Hold test with 15-minute expiration
      const hold = await adapter.createBookingHold({
        uuid: testUuid,
        productId: testHoldParams.productId,
        optionId: testHoldParams.optionId,
        availabilityId: testHoldParams.availabilityId,
        expirationMinutes: 15,
        unitItems: [{ unitId: testHoldParams.unitId, quantity: testHoldParams.unitQuantity }],
        notes: "DCC Automated Onboarding Synthetic Test",
      });

      if (!hold.uuid || hold.status !== "ON_HOLD") {
        throw new Error(`Hold test returned invalid status: ${hold.status}`);
      }

      // 2. Confirm test
      const confirmed = await adapter.confirmBooking(testUuid, {
        resellerReference: testDccBookingId,
        contact: {
          fullName: "DCC Onboarding Test Bot",
          emailAddress: "qa@destinationcommandcenter.com",
        },
      });

      if (confirmed.status !== "CONFIRMED") {
        throw new Error(`Confirm test returned invalid status: ${confirmed.status}`);
      }

      // 3. Cancel test
      const cancelled = await adapter.cancelBooking(testUuid, "Onboarding verification automated release");
      if (cancelled.status !== "CANCELLED") {
        throw new Error(`Cancel test returned invalid status: ${cancelled.status}`);
      }

      await db
        .update(octoSupplierConnections)
        .set({
          onboardingStage: "booking_tested",
          bookingTestStatus: "success",
          bookingTestedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      return {
        success: true,
        stage: "booking_tested",
        message: "End-to-end booking lifecycle (hold -> confirm -> cancel) verified successfully.",
        details: {
          holdUuid: hold.uuid,
          confirmedAt: confirmed.confirmedAt,
          cancelledAt: cancelled.cancelledAt,
        },
      };
    } catch (err: any) {
      await db
        .update(octoSupplierConnections)
        .set({
          bookingTestStatus: "error",
          lastErrorMessage: err.message,
          updatedAt: new Date(),
        })
        .where(eq(octoSupplierConnections.id, connectionId));

      return {
        success: false,
        stage: "availability_verified",
        message: `Booking lifecycle test failed: ${err.message}`,
      };
    }
  }

  /**
   * Stage 8: Promote Operator to Bookable
   * Strict 7-point audit check before exposing operator to public directory
   */
  static async promoteToBookable(connectionId: string): Promise<VerificationResult> {
    const db = getDb();
    if (!db) throw new Error("DATABASE_UNAVAILABLE");

    const rows = await db
      .select()
      .from(octoSupplierConnections)
      .where(eq(octoSupplierConnections.id, connectionId));

    if (!rows.length) throw new Error(`Connection ${connectionId} not found.`);
    const conn = rows[0];

    const auditChecklist = [
      { rule: "consented", pass: Boolean(conn.signatoryName && conn.signatoryEmail) },
      { rule: "credentials_configured", pass: Boolean(conn.encryptedApiKey || conn.encryptedBearerToken) },
      { rule: "connection_verified", pass: conn.healthStatus === "healthy" },
      { rule: "catalog_synced", pass: conn.catalogSyncStatus === "success" },
      { rule: "availability_verified", pass: conn.availabilityTestStatus === "success" },
      { rule: "booking_tested", pass: conn.bookingTestStatus === "success" },
      { rule: "settlement_terms_agreed", pass: Boolean(conn.settlementTerms || conn.commissionPercent) },
    ];

    const failing = auditChecklist.filter((c) => !c.pass);
    if (failing.length > 0) {
      return {
        success: false,
        stage: (conn.onboardingStage as any) || "discovered",
        message: `Cannot promote to bookable. Failed checks: ${failing.map((f) => f.rule).join(", ")}`,
        details: auditChecklist,
      };
    }

    await db
      .update(octoSupplierConnections)
      .set({
        onboardingStage: "bookable",
        updatedAt: new Date(),
      })
      .where(eq(octoSupplierConnections.id, connectionId));

    await db.insert(octoAuditLogs).values({
      action: "OPERATOR_PROMOTED_TO_BOOKABLE",
      entityType: "SUPPLIER_CONNECTION",
      entityId: connectionId,
      status: "SUCCESS",
      payload: { operatorSlug: conn.operatorSlug, isSandbox: conn.isSandbox },
    });

    return {
      success: true,
      stage: "bookable",
      message: `Operator ${conn.operatorName} is now authorized and bookable on DCC.`,
      details: auditChecklist,
    };
  }

  /**
   * Generates the Pilot Operator Consent & Credential Checklist
   * For the first live pilot candidate (e.g. Ventrata / Bókun)
   */
  static generatePilotChecklist(candidate: "ventrata" | "bokun" = "ventrata") {
    if (candidate === "ventrata") {
      return {
        candidate: "Ventrata Live Operator Pilot",
        participantId: "part_ventrata",
        endpointRecommendation: "https://api.ventrata.com/octo",
        requiredCredentials: [
          {
            name: "API Key / Bearer Token",
            purpose: "Authorization header for OCTO Core endpoints (/suppliers, /products, /availability, /bookings)",
            format: "Bearer <token> or ApiKey <key>",
          },
          {
            name: "Ventrata Supplier ID / Connection Identifier",
            purpose: "Identifies the specific licensed operator account in the Ventrata network",
          },
        ],
        requiredConsent: {
          agreement: "DCC Sovereign Operator Agreement v1.0",
          distributionShare: "5.00% platform commission on completed and honored reservations",
          operatorAuthority: "Operator retains complete ownership of inventory, customer relationship, terms, and cancellations",
          paymentModel: "supplier_hosted (traveler completes checkout via operator-hosted checkout URL)",
        },
        technicalVerificationStages: [
          "1. Health check probe to GET /suppliers",
          "2. Product catalog synchronization to GET /products",
          "3. Real-time availability check to POST /availability",
          "4. 15-minute reservation hold test to POST /bookings with expirationMinutes: 15",
          "5. Confirmation test to POST /bookings/:uuid/confirm",
          "6. Cancellation test to POST /bookings/:uuid/cancel",
          "7. Promotion to live bookable status on DCC",
        ],
      };
    }

    return {
      candidate: "Bókun Live Operator Pilot",
      participantId: "part_bokun",
      endpointRecommendation: "https://api.bokun.io/octo",
      requiredCredentials: [
        {
          name: "Bókun Access Key / Secret",
          purpose: "OCTO Standard header authentication",
        },
      ],
      requiredConsent: {
        agreement: "DCC Sovereign Operator Agreement v1.0",
        distributionShare: "5.00% platform commission",
        operatorAuthority: "Direct booking into Bókun inventory",
        paymentModel: "supplier_hosted",
      },
      technicalVerificationStages: [
        "1. GET /suppliers",
        "2. GET /products",
        "3. POST /availability",
        "4. POST /bookings (hold)",
        "5. POST /bookings/:uuid/confirm",
        "6. POST /bookings/:uuid/cancel",
        "7. Promotion to bookable",
      ],
    };
  }
}
