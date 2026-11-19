import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { LodgeParticipationPanel } from "@/components/LodgeParticipationPanel";
import { PrintFactSheetButton } from "@/components/PrintFactSheetButton";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import {
  DCC_ALASKA_FISHING_LODGES_API_URL,
  SEAK_FISHING_LODGES_CANONICAL_URL,
  SEAK_FISHING_LODGES_PATH,
  SEAK_FISHING_LODGES_RELEASE_READY,
  buildFishingLodgeDetailJsonLd,
} from "@/lib/fishingLodgesConfig";
import { LFSE_SITE_URL } from "@/lib/structuredData";
import {
  SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS,
  UNCLAIMED_LODGE_FACT_SHEET_NOTICE,
  type LodgeClaimScope,
  type LodgeOperationArchetype,
  type PackagePriceState,
  type ProvisionStatus,
  type RemainingAvailabilityState,
  type TransportOperationState,
  type TriStateFact,
} from "../../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesContract";
import {
  findPublishedSoutheastAlaskaFishingLodgeBySlug,
  getPublishedSoutheastAlaskaFishingLodges,
} from "../../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesData";
import styles from "../fishing-lodges.module.css";

const ARCHETYPE_LABELS: Record<LodgeOperationArchetype, string> = {
  all_inclusive_guided_lodge: "All-Inclusive Guided Lodge",
  self_guided_or_hybrid_lodge: "Self-Guided or Hybrid Guided/Unguided Lodge",
  modular_lodging_plus_separate_charters: "Modular Lodging + Separate Local Charters",
  diy_boat_rental_with_lodging_partner: "DIY Boat Rental + Partner Lodging Package",
  whole_property_private_stay_services_separate:
    "Whole-Lodge Private Stay (Services Arranged Separately)",
};

const PRICE_STATE_LABELS: Record<PackagePriceState, string> = {
  published_dated_season_rate: "Published Dated Season Rate",
  published_undated_current_rate: "Published Rate (Season Undated on Source)",
  published_starting_from_rate: "Published Starting-From Rate",
  quote_required: "Direct Quote Required",
};

const TRANSPORT_STATE_LABELS: Record<TransportOperationState, string> = {
  lodge_operated_or_chartered_transfer: "Lodge-Operated or Lodge-Chartered Transfer",
  scheduled_third_party_carrier_corridor: "Scheduled Third-Party Carrier Corridor",
  road_or_local_courtesy_shuttle: "Road System or Local Courtesy Shuttle",
  conflicting_official_transfer_pages:
    "Conflicting Official Transfer Pages — Confirm Directly",
  unknown: "Unknown — Confirm Directly",
};

const AVAILABILITY_STATE_LABELS: Record<RemainingAvailabilityState, string> = {
  not_checked_contact_official_channel:
    "Live Availability Not Checked — Contact Official Channel",
  static_page_note_only_unverified_live:
    "Static Page Note Only (Not Verified Live)",
  verified_live_feed: "Verified Live Feed",
};

const PROVISION_LABELS: Record<ProvisionStatus, string> = {
  included_in_published_package: "Included in published package",
  extra_charge_published: "Extra charge (published amount)",
  extra_charge_quote_required: "Extra charge / quote required",
  arranged_separately_by_guest_or_group: "Arranged separately by guest/group",
  not_provided: "Not provided by lodge",
  conflicting_official_pages_confirm:
    "Conflicting official pages — confirm before booking",
  unknown: "Unknown — confirm directly",
};

const CLAIM_SCOPE_LABELS: Record<LodgeClaimScope, string> = {
  identity_and_roles: "Identity & Entity Roles",
  accommodation_and_capacity: "Accommodation & Capacity",
  package_pricing_and_inclusions: "Packages, Pricing & Inclusions",
  access_and_baggage: "Gateway Access & Baggage",
  fishing_and_regulations: "Fishing & Scoped Rules",
  non_fishing_options: "Non-Fishing & Companion Fit",
};

function formatTriState(val: TriStateFact): string {
  if (val === "yes") return "Yes (documented on official source)";
  if (val === "no") return "No (documented on official source)";
  return "Unknown (not disclosed on retrieved source)";
}

export function generateStaticParams() {
  return getPublishedSoutheastAlaskaFishingLodges().map(({ lodge }) => ({
    lodgeSlug: lodge.slug,
  }));
}

interface LodgeDetailPageProps {
  params: Promise<{ lodgeSlug: string }>;
}

export async function generateMetadata({
  params,
}: LodgeDetailPageProps): Promise<Metadata> {
  const { lodgeSlug } = await params;
  const entry = findPublishedSoutheastAlaskaFishingLodgeBySlug(lodgeSlug);
  if (!entry) {
    return {
      title: "Fishing Lodge Fact Sheet Not Found",
      robots: { index: false, follow: false },
    };
  }
  const { lodge } = entry;
  const canonicalUrl = `${SEAK_FISHING_LODGES_CANONICAL_URL}/${lodge.slug}`;

  return {
    title: `${lodge.displayName} — Southeast Alaska Fishing Lodge Fact Sheet`,
    description: `${lodge.headlineSummary} Review verified property vs. operator roles, scoped package inclusions, gateway access from ${lodge.accommodation.gatewayLabel}, and primary sources.`,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: SEAK_FISHING_LODGES_RELEASE_READY,
      follow: SEAK_FISHING_LODGES_RELEASE_READY,
    },
    openGraph: {
      title: `${lodge.displayName} | Southeast Alaska Fishing Lodges Directory`,
      description: lodge.headlineSummary,
      url: canonicalUrl,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${LFSE_SITE_URL}${lodge.visualRepresentation.imagePath}`,
          width: 1200,
          height: 750,
          alt: lodge.visualRepresentation.imageAlt,
        },
      ],
    },
  };
}

export default async function SoutheastAlaskaFishingLodgeDetailPage({
  params,
}: LodgeDetailPageProps) {
  const { lodgeSlug } = await params;
  const entry = findPublishedSoutheastAlaskaFishingLodgeBySlug(lodgeSlug);
  if (!entry) {
    notFound();
  }

  const { lodge, gate } = entry;
  const jsonLd = buildFishingLodgeDetailJsonLd(lodge);
  const leadPkg = lodge.packages[0]!;
  const leadAccess = lodge.accessConnections[0]!;
  const isWholeProperty = lodge.stayFormat === "whole_lodge_private_property";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Print-only Header */}
      <div className="shell">
        <div className={styles.printOnlyHeader}>
          <h1 style={{ margin: "0 0 4px", fontSize: 21 }}>
            {lodge.displayName} — Independent Southeast Alaska Lodge Fact Sheet
          </h1>
          <p style={{ margin: 0, fontSize: 11 }}>
            Retrieved {lodge.verifiedAt} from {gate.distinctSourceUrlCount}{" "}
            official primary-source URLs ({gate.evidenceCount} cited claims).
            Official website: {lodge.operatingCompany.officialWebsite}
            {lodge.operatingCompany.officialPhone
              ? ` · Phone: ${lodge.operatingCompany.officialPhone}`
              : ""}
          </p>
        </div>
      </div>

      {/* 1. Fact Sheet Hero */}
      <section className={`hero ${styles.noPrint}`}>
        <div className="shell">
          <nav
            className="breadcrumbs"
            aria-label="Breadcrumbs"
            style={{ color: "#cfe5ea" }}
          >
            <Link href="/" style={{ color: "#ffffff" }}>
              Home
            </Link>
            <span>›</span>
            <Link href="/southeast-alaska" style={{ color: "#ffffff" }}>
              Southeast Alaska
            </Link>
            <span>›</span>
            <Link href={SEAK_FISHING_LODGES_PATH} style={{ color: "#ffffff" }}>
              Fishing Lodges
            </Link>
            <span>›</span>
            <span style={{ color: "#cfe5ea" }}>{lodge.displayName}</span>
          </nav>

          <p className="eyebrow">
            {SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS[lodge.subRegion]} · Gateway:{" "}
            {lodge.accommodation.gatewayLabel}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <OperatorIdentityMark name={lodge.displayName} size="lg" />
            <h1 style={{ margin: 0 }}>{lodge.displayName}</h1>
          </div>

          <p className="lead" style={{ color: "#e4f1f4", maxWidth: 860, marginTop: 14 }}>
            {lodge.headlineSummary}
          </p>

          <div className={styles.heroMetaStrip}>
            <span className={styles.heroPill}>
              {isWholeProperty
                ? "Whole-Lodge Private Stay · Services Separate"
                : ARCHETYPE_LABELS[lodge.operationArchetype]}
            </span>
            <span className={styles.heroPill}>
              Unclaimed Public Fact Sheet ($0 Free Inclusion)
            </span>
            <span className={styles.heroPill}>
              {gate.evidenceCount} Cited Claims Across{" "}
              {gate.distinctSourceUrlCount} Official Pages ({lodge.verifiedAt})
            </span>
          </div>

          <div className="cta-row">
            <a
              href={lodge.packageSeller.officialBookingOrInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button"
              data-testid="lodge-primary-official-cta"
            >
              {lodge.packageSeller.primaryCtaLabel} on Official Site ↗
            </a>
            <Link
              href={`${SEAK_FISHING_LODGES_PATH}?compare=${lodge.slug}`}
              className="button secondary"
            >
              Compare Side by Side (Up to 4 Lodges) →
            </Link>
            <PrintFactSheetButton lodgeSlug={lodge.slug} />
            <a href="#corrections-and-claim" className="button secondary">
              Suggest Correction or Claim ($0) ↓
            </a>
          </div>
        </div>
      </section>

      {/* 2. Separate Operational States + Honest Visual Context */}
      <section
        className="section"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid var(--line)",
          paddingTop: 32,
          paddingBottom: 32,
        }}
      >
        <div className="shell">
          <div className="lfse-two-col" style={{ alignItems: "start" }}>
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>
                Separated Operational &amp; Verification States
              </p>
              <h2 style={{ marginTop: 4 }}>
                At-a-Glance Fact Sheet Governance
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 12px" }}>
                {UNCLAIMED_LODGE_FACT_SHEET_NOTICE}
              </p>

              <div className={styles.stateGrid}>
                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>Package Pricing State</span>
                  <strong>{PRICE_STATE_LABELS[leadPkg.priceState]}</strong>
                  <div style={{ fontSize: 12.2, color: "var(--muted)", marginTop: 3 }}>
                    {leadPkg.priceDisplayLabel} ({leadPkg.durationSummaryLabel})
                  </div>
                </div>

                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>
                    Transport Operation State
                  </span>
                  <strong>
                    {TRANSPORT_STATE_LABELS[leadAccess.transportOperationState]}
                  </strong>
                  <div style={{ fontSize: 12.2, color: "var(--muted)", marginTop: 3 }}>
                    {leadAccess.carrierOrDockName}
                  </div>
                </div>

                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>
                    Remaining Availability State
                  </span>
                  <strong>
                    {AVAILABILITY_STATE_LABELS[leadPkg.remainingAvailabilityState]}
                  </strong>
                  <div style={{ fontSize: 12.2, color: "var(--muted)", marginTop: 3 }}>
                    {leadPkg.availabilityNote}
                  </div>
                </div>

                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>
                    Operator Identity vs. Facts
                  </span>
                  <strong>
                    Identity: {lodge.operatingCompany.identityClaimStatus}
                  </strong>
                  <div style={{ fontSize: 12.2, color: "var(--muted)", marginTop: 3 }}>
                    Facts independently sourced from official pages ({lodge.verifiedAt})
                  </div>
                </div>
              </div>
            </div>

            {/* Honest Waterway Visual Representation */}
            <div className={styles.noPrint}>
              <div className={styles.visualContextBox} style={{ marginBottom: 8 }}>
                <img
                  src={lodge.visualRepresentation.imagePath}
                  alt={lodge.visualRepresentation.imageAlt}
                  width={680}
                  height={400}
                  style={{ height: 230 }}
                />
                <div className={styles.visualContextOverlayBadge}>
                  <span className={styles.contextPhotoTag}>
                    {lodge.visualRepresentation.visualDisclosureBadge}
                  </span>
                </div>
                <span className={styles.contextCreditFooter}>
                  {lodge.visualRepresentation.imageCredit}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>
                <strong>Honest Visual Policy:</strong> We never scrape unlicensed
                room or boat photos. Above is verified regional waterway context;{" "}
                <a
                  href={lodge.operatingCompany.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--forest)", fontWeight: 700, textDecoration: "underline" }}
                >
                  view official cabin, vessel, and property photos on{" "}
                  {lodge.operatingCompany.legalOrDisplayName}&apos;s site ↗
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Entity Role Separation: Accommodation vs. Operator vs. Seller vs. Partners */}
      <section className="section" id="entity-roles">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Entity Separation
          </p>
          <h2>
            Physical Accommodation, Operating Company, Seller &amp; Partner Roles
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: 820, margin: "0 0 18px" }}>
            Alaska fishing trips frequently combine a physical hotel or remote
            lodge with separate boat rentals, charter air carriers, or independent
            guides. Here is how {lodge.displayName} is structured according to
            retrieved primary sources:
          </p>

          <div className={styles.rolesGrid}>
            {/* Physical Accommodation */}
            <div className="card" data-testid="entity-card-accommodation">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                1. Physical Accommodation
              </span>
              <h3 style={{ marginTop: 10 }}>{lodge.accommodation.propertyName}</h3>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                <strong>Location:</strong> {lodge.accommodation.actualLocationLabel}
                {lodge.accommodation.streetOrPostalAddress
                  ? ` (${lodge.accommodation.streetOrPostalAddress})`
                  : ""}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Coordinates:</strong>{" "}
                {lodge.accommodation.coordinates.latitude.toFixed(4)}° N,{" "}
                {Math.abs(lodge.accommodation.coordinates.longitude).toFixed(4)}° W{" "}
                <span style={{ color: "var(--muted)", fontSize: 12.2 }}>
                  ({lodge.accommodation.coordinates.coordinateNote})
                </span>
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Rooms &amp; Cabins:</strong>{" "}
                {lodge.accommodation.roomAndCabinSummary}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Bathrooms:</strong>{" "}
                {lodge.accommodation.bathroomConfiguration ===
                "private_ensuite_documented"
                  ? "Private en-suite bathrooms documented"
                  : lodge.accommodation.bathroomConfiguration ===
                      "private_or_group_shared_documented"
                    ? "Private or group-shared bathrooms documented"
                    : "Unknown (not disclosed on retrieved source)"}{" "}
                · <strong>Guest Kitchen:</strong>{" "}
                {formatTriState(lodge.accommodation.guestKitchenOrSelfCaterAccess)}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Meals:</strong> {lodge.accommodation.mealProvisionSummary}
              </p>
              <p style={{ fontSize: 13.2, marginBottom: 6, color: "var(--muted)" }}>
                <strong>Group Size &amp; Children:</strong>{" "}
                {lodge.accommodation.groupSizeGuidanceNote}{" "}
                {lodge.accommodation.childrenAndYouthNote}
              </p>
              <p style={{ fontSize: 13.2, margin: 0, color: "var(--muted)" }}>
                <strong>Documented Accessibility:</strong>{" "}
                {lodge.accommodation.documentedAccessibilityNote}
              </p>
            </div>

            {/* Operating Company */}
            <div className="card" data-testid="entity-card-operator">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                2. Operating Company
              </span>
              <h3 style={{ marginTop: 10 }}>
                {lodge.operatingCompany.legalOrDisplayName}
              </h3>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                {lodge.operatingCompany.ownershipOrHistorySummary}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Relationship to Property:</strong>{" "}
                {lodge.accommodation.relationshipExplanation}
              </p>
              {lodge.operatingCompany.legacyOrBuildingAliases &&
                lodge.operatingCompany.legacyOrBuildingAliases.length > 0 && (
                  <p style={{ fontSize: 13.2, marginBottom: 8 }}>
                    <strong>Documented Building / Historical Names:</strong>{" "}
                    {lodge.operatingCompany.legacyOrBuildingAliases.join(", ")}
                  </p>
                )}
              {lodge.operatingCompany.separationDisambiguationNote && (
                <div className={styles.conflictAlert} style={{ marginBottom: 10 }}>
                  <strong>Entity Disambiguation:</strong>{" "}
                  {lodge.operatingCompany.separationDisambiguationNote}
                </div>
              )}
              <div style={{ marginTop: "auto", paddingTop: 8, fontSize: 13.5 }}>
                <div>
                  <strong>Official Website:</strong>{" "}
                  <a
                    href={lodge.operatingCompany.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--forest)", textDecoration: "underline" }}
                  >
                    {lodge.operatingCompany.officialWebsite} ↗
                  </a>
                </div>
                {lodge.operatingCompany.officialPhone && (
                  <div style={{ marginTop: 4 }}>
                    <strong>Official Phone:</strong>{" "}
                    {lodge.operatingCompany.officialPhone}
                  </div>
                )}
                {lodge.operatingCompany.existingLfseOperatorSlug && (
                  <div style={{ marginTop: 8 }}>
                    <Link
                      href={`/operators/${lodge.operatingCompany.existingLfseOperatorSlug}`}
                      style={{ color: "var(--forest)", fontWeight: 700 }}
                    >
                      View Connected LFSE Excursion Operator Profile →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Package Seller */}
            <div className="card" data-testid="entity-card-seller">
              <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                3. Package Seller &amp; Inquiry Channel
              </span>
              <h3 style={{ marginTop: 10 }}>{lodge.packageSeller.sellerName}</h3>
              <p style={{ fontSize: 13.8, marginBottom: 10 }}>
                {lodge.packageSeller.bookingMechanismSummary}
              </p>
              <div style={{ marginTop: "auto", paddingTop: 10 }}>
                <a
                  href={lodge.packageSeller.officialBookingOrInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button small"
                >
                  {lodge.packageSeller.primaryCtaLabel} Directly ↗
                </a>
              </div>
            </div>

            {/* Partner & Separately Arranged Services */}
            <div className="card" data-testid="entity-card-partners">
              <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>
                4. Partner &amp; Separately Arranged Services
              </span>
              <h3 style={{ marginTop: 10 }}>
                Carriers, Guides &amp; Connected Services
              </h3>
              {lodge.partnerServices.length === 0 ? (
                <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
                  No third-party service partners disclosed on retrieved official
                  pages.
                </p>
              ) : (
                <ul className={styles.cleanList}>
                  {lodge.partnerServices.map((partner, idx) => (
                    <li key={idx}>
                      <strong>{partner.providerName}:</strong> {partner.details}{" "}
                      {partner.existingLfseOperatorSlug ? (
                        <Link
                          href={`/operators/${partner.existingLfseOperatorSlug}`}
                          style={{
                            color: "var(--forest)",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          (LFSE Operator Profile →)
                        </Link>
                      ) : partner.officialUrl ? (
                        <a
                          href={partner.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--forest)",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          (Official Site ↗)
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Scoped Packages & Known Exclusions (NO Synthetic Totals) */}
      <section
        className="section"
        id="packages-and-rates"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Scoped Package Pricing &amp; Exclusions
          </p>
          <h2>
            Published Stays, Applicable Seasons &amp; Costs Requiring a Quote
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: 840, margin: "0 0 20px" }}>
            We publish package prices strictly with their documented season, length
            of stay, occupancy basis, and tax treatment—and never invent blended
            &ldquo;complete trip&rdquo; totals across airfare, licenses, tips, or
            unquoted add-ons.
          </p>

          {lodge.packages.map((pkg) => (
            <article
              key={pkg.packageId}
              className={styles.packageCard}
              data-testid={`package-card-${pkg.packageId}`}
            >
              <div className={styles.packageTopRow}>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                    <span className="badge badge-safety">
                      {pkg.applicableSeason === "season_not_stated_on_source"
                        ? "Season Undated on Official Page"
                        : `${pkg.applicableSeason} Season`}
                    </span>
                    <span className="chip">{pkg.durationSummaryLabel}</span>
                    <span className="chip">{pkg.applicableDatesLabel}</span>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 20 }}>{pkg.packageName}</h3>
                  <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
                    <strong>Occupancy &amp; Boat Basis:</strong>{" "}
                    {pkg.occupancyAndSharingBasis}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--deep)",
                    }}
                  >
                    {pkg.priceDisplayLabel}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                    {pkg.taxDetailNote}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    Source:{" "}
                    <a
                      href={pkg.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      Official rate page ({pkg.retrievedAt}) ↗
                    </a>
                  </div>
                </div>
              </div>

              <div className={styles.packageTwoCol}>
                <div>
                  <strong style={{ color: "var(--deep)", fontSize: 14.5 }}>
                    Verified Inclusions on Official Source
                  </strong>
                  <ul className={styles.cleanList}>
                    {pkg.verifiedInclusions.map((inc, idx) => (
                      <li key={idx}>{inc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ color: "var(--deep)", fontSize: 14.5 }}>
                    Known Exclusions, Separate Rates &amp; Items Requiring a Quote
                  </strong>
                  <ul className={styles.cleanList}>
                    {pkg.knownExclusionsAndAdditionalCharges.map((ex, idx) => (
                      <li key={idx}>
                        <strong>{ex.itemLabel}:</strong>{" "}
                        {ex.publishedAmountNote ? (
                          <span>{ex.publishedAmountNote} — </span>
                        ) : null}
                        <span>{ex.scopeAndRuleNote}</span>
                        {ex.chargeStatus ===
                          "conflicting_official_pages_confirm" && (
                          <div className={styles.conflictAlert}>
                            Conflicting official pages detected — verify in writing
                            before paying deposit.
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--muted)" }}>
                  <strong>Remaining Availability:</strong> {pkg.availabilityNote}
                </span>
                <a
                  href={pkg.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`button small ${styles.noPrint}`}
                >
                  {pkg.ctaLabel} on Official Site ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Gateway Access Connections & Scoped Baggage Rules */}
      <section className="section" id="access-and-baggage">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Gateway Airport, Harbor &amp; Baggage Logistics
          </p>
          <h2>How You Reach {lodge.displayName}</h2>

          <div className="lfse-two-col" style={{ marginTop: 18 }}>
            {lodge.accessConnections.map((conn) => (
              <div key={conn.connectionId} className="card">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  <span className="badge badge-safety">
                    Gateway: {conn.gatewayAirportIata}
                  </span>
                  <span className="chip">{conn.durationLabel}</span>
                  <span className="chip">
                    {PROVISION_LABELS[conn.provisionStatus]}
                  </span>
                </div>
                <h3 style={{ marginTop: 4 }}>{conn.legTitle}</h3>
                <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                  <strong>Carrier / Dock:</strong> {conn.carrierOrDockName}
                </p>
                <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                  <strong>Transfer Rate &amp; Inclusion Note:</strong>{" "}
                  {conn.publishedTransferRateNote}
                </p>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    fontSize: 13.2,
                    marginBottom: 10,
                  }}
                >
                  <strong>
                    Scoped Baggage &amp; Fish Freight Rule (
                    {conn.scopedBaggageAndFreightRule.applicableServiceScope}):
                  </strong>
                  <div style={{ marginTop: 3 }}>
                    {conn.scopedBaggageAndFreightRule.ruleSummary}
                  </div>
                </div>
                <p style={{ fontSize: 13.2, color: "var(--muted)", margin: "0 0 10px" }}>
                  <strong>Check-In &amp; Overnight Buffer:</strong>{" "}
                  {conn.reportingAndOvernightBufferNote}
                </p>
                <div style={{ marginTop: "auto", fontSize: 13 }}>
                  <Link
                    href={`/ports/${conn.gatewayPortSlug}`}
                    style={{ color: "var(--forest)", fontWeight: 700 }}
                  >
                    Open LFSE {conn.gatewayPortSlug.replace(/-/g, " ")} gateway
                    harbor guide →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Fishing Program & Scoped Regulatory Requirements */}
      <section
        className="section"
        id="fishing-and-regulations"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Boats, Target Species &amp; Scoped Rules
          </p>
          <h2>Fishing Program, Fish Processing &amp; Regulatory Scope</h2>

          <div className="lfse-two-col" style={{ marginTop: 18 }}>
            <div className="card">
              <h3>Vessels, Waters &amp; Catch Care</h3>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                <strong>Water Types:</strong>{" "}
                {lodge.fishingProgram.waterTypes.join(" & ")}
              </p>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                <strong>Boats &amp; Gear:</strong>{" "}
                {lodge.fishingProgram.vesselsAndEquipmentSummary}
              </p>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                <strong>Target Species:</strong>{" "}
                {lodge.fishingProgram.targetSpeciesSummary}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Seasonal Run Context:</strong>{" "}
                {lodge.fishingProgram.seasonalRunNote}
              </p>
              <p style={{ fontSize: 13.5, margin: 0 }}>
                <strong>Fish Processing &amp; Airline Boxes:</strong>{" "}
                {lodge.fishingProgram.fishProcessingAndBoxesSummary}
              </p>
            </div>

            <div className="card">
              <h3>Scoped Licenses, Stamps &amp; Operational Rules</h3>
              <p style={{ fontSize: 13.2, color: "var(--muted)", marginTop: 0 }}>
                Requirements below are scoped to the specific activity, guiding mode,
                and season documented on official pages:
              </p>
              <ul className={styles.cleanList}>
                {lodge.fishingProgram.scopedRequirements.map((req, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>
                    <strong>{req.requirementName}</strong>{" "}
                    <span className="chip" style={{ marginLeft: 4 }}>
                      {req.applicableActivityAndDateScope}
                    </span>
                    <div style={{ fontSize: 13.2, marginTop: 2 }}>
                      <em>{PROVISION_LABELS[req.provisionStatus]}:</em> {req.detail}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Non-Fishing Companion Fit & Ecosystem Cross-Links */}
      <section className="section" id="non-fishing-and-ecosystem">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Mixed-Interest Party Planning
          </p>
          <h2>
            Non-Fishing Activities, Simultaneous Companion Fit &amp; Connected Guides
          </h2>

          <div className="lfse-two-col" style={{ marginTop: 18 }}>
            <div className="card">
              <h3>What Non-Anglers Can Actually Expect</h3>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                <strong>Simultaneous Guided Non-Angler Activities Proven?</strong>{" "}
                <span
                  className={`badge ${
                    lodge.nonFishingContext.simultaneousNonAnglerActivitiesProven ===
                    "yes"
                      ? "badge-safety"
                      : "badge-warning"
                  }`}
                >
                  {lodge.nonFishingContext.simultaneousNonAnglerActivitiesProven.toUpperCase()}
                </span>
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 10 }}>
                {lodge.nonFishingContext.simultaneousNonAnglerExplanation}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>On-Site Unguided Gear:</strong>{" "}
                {lodge.nonFishingContext.onSiteUnguidedEquipment.summary}
              </p>
              <p style={{ fontSize: 13.5, margin: 0 }}>
                <strong>Guided Wildlife / Eco Options:</strong>{" "}
                {lodge.nonFishingContext.guidedNonFishingExcursions.summary}
              </p>
            </div>

            <div className="card">
              <h3>Connected Alaska Trip Guides (LFSE · JFD · CP)</h3>
              <p style={{ fontSize: 13.2, color: "var(--muted)", marginTop: 0 }}>
                Combine {lodge.displayName} with pre/post-lodge town stays,
                helicopter flightseeing, or independent ferry legs:
              </p>
              <ul className={styles.cleanList}>
                {lodge.nonFishingContext.contextualEcosystemLinks.map(
                  (link, idx) => (
                    <li key={idx} style={{ marginBottom: 10 }}>
                      {link.surface === "lfse" ? (
                        <Link
                          href={link.href}
                          style={{
                            color: "var(--forest)",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          {link.label} →
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--forest)",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          {link.label} ↗
                        </a>
                      )}
                      <div style={{ fontSize: 12.8, color: "var(--muted)", marginTop: 2 }}>
                        {link.relationshipNote}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Unresolved Questions Checklist */}
          {lodge.unresolvedQuestionsForTraveler.length > 0 && (
            <div
              className="card"
              id="questions-to-confirm"
              style={{
                marginTop: 22,
                background: "#ffffff",
                borderLeft: "4px solid var(--forest)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Questions to Confirm Directly Before Paying a Deposit
              </h3>
              <ul className={styles.cleanList}>
                {lodge.unresolvedQuestionsForTraveler.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 8. Claim-by-Claim Primary-Source Evidence Ledger */}
      <section
        className="section"
        id="primary-source-evidence"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Claim-Level Evidence ({lodge.claimEvidence.length} Primary-Source Citations)
          </p>
          <h2>Primary Sources &amp; Retrieval Ledger</h2>
          <p style={{ color: "var(--muted)", maxWidth: 820, margin: "0 0 16px" }}>
            A reachable homepage never verifies rates, transfers, or inclusions on
            its own. Every published section above maps to the specific retrieved
            pages below:
          </p>

          <div className={styles.evidenceTableWrap}>
            <table className={styles.evidenceTable}>
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Scope</th>
                  <th>Applicable Season / Date</th>
                  <th>Verified Claim Summary</th>
                  <th>Official Source &amp; Check Date</th>
                </tr>
              </thead>
              <tbody>
                {lodge.claimEvidence.map((ev) => (
                  <tr key={ev.claimId}>
                    <td>
                      <code>{ev.claimId}</code>
                    </td>
                    <td>{CLAIM_SCOPE_LABELS[ev.scope]}</td>
                    <td>{ev.applicableSeasonOrDate}</td>
                    <td>
                      <div>{ev.claimSummary}</div>
                      {ev.unresolvedOrConflictNote && (
                        <div className={styles.conflictAlert}>
                          {ev.unresolvedOrConflictNote}
                        </div>
                      )}
                    </td>
                    <td>
                      <a
                        href={ev.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--forest)",
                          fontWeight: 700,
                          textDecoration: "underline",
                        }}
                      >
                        {ev.source.label} ↗
                      </a>
                      <div style={{ fontSize: 11.8, color: "var(--muted)", marginTop: 2 }}>
                        Checked {ev.source.checkedAt}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
            <strong>Canonical DCC Snapshot Feed:</strong>{" "}
            <a
              href={DCC_ALASKA_FISHING_LODGES_API_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              {DCC_ALASKA_FISHING_LODGES_API_URL} ↗
            </a>
          </div>
        </div>
      </section>

      {/* 9. Free Corrections & $0 Operator Claim Flow */}
      <section className={`section ${styles.noPrint}`}>
        <div className="shell">
          <LodgeParticipationPanel
            lodgeSlug={lodge.slug}
            lodgeName={lodge.displayName}
            operatorName={lodge.operatingCompany.legalOrDisplayName}
            officialEmailDomain={lodge.operatingCompany.officialEmailDomain}
            officialPhone={lodge.operatingCompany.officialPhone}
            identityClaimStatus={lodge.operatingCompany.identityClaimStatus}
          />

          <div style={{ marginTop: 22 }}>
            <TrustDisclosure compact />
          </div>
        </div>
      </section>
    </main>
  );
}
