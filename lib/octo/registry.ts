import { getDb } from "@/lib/db/client";
import { octoParticipants, octoSupplierConnections } from "@/lib/db/schema";
import { OctoParticipant, OctoSupplierConnection } from "./types";
import { eq } from "drizzle-orm";
import { encryptCredential } from "./security";

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
 * supplier role, verified OCTO API access & credentials, active operator consent,
 * a non-empty documented agreementReference, and not FareHarbor affiliate-only.
 */
export function isParticipantLiveAuthorized(participant: OctoParticipant): boolean {
  if (participant.role !== "supplier") return false;
  if (isFareHarborAffiliateOnly(participant)) return false;
  if (participant.id === "part_mock_alaska") return false;
  if (participant.apiAccessStatus !== "verified") return false;
  if (participant.credentialStatus !== "verified") return false;
  if (participant.consentStatus !== "consented") return false;
  if (participant.outreachStatus !== "live_authorized") return false;
  if (!participant.agreementReference || !participant.agreementReference.trim()) return false;
  return true;
}

/**
 * Returns true only when a supplier connection record has documented live OCTO authorization.
 * Sandbox/mock connections and FareHarbor affiliate-only connections are never live-authorized.
 */
export function isConnectionLiveOctoAuthorized(conn: {
  id?: string | null;
  operatorSlug?: string | null;
  isSandbox?: boolean | null;
  onboardingStage?: string | null;
  connectionStatus?: string | null;
  healthStatus?: string | null;
  reservationPlatform?: string | null;
  fareharborOctoAuthorized?: boolean | null;
  fareharborAffiliateOnly?: boolean | null;
  consentAgreementVersion?: string | null;
  consentedAt?: Date | string | null;
  signatoryEmail?: string | null;
  agreementReference?: string | null;
}): boolean {
  if (!conn) return false;
  const id = String(conn.id || "");
  if (conn.isSandbox || id === "conn_mock_alaska" || id.startsWith("mock_")) return false;
  if (conn.operatorSlug === "alaska-premier-expeditions") return false;
  if (isFareHarborAffiliateOnly(conn)) return false;
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

  const hasDocumentedAgreement = Boolean(
    (typeof conn.agreementReference === "string" && conn.agreementReference.trim()) ||
      (conn.consentAgreementVersion && conn.consentedAt && conn.signatoryEmail)
  );
  return hasDocumentedAgreement;
}

export function deriveOctoAuthorizationSummary(
  participants: OctoParticipant[],
  authorizedConnections: OctoSupplierConnection[] = []
) {
  const authorizedSlugs = new Set<string>();
  for (const p of participants) {
    if (isParticipantLiveAuthorized(p)) {
      authorizedSlugs.add(p.id);
    }
  }
  for (const c of authorizedConnections) {
    if (isConnectionLiveOctoAuthorized(c)) {
      authorizedSlugs.add(c.operatorSlug || c.id);
    }
  }

  const agreedCommissionsCount = participants.filter(
    (p) =>
      !isFareHarborAffiliateOnly(p) &&
      p.commercialTermsStatus === "agreed" &&
      Boolean(p.agreementReference?.trim()) &&
      p.agreedCommissionPercent != null
  ).length;

  return {
    totalParticipants: participants.length,
    liveAuthorizedOperatorCount: authorizedSlugs.size,
    agreedCommissionsCount,
  };
}

export const INITIAL_OCTO_PARTICIPANTS: OctoParticipant[] = [
  {
    id: "part_ventrata",
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
    certificationStatus: "unverified",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
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
    notes: "Reference reservation-system profile only. API access, inventory, and commercial terms are unknown.",
  },
  {
    id: "part_bokun",
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
    certificationStatus: "unverified",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
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
    notes: "Reference reservation-system profile only. API access, inventory, and commercial terms are unknown.",
  },
  {
    id: "part_rezdy",
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
    certificationStatus: "unverified",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
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
        claim: "Platform-wide OCTO endpoint access, aggregate inventory count, and commercial terms",
        source: "lib/octo/registry.ts (no Rezdy channel-wide OCTO agreement or synced catalog in DCC)",
        verificationStatus: "unknown",
      },
    ],
    notes: "Reference channel-manager profile only. Platform-wide inventory and commercial terms are unknown.",
  },
  {
    id: "part_tourcms",
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
    certificationStatus: "unverified",
    partnershipStatus: "none",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
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
        claim: "DCC API access, synced product inventory count, and commercial terms",
        source: "lib/octo/registry.ts (no TourCMS credentials, catalog sync, or signed agreement on file)",
        verificationStatus: "unknown",
      },
    ],
    notes: "Reference reservation-system profile only. API access, inventory, and commercial terms are unknown.",
  },
  {
    id: "part_fareharbor_octo",
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
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
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
    certificationStatus: "unverified",
    partnershipStatus: "pilot_candidate_unverified",
    consentStatus: "not_requested",
    credentialStatus: "none",
    productsAvailableCount: null,
    inventoryStatus: "unknown",
    bookingPaymentModel: "unknown",
    outreachStatus: "identified",
    commercialTermsStatus: "unknown",
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
        claim: "Live OCTO endpoint, API credentials, product count, and signed commercial agreement",
        source: "lib/octo/registry.ts (no verified OCTO credentials or signed agreementReference on file)",
        verificationStatus: "unknown",
      },
    ],
    notes:
      "Pilot operator candidate; live OCTO credentials and commercial agreement pending. Quarantined as directory-only.",
  },
  {
    id: "part_mock_alaska",
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
    productsAvailableCount: 2,
    inventoryStatus: "sandbox_mock_only",
    bookingPaymentModel: "supplier_hosted",
    outreachStatus: "technical_onboarding",
    commercialTermsStatus: "sandbox_only",
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
            productsAvailableCount: p.productsAvailableCount ?? 0,
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
   * Get all OCTO participants with optional role filter.
   * Preserves audited unknown fields for unverified entries even if legacy DB seed rows exist.
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
      if (!rows.length) {
        return role
          ? INITIAL_OCTO_PARTICIPANTS.filter((p) => p.role === role)
          : INITIAL_OCTO_PARTICIPANTS;
      }

      let participants: OctoParticipant[] = rows.map((r) => {
        const baseline = INITIAL_PARTICIPANT_MAP.get(r.id);
        if (baseline && r.outreachStatus !== "live_authorized") {
          return baseline;
        }
        const agreementReference = (r as any).agreementReference || null;
        const hasSignedAgreement = Boolean(agreementReference && String(agreementReference).trim());
        const fareharborBlocked = isFareHarborAffiliateOnly({
          id: r.id,
          fareharborOctoAuthorized: baseline?.fareharborOctoAuthorized ?? false,
        });
        const isVerifiedLive =
          !fareharborBlocked &&
          r.role === "supplier" &&
          r.outreachStatus === "live_authorized" &&
          r.credentialStatus === "verified" &&
          r.consentStatus === "consented" &&
          hasSignedAgreement;

        return {
          id: r.id,
          name: r.name,
          role: r.role as any,
          website: r.website,
          contactEmail: r.contactEmail,
          contactName: r.contactName || undefined,
          destinations: (r.destinations as string[]) || [],
          endpoint: isVerifiedLive ? r.endpoint || null : baseline?.endpoint ?? null,
          apiAccessStatus: isVerifiedLive ? "verified" : baseline?.apiAccessStatus ?? "unknown",
          nativeProtocol: baseline?.nativeProtocol || "OCTO Core",
          documentationUrl: baseline?.documentationUrl ?? null,
          certificationEvidence: isVerifiedLive ? r.certificationEvidence || null : null,
          certificationStatus: isVerifiedLive ? "verified" : baseline?.certificationStatus ?? "unverified",
          partnershipStatus: isVerifiedLive ? "verified" : baseline?.partnershipStatus ?? "none",
          consentStatus: isVerifiedLive ? (r.consentStatus as any) : baseline?.consentStatus ?? "not_requested",
          credentialStatus: isVerifiedLive ? (r.credentialStatus as any) : baseline?.credentialStatus ?? "none",
          productsAvailableCount: isVerifiedLive ? r.productsAvailableCount : baseline?.productsAvailableCount ?? null,
          inventoryStatus: isVerifiedLive ? "verified" : baseline?.inventoryStatus ?? "unknown",
          bookingPaymentModel: isVerifiedLive ? (r.bookingPaymentModel as any) : baseline?.bookingPaymentModel ?? "unknown",
          outreachStatus: isVerifiedLive ? "live_authorized" : baseline?.outreachStatus ?? "identified",
          commercialTermsStatus:
            hasSignedAgreement && r.agreedCommissionPercent != null ? "agreed" : baseline?.commercialTermsStatus ?? "unknown",
          agreedCommissionPercent:
            hasSignedAgreement && r.agreedCommissionPercent != null ? Number(r.agreedCommissionPercent) : null,
          agreementReference,
          fareharborOctoAuthorized: baseline?.fareharborOctoAuthorized ?? false,
          evidence: baseline?.evidence || [],
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
   * List authorized operators with active/healthy connections and documented authorization.
   * FareHarbor affiliate-only connections and sandbox fixtures are strictly excluded.
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
        .filter((r) => isConnectionLiveOctoAuthorized(r as any))
        .map((r) => ({
          id: r.id,
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
          signatoryName: r.signatoryName || undefined,
          signatoryEmail: r.signatoryEmail || undefined,
          consentAgreementVersion: r.consentAgreementVersion,
          consentTermsText: r.consentTermsText || undefined,
          consentedAt: r.consentedAt ? r.consentedAt.toISOString() : undefined,
          paymentModel: r.paymentModel as any,
          settlementTerms: r.settlementTerms || undefined,
          commissionPercent: r.commissionPercent != null ? Number(r.commissionPercent) : null,
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

  /**
   * Returns participants along with dynamically derived live-authorization and signed-agreement counts.
   */
  static async getSummary(role?: string) {
    const [allParticipants, authorizedConnections] = await Promise.all([
      this.getParticipants(),
      this.getAuthorizedConnections(),
    ]);
    const summary = deriveOctoAuthorizationSummary(allParticipants, authorizedConnections);
    const participants = role
      ? allParticipants.filter((p) => p.role === role)
      : allParticipants;
    return {
      ...summary,
      participants,
      authorizedConnections,
    };
  }
}
