import { getDb } from "@/lib/db/client";
import { octoParticipants, octoSupplierConnections } from "@/lib/db/schema";
import { OctoParticipant, OctoSupplierConnection } from "./types";
import { eq } from "drizzle-orm";
import { encryptCredential } from "./security";

export const INITIAL_OCTO_PARTICIPANTS: OctoParticipant[] = [
  {
    id: "part_ventrata",
    name: "Ventrata",
    role: "booking_system",
    website: "https://ventrata.com",
    contactEmail: "connectivity@ventrata.com",
    contactName: "Ventrata API & Connectivity Team",
    destinations: ["Global", "London", "Paris", "Rome", "New York", "Las Vegas"],
    endpoint: "https://api.ventrata.com/octo",
    certificationEvidence: "OCTO Core Founding Specification Contributor & Certified Provider",
    consentStatus: "requested",
    credentialStatus: "none",
    productsAvailableCount: 1420,
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "technical_onboarding",
    agreedCommissionPercent: 5.0,
    notes: "Primary candidate for first live external enterprise booking system integration.",
  },
  {
    id: "part_bokun",
    name: "Bókun",
    role: "booking_system",
    website: "https://bokun.io",
    contactEmail: "partners@bokun.io",
    contactName: "Bókun Distribution Team",
    destinations: ["Global", "Iceland", "Alaska", "Norway", "North America"],
    endpoint: "https://api.bokun.io/octo",
    certificationEvidence: "OCTO Standard Member Implementation",
    consentStatus: "requested",
    credentialStatus: "none",
    productsAvailableCount: 3800,
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "contract_pending",
    agreedCommissionPercent: 5.0,
    notes: "High concentration of independent Nordic, European, and North American adventure suppliers.",
  },
  {
    id: "part_rezdy",
    name: "Rezdy",
    role: "channel_manager",
    website: "https://rezdy.com",
    contactEmail: "api-support@rezdy.com",
    contactName: "Rezdy Channel Management",
    destinations: ["Australia", "New Zealand", "United States", "Europe"],
    endpoint: "https://api.rezdy.com/octo",
    certificationEvidence: "OCTO Compliant Channel Endpoint",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: 2200,
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "identified",
    agreedCommissionPercent: 5.0,
    notes: "Significant market share in marine, sailing, and regional tour operators.",
  },
  {
    id: "part_tourcms",
    name: "TourCMS (Palisis)",
    role: "booking_system",
    website: "https://tourcms.com",
    contactEmail: "connectivity@palisis.com",
    destinations: ["Europe", "UK", "North America"],
    endpoint: "https://api.tourcms.com/octo",
    certificationEvidence: "OCTO Core Adapter",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: 950,
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "identified",
    agreedCommissionPercent: 5.0,
  },
  {
    id: "part_fareharbor_octo",
    name: "FareHarbor OCTO Gateway",
    role: "booking_system",
    website: "https://fareharbor.com",
    contactEmail: "api-support@fareharbor.com",
    destinations: ["United States", "Hawaii", "Colorado", "Alaska", "Europe"],
    endpoint: "https://fareharbor.com/api/octo",
    certificationEvidence: "OCTO Compatibility Layer",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: 4500,
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "identified",
    agreedCommissionPercent: 5.0,
    notes: "Existing FareHarbor code in DCC can transition to OCTO Core standard.",
  },
  {
    id: "part_vibe_around_town",
    name: "Vibe Around Town",
    role: "supplier",
    website: "https://vibearoundtown.com",
    contactEmail: "partners@vibearoundtown.com",
    contactName: "Vibe Around Operations Team",
    destinations: ["USVI", "St. Thomas", "St. John", "Virgin Islands"],
    endpoint: "https://vibearoundtown.com/api/octo",
    certificationEvidence: "DCC Portfolio Network Member — Direct Operator Pilot Candidate",
    consentStatus: "requested",
    credentialStatus: "none",
    productsAvailableCount: 0,
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "contract_pending",
    agreedCommissionPercent: undefined, // Pending signed commercial contract terms
    notes: "Pilot operator candidate. Missing live OCTO API endpoint configuration, Bearer credentials, and signed operator agreement. Quarantined in authorization_pending.",
  },
  {
    id: "part_mock_alaska",
    name: "Alaska Premier Expeditions (Internal Reference Mock)",
    role: "supplier",
    website: "https://mock-alaska-expeditions.dcc.internal",
    contactEmail: "reservations@mock-alaska-expeditions.dcc.internal",
    contactName: "Capt. Tyler Vance",
    destinations: ["Juneau", "Auke Bay", "Inside Passage"],
    endpoint: "/api/mock/octo",
    certificationEvidence: "Full DCC Reference Mock Suite Conformance (OCTO Core)",
    consentStatus: "consented",
    credentialStatus: "verified",
    productsAvailableCount: 2,
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "technical_onboarding", // Strictly not live_authorized or bookable in production
    agreedCommissionPercent: 5.0,
    notes: "Reference testing supplier for end-to-end sandbox booking hold and confirmation lifecycle.",
  },
];

export class OctoRegistryService {
  /**
   * Seed or sync participants into Neon DB
   */
  static async seedRegistryIfNeeded(): Promise<void> {
    const db = getDb();
    if (!db) return;

    try {
      for (const p of INITIAL_OCTO_PARTICIPANTS) {
        await db
          .insert(octoParticipants)
          .values({
            id: p.id,
            name: p.name,
            role: p.role,
            website: p.website,
            contactEmail: p.contactEmail,
            contactName: p.contactName || null,
            destinations: p.destinations,
            endpoint: p.endpoint || null,
            certificationEvidence: p.certificationEvidence || null,
            consentStatus: p.consentStatus,
            credentialStatus: p.credentialStatus,
            productsAvailableCount: p.productsAvailableCount,
            bookingPaymentModel: p.bookingPaymentModel,
            outreachStatus: p.outreachStatus,
            agreedCommissionPercent: p.agreedCommissionPercent != null ? p.agreedCommissionPercent.toFixed(2) : null,
            notes: p.notes || null,
          })
          .onConflictDoNothing();
      }

      // Seed mock connection marked strictly as sandbox and booking_tested (not bookable)
      await db
        .insert(octoSupplierConnections)
        .values({
          id: "conn_mock_alaska",
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
          consentAgreementVersion: "1.0",
          paymentModel: "supplier_hosted",
          commissionPercent: "5.00",
          healthStatus: "healthy",
          lastSyncAt: new Date(),
        })
        .onConflictDoNothing();

      // Seed Vibe Around Town connection in authorization_pending
      await db
        .insert(octoSupplierConnections)
        .values({
          id: "conn_vibe_around_town",
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
          onboardingStage: "consented",
          consentAgreementVersion: "1.0",
          paymentModel: "supplier_hosted",
          commissionPercent: null, // Pending signed reseller agreement
          healthStatus: "untested",
          provenance: "DCC Portfolio Network Member (USVI)",
          lastErrorMessage: "Awaiting live OCTO API Bearer credentials and operator contract signoff",
        })
        .onConflictDoNothing();
    } catch (err: any) {
      console.error("Registry seed notice:", err.message);
    }
  }

  /**
   * Get all OCTO participants with optional role filter
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
      const rows = await db.select().from(octoParticipants);
      if (!rows.length) return INITIAL_OCTO_PARTICIPANTS;

      let participants: OctoParticipant[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role as any,
        website: r.website,
        contactEmail: r.contactEmail,
        contactName: r.contactName || undefined,
        destinations: (r.destinations as string[]) || [],
        endpoint: r.endpoint || undefined,
        certificationEvidence: r.certificationEvidence || undefined,
        consentStatus: r.consentStatus as any,
        credentialStatus: r.credentialStatus as any,
        productsAvailableCount: r.productsAvailableCount,
        bookingPaymentModel: r.bookingPaymentModel as any,
        outreachStatus: r.outreachStatus as any,
        agreedCommissionPercent: r.agreedCommissionPercent != null ? Number(r.agreedCommissionPercent) : undefined,
        notes: r.notes || undefined,
      }));

      if (role) {
        participants = participants.filter((p) => p.role === role);
      }
      return participants;
    } catch {
      return INITIAL_OCTO_PARTICIPANTS;
    }
  }

  /**
   * List authorized operators with active/healthy connections who have completed full onboarding
   */
  static async getAuthorizedConnections(): Promise<OctoSupplierConnection[]> {
    const db = getDb();
    if (!db) {
      return [];
    }

    try {
      const rows = await db
        .select()
        .from(octoSupplierConnections)
        .where(eq(octoSupplierConnections.onboardingStage, "bookable"));

      return rows
        .filter((r) => r.healthStatus === "healthy")
        .map((r) => ({
          id: r.id,
          operatorSlug: r.operatorSlug,
          operatorName: r.operatorName,
          endpoint: r.endpoint,
          capabilities: (r.capabilities as any) || ["octo/core"],
          isSandbox: r.isSandbox,
          onboardingStage: r.onboardingStage as any,
          operatorLegalName: r.operatorLegalName || undefined,
          businessAddress: r.businessAddress || undefined,
          signatoryName: r.signatoryName || undefined,
          signatoryEmail: r.signatoryEmail || undefined,
          consentAgreementVersion: r.consentAgreementVersion,
          consentTermsText: r.consentTermsText || undefined,
          consentedAt: r.consentedAt ? r.consentedAt.toISOString() : undefined,
          paymentModel: r.paymentModel as any,
          settlementTerms: r.settlementTerms || undefined,
          commissionPercent: Number(r.commissionPercent),
          healthStatus: r.healthStatus as any,
          lastHealthCheckAt: r.lastHealthCheckAt ? r.lastHealthCheckAt.toISOString() : undefined,
          lastHealthCheckStatus: r.lastHealthCheckStatus || undefined,
          catalogSyncStatus: r.catalogSyncStatus || undefined,
          catalogSyncedAt: r.catalogSyncedAt ? r.catalogSyncedAt.toISOString() : undefined,
          availabilityTestStatus: r.availabilityTestStatus || undefined,
          availabilityTestedAt: r.availabilityTestedAt ? r.availabilityTestedAt.toISOString() : undefined,
          bookingTestStatus: r.bookingTestStatus || undefined,
          bookingTestedAt: r.bookingTestedAt ? r.bookingTestedAt.toISOString() : undefined,
          lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : undefined,
          lastErrorMessage: r.lastErrorMessage || undefined,
        }));
    } catch {
      return [];
    }
  }
}
