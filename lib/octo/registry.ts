import { getDb, resolveDatabaseUrl } from "@/lib/db/client";
import {
  octoNormalizedProducts,
  octoOperatorAgreements,
  octoParticipants,
  octoSupplierConnections,
} from "@/lib/db/schema";
import {
  OctoCertificationStatus,
  OctoInventoryStatus,
  OctoOperatorAgreement,
  OctoParticipant,
  OctoSupplierConnection,
} from "./types";
import { eq, sql } from "drizzle-orm";
import { encryptCredential } from "./security";

let postgresSchemaEnsured = false;

export function resolveStableOperatorId(input: {
  operatorId?: string | null;
}): string | null {
  if (typeof input?.operatorId === "string" && input.operatorId.trim()) {
    return input.operatorId.trim();
  }
  return null;
}

export function isActiveOperatorAgreement(
  agreement: Partial<OctoOperatorAgreement> | null | undefined,
  expectedOperatorId?: string | null
): agreement is OctoOperatorAgreement {
  if (!agreement) return false;
  if (agreement.status !== "active") return false;
  if (!agreement.id || !String(agreement.id).trim()) return false;
  const opId = resolveStableOperatorId({ operatorId: agreement.operatorId });
  if (!opId) return false;
  if (expectedOperatorId && opId !== expectedOperatorId.trim()) return false;
  if (!agreement.agreementReference || !String(agreement.agreementReference).trim()) return false;
  if (!agreement.signatoryName || !String(agreement.signatoryName).trim()) return false;
  if (!agreement.signatoryEmail || !String(agreement.signatoryEmail).trim()) return false;
  if (!agreement.signedAt || !String(agreement.signedAt).trim()) return false;
  return true;
}

/**
 * FareHarbor affiliate links, External API v1 access, or Lightframe embeds alone
 * never establish an OCTO-authorized operator connection.
 */
export function isFareHarborAffiliateOnly(input: {
  id?: string | null;
  reservationPlatform?: string | null;
  providerType?: string | null;
  fareharborOctoAuthorized?: boolean | null;
  fareharborAffiliateOnly?: boolean | null;
}): boolean {
  if (input.fareharborAffiliateOnly === true) return true;
  if (input.id === "part_fareharbor_octo" && input.fareharborOctoAuthorized !== true) {
    return true;
  }
  const platform = (input.reservationPlatform || input.providerType || "").toLowerCase();
  if (platform === "fareharbor" && input.fareharborOctoAuthorized !== true) {
    return true;
  }
  return false;
}

/**
 * Returns true only when an operator participant has a documented live OCTO authorization:
 * supplier role, a stable operatorId, verified OCTO API access & credentials, active consent,
 * an active stored operator agreement record for that operatorId, and not FareHarbor affiliate-only.
 */
export function isParticipantLiveAuthorized(
  participant: OctoParticipant,
  agreement?: OctoOperatorAgreement | null
): boolean {
  if (participant.role !== "supplier") return false;
  if (isFareHarborAffiliateOnly(participant)) return false;
  if (participant.id === "part_mock_alaska") return false;
  const operatorId = resolveStableOperatorId(participant);
  if (!operatorId) return false;
  if (participant.apiAccessStatus !== "verified") return false;
  if (participant.credentialStatus !== "verified") return false;
  if (participant.consentStatus !== "consented") return false;
  if (participant.outreachStatus !== "live_authorized") return false;

  if (agreement !== undefined) {
    return isActiveOperatorAgreement(agreement, operatorId);
  }
  if (!participant.agreementId || !participant.agreementId.trim()) return false;
  if (!participant.agreementReference || !participant.agreementReference.trim()) return false;
  return true;
}

/**
 * Returns true only when a supplier connection record has documented live OCTO authorization
 * backed by a stable operatorId and an active stored operator agreement record.
 * Sandbox/mock connections and FareHarbor affiliate-only connections are never live-authorized.
 */
export function isConnectionLiveOctoAuthorized(
  conn: {
    id?: string | null;
    operatorId?: string | null;
    agreementId?: string | null;
    operatorSlug?: string | null;
    isSandbox?: boolean | null;
    onboardingStage?: string | null;
    connectionStatus?: string | null;
    healthStatus?: string | null;
    reservationPlatform?: string | null;
    fareharborOctoAuthorized?: boolean | null;
    fareharborAffiliateOnly?: boolean | null;
    agreementReference?: string | null;
  },
  agreement?: OctoOperatorAgreement | null
): boolean {
  if (!conn) return false;
  const id = String(conn.id || "");
  if (conn.isSandbox || id === "conn_mock_alaska" || id.startsWith("mock_")) return false;
  if (conn.operatorSlug === "alaska-premier-expeditions") return false;
  if (isFareHarborAffiliateOnly(conn)) return false;

  const operatorId = resolveStableOperatorId(conn);
  if (!operatorId) return false;

  if (conn.onboardingStage !== "bookable") return false;
  if (
    conn.connectionStatus &&
    conn.connectionStatus !== "bookable" &&
    conn.connectionStatus !== "authorized" &&
    conn.connectionStatus !== "production_verified"
  ) {
    return false;
  }
  if (conn.healthStatus !== "healthy") return false;

  if (agreement !== undefined) {
    if (!isActiveOperatorAgreement(agreement, operatorId)) return false;
    if (conn.agreementId && conn.agreementId.trim() && agreement.id !== conn.agreementId.trim()) {
      return false;
    }
    return true;
  }

  return Boolean(
    typeof conn.agreementId === "string" &&
      conn.agreementId.trim() &&
      typeof conn.agreementReference === "string" &&
      conn.agreementReference.trim()
  );
}

/**
 * Deduplicates live-authorized operators and agreed commissions using one stable operatorId
 * across octo_participants, octo_supplier_connections, and octo_operator_agreements.
 */
export function deriveOctoAuthorizationSummary(
  participants: OctoParticipant[],
  authorizedConnections: OctoSupplierConnection[] = [],
  activeAgreements?: OctoOperatorAgreement[]
) {
  const agreementByOperatorId = new Map<string, OctoOperatorAgreement>();
  if (activeAgreements) {
    for (const a of activeAgreements) {
      if (isActiveOperatorAgreement(a)) {
        agreementByOperatorId.set(a.operatorId.trim(), a);
      }
    }
  }

  const fareharborBlockedOperatorIds = new Set<string>();
  for (const p of participants) {
    const opId = resolveStableOperatorId(p);
    if (opId && isFareHarborAffiliateOnly(p)) {
      fareharborBlockedOperatorIds.add(opId);
    }
  }
  for (const c of authorizedConnections) {
    const opId = resolveStableOperatorId(c);
    if (opId && isFareHarborAffiliateOnly(c)) {
      fareharborBlockedOperatorIds.add(opId);
    }
  }

  const authorizedOperatorIds = new Set<string>();
  for (const p of participants) {
    const opId = resolveStableOperatorId(p);
    if (!opId) continue;
    const ok = activeAgreements
      ? isParticipantLiveAuthorized(p, agreementByOperatorId.get(opId) ?? null)
      : isParticipantLiveAuthorized(p);
    if (ok) {
      authorizedOperatorIds.add(opId);
    }
  }

  for (const c of authorizedConnections) {
    const opId = resolveStableOperatorId(c);
    if (!opId) continue;
    const ok = activeAgreements
      ? isConnectionLiveOctoAuthorized(c, agreementByOperatorId.get(opId) ?? null)
      : isConnectionLiveOctoAuthorized(c);
    if (ok) {
      authorizedOperatorIds.add(opId);
    }
  }

  const agreedCommissionOperatorIds = new Set<string>();
  if (activeAgreements) {
    for (const [opId, agreement] of agreementByOperatorId.entries()) {
      if (!fareharborBlockedOperatorIds.has(opId) && agreement.agreedCommissionPercent != null) {
        agreedCommissionOperatorIds.add(opId);
      }
    }
  } else {
    for (const p of participants) {
      const opId = resolveStableOperatorId(p);
      if (
        opId &&
        !isFareHarborAffiliateOnly(p) &&
        p.commercialTermsStatus === "agreed" &&
        Boolean(p.agreementId?.trim()) &&
        Boolean(p.agreementReference?.trim()) &&
        p.agreedCommissionPercent != null
      ) {
        agreedCommissionOperatorIds.add(opId);
      }
    }
  }

  return {
    totalParticipants: participants.length,
    liveAuthorizedOperatorCount: authorizedOperatorIds.size,
    agreedCommissionsCount: agreedCommissionOperatorIds.size,
  };
}

export const INITIAL_OCTO_PARTICIPANTS: OctoParticipant[] = [
  {
    id: "part_ventrata",
    operatorId: null,
    name: "Ventrata",
    role: "booking_system",
    website: "https://www.ventrata.com",
    contactEmail: "connectivity@ventrata.com",
    contactName: "Ventrata API & Connectivity Team",
    destinations: [],
    endpoint: null,
    apiAccessStatus: "unknown",
    nativeProtocol: "OCTO Core v1.2.0 (Bearer token required; DCC access unknown)",
    documentationUrl: "https://docs.octo.travel/",
    certificationEvidence: null,
    certificationStatus: "unknown",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    inventoryEvidence: null,
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
    agreementId: null,
    agreedCommissionPercent: null,
    agreementReference: null,
    fareharborOctoAuthorized: false,
    evidence: [
      {
        claim: "Public OCTO specification documents REST JSON endpoints with Bearer authentication",
        source: "https://docs.octo.travel/",
        verificationStatus: "verified",
      },
      {
        claim: "DCC API access, synced product inventory count, certification status, and commercial terms",
        source: "lib/octo/registry.ts (no Ventrata credentials, catalog sync, or signed agreement on file)",
        verificationStatus: "unknown",
      },
    ],
    notes: "Reference reservation-system profile only. API access, inventory, certification, and commercial terms are unknown.",
  },
  {
    id: "part_bokun",
    operatorId: null,
    name: "Bókun",
    role: "booking_system",
    website: "https://www.bokun.io",
    contactEmail: "partners@bokun.io",
    contactName: "Bókun Distribution Team",
    destinations: [],
    endpoint: null,
    apiAccessStatus: "unknown",
    nativeProtocol: "Bókun REST API / OCTO adapter (operator-issued credentials required; DCC access unknown)",
    documentationUrl: "https://bokun.dev/",
    certificationEvidence: null,
    certificationStatus: "unknown",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    inventoryEvidence: null,
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
    agreementId: null,
    agreedCommissionPercent: null,
    agreementReference: null,
    fareharborOctoAuthorized: false,
    evidence: [
      {
        claim: "Public developer documentation describes Bókun REST authentication and activity endpoints",
        source: "https://bokun.dev/",
        verificationStatus: "verified",
      },
      {
        claim: "DCC API access, synced product inventory count, certification status, and commercial terms",
        source: "lib/octo/registry.ts (no Bókun credentials, catalog sync, or signed agreement on file)",
        verificationStatus: "unknown",
      },
    ],
    notes: "Reference reservation-system profile only. API access, inventory, certification, and commercial terms are unknown.",
  },
  {
    id: "part_rezdy",
    operatorId: null,
    name: "Rezdy",
    role: "channel_manager",
    website: "https://www.rezdy.com",
    contactEmail: "api-support@rezdy.com",
    contactName: "Rezdy Channel Management",
    destinations: [],
    endpoint: null,
    apiAccessStatus: "unknown",
    nativeProtocol: "Rezdy Supplier API v1 (apiKey authentication; platform-wide OCTO access unknown)",
    documentationUrl: "https://developers.rezdy.com/",
    certificationEvidence: null,
    certificationStatus: "unknown",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    inventoryEvidence: null,
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
    agreementId: null,
    agreedCommissionPercent: null,
    agreementReference: null,
    fareharborOctoAuthorized: false,
    evidence: [
      {
        claim: "Rezdy publishes Supplier API v1 documentation",
        source: "https://developers.rezdy.com/",
        verificationStatus: "verified",
      },
      {
        claim: "Platform-wide OCTO endpoint access, aggregate inventory count, certification status, and commercial terms",
        source: "lib/octo/registry.ts (no Rezdy channel-wide OCTO agreement or synced catalog in DCC)",
        verificationStatus: "unknown",
      },
    ],
    notes: "Reference channel-manager profile only. Platform-wide inventory, certification, and commercial terms are unknown.",
  },
  {
    id: "part_tourcms",
    operatorId: null,
    name: "TourCMS (Palisis)",
    role: "booking_system",
    website: "https://www.tourcms.com",
    contactEmail: "connectivity@palisis.com",
    destinations: [],
    endpoint: null,
    apiAccessStatus: "unknown",
    nativeProtocol: "TourCMS REST / OCTO profile (operator credentials required; DCC access unknown)",
    documentationUrl: "https://www.tourcms.com/support/api/",
    certificationEvidence: null,
    certificationStatus: "unknown",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    inventoryEvidence: null,
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
    agreementId: null,
    agreedCommissionPercent: null,
    agreementReference: null,
    fareharborOctoAuthorized: false,
    evidence: [
      {
        claim: "TourCMS publishes public API documentation",
        source: "https://www.tourcms.com/support/api/",
        verificationStatus: "verified",
      },
      {
        claim: "DCC API access, synced product inventory count, certification status, and commercial terms",
        source: "lib/octo/registry.ts (no TourCMS credentials, catalog sync, or signed agreement on file)",
        verificationStatus: "unknown",
      },
    ],
    notes: "Reference reservation-system profile only. API access, inventory, certification, and commercial terms are unknown.",
  },
  {
    id: "part_fareharbor_octo",
    operatorId: null,
    name: "FareHarbor",
    role: "booking_system",
    website: "https://fareharbor.com",
    contactEmail: "api-support@fareharbor.com",
    destinations: [],
    endpoint: null,
    apiAccessStatus: "unknown",
    nativeProtocol: "FareHarbor External API v1 & Lightframe embeds (proprietary; not OCTO)",
    documentationUrl: "https://developer.fareharbor.com/",
    certificationEvidence: null,
    certificationStatus: "not_applicable",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    inventoryEvidence: null,
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
    agreementId: null,
    agreedCommissionPercent: null,
    agreementReference: null,
    fareharborOctoAuthorized: false,
    evidence: [
      {
        claim: "FareHarbor uses proprietary External API v1 and Lightframe web embeds; affiliate access alone never marks an operator as OCTO-authorized",
        source: "https://developer.fareharbor.com/",
        verificationStatus: "verified",
      },
      {
        claim: "OCTO endpoint availability, synced OCTO inventory count, and OCTO commercial terms",
        source: "lib/octo/registry.ts (no FareHarbor OCTO connection or booking-system agreement)",
        verificationStatus: "unknown",
      },
    ],
    notes:
      "FareHarbor affiliate links, External API v1 reads, or Lightframe embeds on DCC or partner sites never mark an operator as OCTO-authorized.",
  },
  {
    id: "part_vibe_around_town",
    operatorId: "op_vibe_around_town",
    name: "Vibe Around Town",
    role: "supplier",
    website: "https://vibearoundtown.com",
    contactEmail: "partners@vibearoundtown.com",
    contactName: "Vibe Around Operations Team",
    destinations: ["USVI", "St. Thomas", "St. John", "Virgin Islands"],
    endpoint: null,
    apiAccessStatus: "unknown",
    nativeProtocol: "Direct OCTO candidate (no live endpoint or credentials verified)",
    documentationUrl: null,
    certificationEvidence: null,
    certificationStatus: "unknown",
    partnershipStatus: "pilot_candidate_unverified",
    consentStatus: "not_requested",
    credentialStatus: "none",
    inventoryEvidence: null,
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
    agreementId: null,
    agreedCommissionPercent: null,
    agreementReference: null,
    fareharborOctoAuthorized: false,
    evidence: [
      {
        claim: "Operator domain is listed in DCC portfolio discovery for USVI",
        source: "lib/dcc/portfolioRegistry.ts",
        verificationStatus: "verified",
      },
      {
        claim: "Live OCTO endpoint, API credentials, product count, certification, and signed commercial agreement",
        source: "lib/octo/registry.ts (no verified OCTO credentials or stored operator agreement on file)",
        verificationStatus: "unknown",
      },
    ],
    notes:
      "Pilot operator candidate; live OCTO credentials and commercial agreement pending. Quarantined as directory-only.",
  },
  {
    id: "part_mock_alaska",
    operatorId: "op_mock_alaska",
    name: "Alaska Premier Expeditions (Internal Reference Mock)",
    role: "supplier",
    website: "https://mock-alaska-expeditions.dcc.internal",
    contactEmail: "reservations@mock-alaska-expeditions.dcc.internal",
    contactName: "Reference Sandbox Fixture",
    destinations: ["Juneau", "Auke Bay", "Inside Passage"],
    endpoint: "/api/mock/octo",
    apiAccessStatus: "sandbox_mock_only",
    nativeProtocol: "Internal DCC Mock OCTO Core v1.2.0 Fixture (non-production)",
    documentationUrl: null,
    certificationEvidence: "Internal non-production OCTO Core lifecycle test fixture",
    certificationStatus: "sandbox_reference_only",
    partnershipStatus: "sandbox_mock_only",
    consentStatus: "consented",
    credentialStatus: "verified",
    inventoryEvidence: "lib/octo/mockServer.ts",
    productsAvailableCount: 2,
    inventoryStatus: "sandbox_mock_only",
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "technical_onboarding",
    commercialTermsStatus: "sandbox_only",
    agreementId: null,
    agreedCommissionPercent: null,
    agreementReference: null,
    fareharborOctoAuthorized: false,
    evidence: [
      {
        claim: "Synthetic two-product sandbox fixture used for automated OCTO hold/confirm lifecycle tests",
        source: "lib/octo/mockServer.ts",
        verificationStatus: "verified",
      },
    ],
    notes: "Internal sandbox test supplier only; strictly quarantined from live production authorization.",
  },
];

const INITIAL_PARTICIPANT_MAP = new Map(INITIAL_OCTO_PARTICIPANTS.map((p) => [p.id, p]));

function mapAgreementRow(row: typeof octoOperatorAgreements.$inferSelect): OctoOperatorAgreement {
  const toIso = (val: Date | string | null | undefined): string | null => {
    if (!val) return null;
    if (val instanceof Date) return val.toISOString();
    return String(val);
  };
  return {
    id: row.id,
    operatorId: row.operatorId,
    agreementReference: row.agreementReference,
    status: row.status as OctoOperatorAgreement["status"],
    agreedCommissionPercent:
      row.agreedCommissionPercent != null ? Number(row.agreedCommissionPercent) : null,
    paymentModel: (row.paymentModel as OctoOperatorAgreement["paymentModel"]) || "supplier_hosted",
    signatoryName: row.signatoryName,
    signatoryEmail: row.signatoryEmail,
    signedAt: toIso(row.signedAt) || new Date(0).toISOString(),
    effectiveAt: toIso(row.effectiveAt),
    expiresAt: toIso(row.expiresAt),
    revokedAt: toIso(row.revokedAt),
    documentEvidence: row.documentEvidence ?? null,
    notes: row.notes ?? null,
  };
}

export class OctoRegistryService {
  static async ensureAgreementSchemaIfNeeded(): Promise<void> {
    const db = getDb();
    if (!db) return;
    if (!resolveDatabaseUrl()) return; // SQLite isolated test DB already creates full schema
    if (postgresSchemaEnsured) return;

    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "octo_operator_agreements" (
          "id" text PRIMARY KEY,
          "operator_id" text NOT NULL,
          "agreement_reference" text NOT NULL UNIQUE,
          "status" text NOT NULL DEFAULT 'active',
          "agreed_commission_percent" numeric(5, 2),
          "payment_model" text NOT NULL DEFAULT 'supplier_hosted',
          "signatory_name" text NOT NULL,
          "signatory_email" text NOT NULL,
          "signed_at" timestamptz NOT NULL,
          "effective_at" timestamptz,
          "expires_at" timestamptz,
          "revoked_at" timestamptz,
          "document_evidence" text,
          "notes" text,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz NOT NULL DEFAULT now()
        );
      `);
      await db.execute(
        sql`ALTER TABLE "octo_participants" ADD COLUMN IF NOT EXISTS "operator_id" text;`
      );
      await db.execute(
        sql`ALTER TABLE "octo_participants" ADD COLUMN IF NOT EXISTS "inventory_evidence" text;`
      );
      await db.execute(
        sql`ALTER TABLE "octo_participants" ALTER COLUMN "products_available_count" DROP NOT NULL;`
      );
      await db.execute(
        sql`ALTER TABLE "octo_supplier_connections" ADD COLUMN IF NOT EXISTS "operator_id" text;`
      );
      await db.execute(
        sql`ALTER TABLE "octo_supplier_connections" ADD COLUMN IF NOT EXISTS "agreement_id" text;`
      );
      postgresSchemaEnsured = true;
    } catch {
      // Non-fatal on read-only database roles; queries fall back safely if columns are absent.
    }
  }

  /**
   * Seed or sync baseline participants & reference connections into DB
   */
  static async seedRegistryIfNeeded(): Promise<void> {
    const db = getDb();
    if (!db) return;

    try {
      await this.ensureAgreementSchemaIfNeeded();

      for (const p of INITIAL_OCTO_PARTICIPANTS) {
        await db
          .insert(octoParticipants)
          .values({
            id: p.id,
            operatorId: p.operatorId ?? null,
            name: p.name,
            role: p.role,
            website: p.website,
            contactEmail: p.contactEmail,
            contactName: p.contactName || null,
            destinations: p.destinations,
            endpoint: p.endpoint || null,
            certificationEvidence: p.certificationEvidence || null,
            inventoryEvidence: p.inventoryEvidence || null,
            consentStatus: p.consentStatus,
            credentialStatus: p.credentialStatus,
            productsAvailableCount: p.productsAvailableCount ?? null,
            bookingPaymentModel: p.bookingPaymentModel === "unknown" ? "supplier_hosted" : p.bookingPaymentModel,
            outreachStatus: p.outreachStatus,
            agreedCommissionPercent:
              p.agreementReference && p.agreedCommissionPercent != null
                ? p.agreedCommissionPercent.toFixed(2)
                : null,
            notes: p.notes || null,
          })
          .onConflictDoNothing();
      }

      // Seed mock connection marked strictly as sandbox and booking_tested (not bookable)
      await db
        .insert(octoSupplierConnections)
        .values({
          id: "conn_mock_alaska",
          operatorId: "op_mock_alaska",
          agreementId: null,
          operatorSlug: "alaska-premier-expeditions",
          operatorName: "Alaska Premier Expeditions (Internal Reference Mock)",
          endpoint: "/api/mock/octo",
          encryptedApiKey: encryptCredential("mock_ape_secret_key_2026"),
          encryptedBearerToken: null,
          capabilities: ["octo/core", "octo/pricing", "octo/content", "octo/pickups"],
          isSandbox: true,
          connectionStatus: "sandbox_verified",
          reservationPlatform: "direct_octo",
          onboardingStage: "booking_tested", // NOT bookable
          consentAgreementVersion: "sandbox-fixture",
          paymentModel: "supplier_hosted",
          commissionPercent: null,
          healthStatus: "healthy",
          lastSyncAt: new Date(),
        })
        .onConflictDoNothing();

      // Seed Vibe Around Town connection in authorization_pending sharing op_vibe_around_town
      await db
        .insert(octoSupplierConnections)
        .values({
          id: "conn_vibe_around_town",
          operatorId: "op_vibe_around_town",
          agreementId: null,
          operatorSlug: "vibe-around-town",
          operatorName: "Vibe Around Town",
          endpoint: "https://vibearoundtown.com/api/octo",
          encryptedApiKey: null,
          encryptedBearerToken: null,
          capabilities: ["octo/core"],
          isSandbox: true,
          connectionStatus: "authorization_pending",
          reservationPlatform: "direct_octo",
          octoBaseUrl: "https://vibearoundtown.com/api/octo",
          onboardingStage: "discovered",
          consentAgreementVersion: "unsigned",
          paymentModel: "supplier_hosted",
          commissionPercent: null,
          healthStatus: "untested",
          provenance: "DCC Portfolio Network Member (USVI)",
          lastErrorMessage: "Awaiting verified OCTO API credentials and signed operator agreement",
        })
        .onConflictDoNothing();
    } catch (err: any) {
      console.error("Registry seed notice:", err.message);
    }
  }

  /**
   * Retrieve all stored operator agreements from octo_operator_agreements.
   */
  static async getOperatorAgreements(options?: {
    activeOnly?: boolean;
  }): Promise<OctoOperatorAgreement[]> {
    const db = getDb();
    if (!db) return [];

    try {
      await this.ensureAgreementSchemaIfNeeded();
      const rows = await db.select().from(octoOperatorAgreements);
      const mapped = rows.map(mapAgreementRow);
      if (options?.activeOnly) {
        return mapped.filter((a) => isActiveOperatorAgreement(a));
      }
      return mapped;
    } catch {
      return [];
    }
  }

  /**
   * Look up an active stored agreement record for a canonical operatorId (and optional agreementId).
   */
  static async getActiveAgreementForOperator(
    operatorId?: string | null,
    agreementId?: string | null
  ): Promise<OctoOperatorAgreement | null> {
    const cleanOperatorId = resolveStableOperatorId({ operatorId });
    if (!cleanOperatorId) return null;
    const db = getDb();
    if (!db) return null;

    try {
      await this.ensureAgreementSchemaIfNeeded();
      const rows = await db
        .select()
        .from(octoOperatorAgreements)
        .where(eq(octoOperatorAgreements.operatorId, cleanOperatorId));

      for (const row of rows) {
        const mapped = mapAgreementRow(row);
        if (!isActiveOperatorAgreement(mapped, cleanOperatorId)) continue;
        if (agreementId && agreementId.trim() && mapped.id !== agreementId.trim()) continue;
        return mapped;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get all OCTO participants with optional role filter.
   * Joins stored operator agreements by stable operatorId and keeps inventory & certification
   * unknown until each has its own independent evidence.
   */
  static async getParticipants(role?: string): Promise<OctoParticipant[]> {
    const db = getDb();
    if (!db) {
      return role
        ? INITIAL_OCTO_PARTICIPANTS.filter((p) => p.role === role)
        : INITIAL_OCTO_PARTICIPANTS;
    }

    try {
      await this.seedRegistryIfNeeded();
      const [rows, activeAgreements, connectionRows, productRows] = await Promise.all([
        db.select().from(octoParticipants),
        this.getOperatorAgreements({ activeOnly: true }),
        db.select().from(octoSupplierConnections),
        db
          .select({ supplierConnectionId: octoNormalizedProducts.supplierConnectionId })
          .from(octoNormalizedProducts),
      ]);

      if (!rows.length) {
        return role
          ? INITIAL_OCTO_PARTICIPANTS.filter((p) => p.role === role)
          : INITIAL_OCTO_PARTICIPANTS;
      }

      const activeAgreementByOperatorId = new Map<string, OctoOperatorAgreement>();
      for (const a of activeAgreements) {
        activeAgreementByOperatorId.set(a.operatorId.trim(), a);
      }

      const productCountByConnId = new Map<string, number>();
      for (const pr of productRows) {
        productCountByConnId.set(
          pr.supplierConnectionId,
          (productCountByConnId.get(pr.supplierConnectionId) ?? 0) + 1
        );
      }

      const syncedProductCountByOperatorId = new Map<string, number>();
      const platformByOperatorId = new Map<string, string>();
      for (const c of connectionRows) {
        const opId = resolveStableOperatorId(c);
        if (!opId) continue;
        if (c.reservationPlatform) {
          platformByOperatorId.set(opId, c.reservationPlatform);
        }
        if (!c.isSandbox && c.catalogSyncStatus === "success") {
          const count = productCountByConnId.get(c.id) ?? 0;
          if (count > 0) {
            syncedProductCountByOperatorId.set(
              opId,
              (syncedProductCountByOperatorId.get(opId) ?? 0) + count
            );
          }
        }
      }

      let participants: OctoParticipant[] = rows.map((r) => {
        const baseline = INITIAL_PARTICIPANT_MAP.get(r.id);
        const operatorId = resolveStableOperatorId(r) ?? baseline?.operatorId ?? null;
        const activeAgreement = operatorId
          ? activeAgreementByOperatorId.get(operatorId) ?? null
          : null;

        if (baseline && r.outreachStatus !== "live_authorized" && !activeAgreement) {
          return baseline;
        }

        const fareharborBlocked = isFareHarborAffiliateOnly({
          id: r.id,
          reservationPlatform: operatorId ? platformByOperatorId.get(operatorId) : undefined,
          fareharborOctoAuthorized: baseline?.fareharborOctoAuthorized ?? false,
        });

        const isVerifiedLive =
          !fareharborBlocked &&
          r.role === "supplier" &&
          r.id !== "part_mock_alaska" &&
          Boolean(operatorId) &&
          r.outreachStatus === "live_authorized" &&
          r.credentialStatus === "verified" &&
          r.consentStatus === "consented" &&
          Boolean(activeAgreement);

        // Certification remains unknown unless explicit certificationEvidence is recorded
        const rawCertEvidence =
          typeof r.certificationEvidence === "string" && r.certificationEvidence.trim()
            ? r.certificationEvidence.trim()
            : null;
        let certificationStatus: OctoCertificationStatus = "unknown";
        let certificationEvidence: string | null = null;
        if (r.id === "part_mock_alaska") {
          certificationStatus = "sandbox_reference_only";
          certificationEvidence = baseline?.certificationEvidence ?? null;
        } else if (r.id === "part_fareharbor_octo") {
          certificationStatus = "not_applicable";
          certificationEvidence = null;
        } else if (rawCertEvidence) {
          certificationStatus = "verified";
          certificationEvidence = rawCertEvidence;
        }

        // Inventory remains unknown unless backed by explicit inventoryEvidence or a verified non-sandbox catalog sync
        const rawInventoryEvidence =
          typeof r.inventoryEvidence === "string" && r.inventoryEvidence.trim()
            ? r.inventoryEvidence.trim()
            : null;
        const syncedCount = operatorId ? syncedProductCountByOperatorId.get(operatorId) ?? 0 : 0;

        let inventoryStatus: OctoInventoryStatus = "unknown";
        let productsAvailableCount: number | null = null;
        let inventoryEvidence: string | null = null;

        if (r.id === "part_mock_alaska") {
          inventoryStatus = "sandbox_mock_only";
          productsAvailableCount = baseline?.productsAvailableCount ?? 2;
          inventoryEvidence = baseline?.inventoryEvidence ?? null;
        } else if (rawInventoryEvidence && r.productsAvailableCount != null && r.productsAvailableCount >= 0) {
          inventoryStatus = "verified";
          productsAvailableCount = r.productsAvailableCount;
          inventoryEvidence = rawInventoryEvidence;
        } else if (syncedCount > 0) {
          inventoryStatus = "verified";
          productsAvailableCount = syncedCount;
          inventoryEvidence = "octo_normalized_products (catalog_synced)";
        }

        const hasValidAgreement = Boolean(activeAgreement && !fareharborBlocked);
        const agreedCommissionPercent =
          hasValidAgreement && activeAgreement!.agreedCommissionPercent != null
            ? activeAgreement!.agreedCommissionPercent
            : null;

        const evidence = [...(baseline?.evidence || [])];
        if (hasValidAgreement) {
          evidence.push({
            claim: `Stored operator agreement (${activeAgreement!.agreementReference}) signed by ${activeAgreement!.signatoryEmail}`,
            source: activeAgreement!.documentEvidence || `octo_operator_agreements:${activeAgreement!.id}`,
            verificationStatus: "verified",
          });
        }
        if (isVerifiedLive && inventoryStatus === "unknown") {
          evidence.push({
            claim: "Synced OCTO product inventory count",
            source: "octo_participants.inventory_evidence (awaiting verified catalog sync)",
            verificationStatus: "unknown",
          });
        }
        if (isVerifiedLive && certificationStatus === "unknown") {
          evidence.push({
            claim: "Formal OCTO protocol certification artifact",
            source: "octo_participants.certification_evidence (no certification artifact on file)",
            verificationStatus: "unknown",
          });
        }

        return {
          id: r.id,
          operatorId,
          name: r.name,
          role: r.role as OctoParticipant["role"],
          website: r.website,
          contactEmail: r.contactEmail,
          contactName: r.contactName || undefined,
          destinations: (r.destinations as string[]) || [],
          endpoint: isVerifiedLive ? r.endpoint || null : baseline?.endpoint ?? null,
          apiAccessStatus: isVerifiedLive ? "verified" : baseline?.apiAccessStatus ?? "unknown",
          nativeProtocol: baseline?.nativeProtocol || "OCTO Core",
          documentationUrl: baseline?.documentationUrl ?? null,
          certificationEvidence,
          certificationStatus,
          partnershipStatus: isVerifiedLive ? "verified" : baseline?.partnershipStatus ?? "none",
          consentStatus: isVerifiedLive ? (r.consentStatus as OctoParticipant["consentStatus"]) : baseline?.consentStatus ?? "not_requested",
          credentialStatus: isVerifiedLive
            ? (r.credentialStatus as OctoParticipant["credentialStatus"])
            : baseline?.credentialStatus ?? "none",
          inventoryEvidence,
          productsAvailableCount,
          inventoryStatus,
          bookingPaymentModel: hasValidAgreement
            ? activeAgreement!.paymentModel
            : baseline?.bookingPaymentModel ?? "unknown",
          outreachStatus: isVerifiedLive ? "live_authorized" : baseline?.outreachStatus ?? "identified",
          commercialTermsStatus:
            r.id === "part_mock_alaska"
              ? "sandbox_only"
              : agreedCommissionPercent != null
              ? "agreed"
              : "unknown",
          agreementId: hasValidAgreement ? activeAgreement!.id : null,
          agreedCommissionPercent,
          agreementReference: hasValidAgreement ? activeAgreement!.agreementReference : null,
          fareharborOctoAuthorized: baseline?.fareharborOctoAuthorized ?? false,
          evidence,
          notes: r.notes || baseline?.notes || undefined,
        };
      });

      if (role) {
        participants = participants.filter((p) => p.role === role);
      }
      return participants;
    } catch {
      return role
        ? INITIAL_OCTO_PARTICIPANTS.filter((p) => p.role === role)
        : INITIAL_OCTO_PARTICIPANTS;
    }
  }

  /**
   * List authorized operators with active/healthy connections and a stored active operator agreement
   * matching the connection's stable operatorId.
   */
  static async getAuthorizedConnections(): Promise<OctoSupplierConnection[]> {
    const db = getDb();
    if (!db) {
      return [];
    }

    try {
      await this.ensureAgreementSchemaIfNeeded();
      const [rows, activeAgreements] = await Promise.all([
        db
          .select()
          .from(octoSupplierConnections)
          .where(eq(octoSupplierConnections.onboardingStage, "bookable")),
        this.getOperatorAgreements({ activeOnly: true }),
      ]);

      const activeAgreementByOperatorId = new Map<string, OctoOperatorAgreement>();
      for (const a of activeAgreements) {
        activeAgreementByOperatorId.set(a.operatorId.trim(), a);
      }

      return rows
        .filter((r) => {
          const opId = resolveStableOperatorId(r);
          const agreement = opId ? activeAgreementByOperatorId.get(opId) ?? null : null;
          return isConnectionLiveOctoAuthorized(r as any, agreement);
        })
        .map((r) => {
          const opId = resolveStableOperatorId(r)!;
          const agreement = activeAgreementByOperatorId.get(opId)!;
          return {
            id: r.id,
            operatorId: opId,
            agreementId: agreement.id,
            agreementReference: agreement.agreementReference,
            operatorSlug: r.operatorSlug,
            operatorName: r.operatorName,
            endpoint: r.endpoint,
            capabilities: (r.capabilities as any) || ["octo/core"],
            isSandbox: r.isSandbox,
            connectionStatus: (r.connectionStatus as any) || "bookable",
            reservationPlatform: (r.reservationPlatform as any) || "direct_octo",
            onboardingStage: r.onboardingStage as any,
            operatorLegalName: r.operatorLegalName || undefined,
            businessAddress: r.businessAddress || undefined,
            signatoryName: agreement.signatoryName || r.signatoryName || undefined,
            signatoryEmail: agreement.signatoryEmail || r.signatoryEmail || undefined,
            consentAgreementVersion: r.consentAgreementVersion,
            consentTermsText: r.consentTermsText || undefined,
            consentedAt: r.consentedAt ? r.consentedAt.toISOString() : agreement.signedAt,
            paymentModel: (agreement.paymentModel || r.paymentModel) as any,
            settlementTerms: r.settlementTerms || undefined,
            commissionPercent:
              agreement.agreedCommissionPercent != null
                ? agreement.agreedCommissionPercent
                : r.commissionPercent != null
                ? Number(r.commissionPercent)
                : null,
            healthStatus: r.healthStatus as any,
            lastHealthCheckAt: r.lastHealthCheckAt ? r.lastHealthCheckAt.toISOString() : undefined,
            lastHealthCheckStatus: r.lastHealthCheckStatus || undefined,
            catalogSyncStatus: r.catalogSyncStatus || undefined,
            catalogSyncedAt: r.catalogSyncedAt ? r.catalogSyncedAt.toISOString() : undefined,
            availabilityTestStatus: r.availabilityTestStatus || undefined,
            availabilityTestedAt: r.availabilityTestedAt
              ? r.availabilityTestedAt.toISOString()
              : undefined,
            bookingTestStatus: r.bookingTestStatus || undefined,
            bookingTestedAt: r.bookingTestedAt ? r.bookingTestedAt.toISOString() : undefined,
            lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : undefined,
            lastErrorMessage: r.lastErrorMessage || undefined,
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Returns participants along with dynamically derived live-authorization and signed-agreement counts,
   * deduplicated by stable operatorId across directory, connection, and stored agreement records.
   */
  static async getSummary(role?: string) {
    const [allParticipants, authorizedConnections, activeAgreements] = await Promise.all([
      this.getParticipants(),
      this.getAuthorizedConnections(),
      this.getOperatorAgreements({ activeOnly: true }),
    ]);

    const participants = role
      ? allParticipants.filter((p) => p.role === role)
      : allParticipants;
    const includeSuppliers = !role || role === "supplier";
    const scopedConnections = includeSuppliers ? authorizedConnections : [];
    const scopedAgreements = includeSuppliers ? activeAgreements : [];

    const summary = deriveOctoAuthorizationSummary(
      participants,
      scopedConnections,
      scopedAgreements
    );

    return {
      ...summary,
      participants,
      authorizedConnections: scopedConnections,
      activeAgreements: scopedAgreements,
    };
  }
}
