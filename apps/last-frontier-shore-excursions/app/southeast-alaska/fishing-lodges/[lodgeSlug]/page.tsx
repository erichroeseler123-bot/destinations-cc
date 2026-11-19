import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { LodgeParticipationPanel } from "@/components/LodgeParticipationPanel";
import { PrintFactSheetButton } from "@/components/PrintFactSheetButton";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import {
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
  type ProvisionStatus,
  type RemainingAvailabilityState,
  type TriStateFact,
} from "../../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesContract";
import {
  findPublishedSoutheastAlaskaFishingLodgeBySlug,
  getPublishedSoutheastAlaskaFishingLodges,
} from "../../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesData";
import styles from "../fishing-lodges.module.css";

const ARCHETYPE_LABELS: Record<LodgeOperationArchetype, string> = {
  all_inclusive_guided_lodge: "All-Inclusive Guided Lodge",
  self_guided_or_hybrid_lodge: "Self-Guided or Hybrid Guided/Unguided",
  modular_lodging_plus_separate_charters: "Lodge Stay + Separate Local Charters",
  diy_boat_rental_with_lodging_partner: "Self-Guided Boat Rental + Partner Hotel",
  whole_property_private_stay_services_separate:
    "Whole-Lodge Private Stay (Services Arranged Separately)",
};

const AVAILABILITY_LABELS: Record<RemainingAvailabilityState, string> = {
  not_checked_contact_official_channel: "Check directly with the lodge",
  static_page_note_only_unverified_live:
    "General note on website — confirm current openings directly",
  verified_live_feed: "Live availability shown",
};

const PROVISION_LABELS: Record<ProvisionStatus, string> = {
  included_in_published_package: "Included in package",
  extra_charge_published: "Extra fee (published rate)",
  extra_charge_quote_required: "Extra cost — request quote",
  arranged_separately_by_guest_or_group: "Arranged separately",
  not_provided: "Not provided by lodge",
  conflicting_official_pages_confirm:
    "Official pages differ — confirm before booking",
  unknown: "Not listed — confirm with lodge",
};

const CLAIM_SCOPE_LABELS: Record<LodgeClaimScope, string> = {
  identity_and_roles: "Business & Booking Setup",
  accommodation_and_capacity: "Rooms, Meals & Group Size",
  package_pricing_and_inclusions: "Rates & What's Included",
  access_and_baggage: "Getting There & Baggage",
  fishing_and_regulations: "Fishing, Processing & Licenses",
  non_fishing_options: "Non-Angler & Companion Options",
};

function formatYesNoUnknown(val: TriStateFact): string {
  if (val === "yes") return "Yes";
  if (val === "no") return "No";
  return "Not listed — confirm with lodge";
}

function formatNonAnglerBadge(val: TriStateFact): string {
  if (val === "yes") return "Guided Non-Fishing Outings Offered";
  if (val === "no") return "Fishing-Focused Program";
  return "Guided Non-Angler Outings Not Confirmed";
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
      title: "Fishing Lodge Not Found",
      robots: { index: false, follow: false },
    };
  }
  const { lodge } = entry;
  const canonicalUrl = `${SEAK_FISHING_LODGES_CANONICAL_URL}/${lodge.slug}`;

  return {
    title: `${lodge.displayName} — Southeast Alaska Fishing Lodge Guide`,
    description: `${lodge.headlineSummary} Compare rates, what's included, fishing setup, non-angler options, and transfers via ${lodge.accommodation.gatewayLabel}.`,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: SEAK_FISHING_LODGES_RELEASE_READY,
      follow: SEAK_FISHING_LODGES_RELEASE_READY,
    },
    openGraph: {
      title: `${lodge.displayName} | Southeast Alaska Fishing Lodges`,
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
  const rolesDiffer =
    lodge.accommodation.propertyName !==
      lodge.operatingCompany.legalOrDisplayName ||
    lodge.operatingCompany.legalOrDisplayName !==
      lodge.packageSeller.sellerName ||
    isWholeProperty ||
    lodge.operationArchetype === "modular_lodging_plus_separate_charters";

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Print-only Header */}
      <div className="shell">
        <div className={styles.printOnlyHeader}>
          <h1 style={{ margin: "0 0 4px", fontSize: 20 }}>
            {lodge.displayName} — Southeast Alaska Lodge Summary
          </h1>
          <p style={{ margin: 0, fontSize: 10.5 }}>
            Checked {lodge.verifiedAt} across {gate.distinctSourceUrlCount}{" "}
            official pages. Official website:{" "}
            {lodge.operatingCompany.officialWebsite}
            {lodge.operatingCompany.officialPhone
              ? ` · Phone: ${lodge.operatingCompany.officialPhone}`
              : ""}
          </p>
        </div>
      </div>

      {/* 1. Lodge Hero */}
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
            {SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS[lodge.subRegion]} ·
            Gateway: {lodge.accommodation.gatewayLabel}
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

          <p
            className="lead"
            style={{ color: "#e4f1f4", maxWidth: 860, marginTop: 14 }}
          >
            {lodge.headlineSummary}
          </p>

          <div className={styles.heroMetaStrip}>
            <span className={styles.heroPill}>
              {isWholeProperty
                ? "Whole-Lodge Private Stay · Services Separate"
                : ARCHETYPE_LABELS[lodge.operationArchetype]}
            </span>
            <span className={styles.heroPill}>Free listing</span>
            <span className={styles.heroPill}>
              Checked {lodge.verifiedAt} ({gate.distinctSourceUrlCount} official
              pages)
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
              Compare Side by Side →
            </Link>
            <PrintFactSheetButton lodgeSlug={lodge.slug} />
            <a href="#corrections-and-claim" className="button secondary">
              Suggest an Update or Claim Listing ↓
            </a>
          </div>
        </div>
      </section>

      {/* 2. Plain-Language Trip Snapshot + Concise Regional Scenery Disclosure */}
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
                At a Glance
              </p>
              <h2 style={{ marginTop: 4 }}>Trip Snapshot</h2>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  margin: "0 0 12px",
                }}
              >
                {UNCLAIMED_LODGE_FACT_SHEET_NOTICE}
              </p>

              <div className={styles.stateGrid}>
                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>
                    Price &amp; Stay Length
                  </span>
                  <strong>{leadPkg.priceDisplayLabel}</strong>
                  <div
                    style={{
                      fontSize: 12.2,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    {leadPkg.durationSummaryLabel} ·{" "}
                    {leadPkg.applicableSeason === "season_not_stated_on_source"
                      ? "Confirm season year with lodge"
                      : `${leadPkg.applicableSeason} season`}
                  </div>
                </div>

                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>Getting There</span>
                  <strong>{leadAccess.legTitle}</strong>
                  <div
                    style={{
                      fontSize: 12.2,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    {PROVISION_LABELS[leadAccess.provisionStatus]} ·{" "}
                    {leadAccess.carrierOrDockName}
                  </div>
                </div>

                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>Availability</span>
                  <strong>
                    {AVAILABILITY_LABELS[leadPkg.remainingAvailabilityState]}
                  </strong>
                  <div
                    style={{
                      fontSize: 12.2,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    {leadPkg.availabilityNote}
                  </div>
                </div>

                <div className={styles.stateCard}>
                  <span className={styles.stateKicker}>Who You Book With</span>
                  <strong>{lodge.packageSeller.sellerName}</strong>
                  <div
                    style={{
                      fontSize: 12.2,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    Property: {lodge.accommodation.propertyName}
                  </div>
                </div>
              </div>
            </div>

            {/* Regional Scenery Card */}
            <div className={styles.noPrint}>
              <div
                className={styles.visualContextBox}
                style={{ marginBottom: 8 }}
              >
                <img
                  src={lodge.visualRepresentation.imagePath}
                  alt={lodge.visualRepresentation.imageAlt}
                  width={680}
                  height={400}
                  style={{ height: 225 }}
                />
                <div className={styles.visualContextOverlayBadge}>
                  <span className={styles.contextPhotoTag}>
                    Regional scenery
                  </span>
                </div>
                <span className={styles.contextCreditFooter}>
                  {lodge.visualRepresentation.imageCredit}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12.8, color: "var(--muted)" }}>
                Regional scenery;{" "}
                <a
                  href={lodge.operatingCompany.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--forest)",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  see the lodge&apos;s website for property photos ↗
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Prices, Duration, Inclusions & Additional Costs */}
      <section className="section" id="packages-and-rates">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Rates, Stay Length &amp; What&apos;s Included
          </p>
          <h2>Published Stays &amp; Additional Costs to Budget For</h2>
          <p
            style={{
              color: "var(--muted)",
              maxWidth: 840,
              margin: "0 0 20px",
            }}
          >
            Published rates are listed for their specific season, stay length,
            and occupancy—alongside excluded expenses and items that require a
            direct quote.
          </p>

          {lodge.packages.map((pkg) => (
            <article
              key={pkg.packageId}
              className={styles.packageCard}
              data-testid={`package-card-${pkg.packageId}`}
            >
              <div className={styles.packageTopRow}>
                <div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <span className="badge badge-safety">
                      {pkg.applicableSeason === "season_not_stated_on_source"
                        ? "Confirm Season Year with Lodge"
                        : `${pkg.applicableSeason} Season`}
                    </span>
                    <span className="chip">{pkg.durationSummaryLabel}</span>
                    <span className="chip">{pkg.applicableDatesLabel}</span>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 20 }}>
                    {pkg.packageName}
                  </h3>
                  <div style={{ fontSize: 13.5, color: "var(--muted)" }}>
                    <strong>Occupancy &amp; Boat Sharing:</strong>{" "}
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
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    Checked {pkg.retrievedAt} ·{" "}
                    <a
                      href={pkg.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      Official rate page ↗
                    </a>
                  </div>
                </div>
              </div>

              <div className={styles.packageTwoCol}>
                <div>
                  <strong style={{ color: "var(--deep)", fontSize: 14.5 }}>
                    What&apos;s Included
                  </strong>
                  <ul className={styles.cleanList}>
                    {pkg.verifiedInclusions.map((inc, idx) => (
                      <li key={idx}>{inc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ color: "var(--deep)", fontSize: 14.5 }}>
                    Additional Costs &amp; Items to Confirm
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
                            Official pages differ on this item — confirm in
                            writing before paying a deposit.
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
                  <strong>Openings:</strong> {pkg.availabilityNote}
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

      {/* 4. Fishing Arrangements & Non-Angler Options */}
      <section
        className="section"
        id="fishing-and-non-angler"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            On the Water &amp; Ashore
          </p>
          <h2>Fishing Setup &amp; Options for Non-Anglers</h2>

          <div className="lfse-two-col" style={{ marginTop: 18 }}>
            <div className="card">
              <h3>Boats, Target Fish &amp; Fish Processing</h3>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                <strong>Waters:</strong>{" "}
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
                <strong>Season Timing:</strong>{" "}
                {lodge.fishingProgram.seasonalRunNote}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 12 }}>
                <strong>Fish Processing &amp; Boxes:</strong>{" "}
                {lodge.fishingProgram.fishProcessingAndBoxesSummary}
              </p>

              <strong style={{ fontSize: 14, color: "var(--deep)" }}>
                Licenses, Stamps &amp; Boat Rules
              </strong>
              <ul className={styles.cleanList}>
                {lodge.fishingProgram.scopedRequirements.map((req, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <strong>{req.requirementName}</strong>{" "}
                    <span className="chip" style={{ marginLeft: 4 }}>
                      {req.applicableActivityAndDateScope}
                    </span>
                    <div style={{ fontSize: 13, marginTop: 2 }}>
                      <em>{PROVISION_LABELS[req.provisionStatus]}:</em>{" "}
                      {req.detail}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Options for Companions &amp; Non-Anglers</h3>
              <div style={{ marginBottom: 10 }}>
                <span
                  className={`badge ${
                    lodge.nonFishingContext
                      .simultaneousNonAnglerActivitiesProven === "yes"
                      ? "badge-safety"
                      : "badge-warning"
                  }`}
                >
                  {formatNonAnglerBadge(
                    lodge.nonFishingContext
                      .simultaneousNonAnglerActivitiesProven,
                  )}
                </span>
              </div>
              <p style={{ fontSize: 13.8, marginBottom: 10 }}>
                {lodge.nonFishingContext.simultaneousNonAnglerExplanation}
              </p>
              {lodge.nonFishingContext.simultaneousNonAnglerActivitiesProven ===
                "unknown" && (
                <div
                  className={styles.conflictAlert}
                  style={{ marginBottom: 10 }}
                >
                  Note for mixed groups: On-site kayaks or shore gear do not
                  guarantee separate guided outings while anglers are out on the
                  boats—confirm daily options with the lodge before booking.
                </div>
              )}
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>On-Site Gear:</strong>{" "}
                {lodge.nonFishingContext.onSiteUnguidedEquipment.summary}
              </p>
              <p style={{ fontSize: 13.5, margin: 0 }}>
                <strong>Guided Wildlife &amp; Sightseeing:</strong>{" "}
                {lodge.nonFishingContext.guidedNonFishingExcursions.summary}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Getting There, Baggage & Accommodations / Booking Setup */}
      <section className="section" id="access-and-accommodations">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Transfers, Rooms &amp; Booking Setup
          </p>
          <h2>Getting to {lodge.displayName} &amp; Where You Stay</h2>

          {/* Access Connections */}
          <div className="lfse-two-col" style={{ marginTop: 18 }}>
            {lodge.accessConnections.map((conn) => (
              <div key={conn.connectionId} className="card">
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
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
                  <strong>Transfer Cost &amp; Details:</strong>{" "}
                  {conn.publishedTransferRateNote}
                </p>
                {conn.provisionStatus ===
                  "conflicting_official_pages_confirm" && (
                  <div
                    className={styles.conflictAlert}
                    style={{ marginBottom: 10 }}
                  >
                    Official pages differ on whether this transfer is included
                    in the package rate — confirm directly before booking
                    flights.
                  </div>
                )}
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
                    Baggage &amp; Fish-Box Rules (
                    {conn.scopedBaggageAndFreightRule.applicableServiceScope}):
                  </strong>
                  <div style={{ marginTop: 3 }}>
                    {conn.scopedBaggageAndFreightRule.ruleSummary}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 13.2,
                    color: "var(--muted)",
                    margin: "0 0 10px",
                  }}
                >
                  <strong>Arrival &amp; Overnight Timing:</strong>{" "}
                  {conn.reportingAndOvernightBufferNote}
                </p>
                <div style={{ marginTop: "auto", fontSize: 13 }}>
                  <Link
                    href={`/ports/${conn.gatewayPortSlug}`}
                    style={{ color: "var(--forest)", fontWeight: 700 }}
                  >
                    Explore our {conn.gatewayPortSlug.replace(/-/g, " ")}{" "}
                    gateway guide →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Rooms & Concise Property / Operator / Seller Distinction */}
          <div className="lfse-two-col" style={{ marginTop: 22 }}>
            <div className="card" data-testid="entity-card-accommodation">
              <span
                className="badge badge-safety"
                style={{ alignSelf: "flex-start" }}
              >
                Accommodations &amp; Meals
              </span>
              <h3 style={{ marginTop: 10 }}>
                {lodge.accommodation.propertyName}
              </h3>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                <strong>Location:</strong>{" "}
                {lodge.accommodation.actualLocationLabel}
                {lodge.accommodation.streetOrPostalAddress
                  ? ` (${lodge.accommodation.streetOrPostalAddress})`
                  : ""}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Rooms &amp; Cabins:</strong>{" "}
                {lodge.accommodation.roomAndCabinSummary}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Bathrooms:</strong>{" "}
                {lodge.accommodation.bathroomConfiguration ===
                "private_ensuite_documented"
                  ? "Private bathrooms"
                  : lodge.accommodation.bathroomConfiguration ===
                      "private_or_group_shared_documented"
                    ? "Private or group-shared bathrooms"
                    : "Not listed — confirm with lodge"}{" "}
                · <strong>Guest Kitchen:</strong>{" "}
                {formatYesNoUnknown(
                  lodge.accommodation.guestKitchenOrSelfCaterAccess,
                )}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>Meals:</strong>{" "}
                {lodge.accommodation.mealProvisionSummary}
              </p>
              <p
                style={{
                  fontSize: 13.2,
                  marginBottom: 6,
                  color: "var(--muted)",
                }}
              >
                <strong>Group Size &amp; Families:</strong>{" "}
                {lodge.accommodation.groupSizeGuidanceNote}{" "}
                {lodge.accommodation.childrenAndYouthNote}
              </p>
              <p style={{ fontSize: 13.2, margin: 0, color: "var(--muted)" }}>
                <strong>Accessibility:</strong>{" "}
                {lodge.accommodation.documentedAccessibilityNote}
              </p>
            </div>

            <div className="card" data-testid="entity-card-operator">
              <span
                className={`badge ${
                  rolesDiffer ? "badge-warning" : "badge-safety"
                }`}
                style={{ alignSelf: "flex-start" }}
              >
                {rolesDiffer
                  ? "How Lodging, Boats & Services Are Booked"
                  : "Operator & Direct Booking Contact"}
              </span>
              <h3 style={{ marginTop: 10 }}>
                {lodge.packageSeller.sellerName}
              </h3>
              <p style={{ fontSize: 13.8, marginBottom: 8 }}>
                {lodge.accommodation.relationshipExplanation}
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 8 }}>
                <strong>How to book:</strong>{" "}
                {lodge.packageSeller.bookingMechanismSummary}
              </p>
              <p
                style={{
                  fontSize: 13.2,
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                <strong>Operating business:</strong>{" "}
                {lodge.operatingCompany.legalOrDisplayName} —{" "}
                {lodge.operatingCompany.ownershipOrHistorySummary}
              </p>
              {lodge.operatingCompany.legacyOrBuildingAliases &&
                lodge.operatingCompany.legacyOrBuildingAliases.length > 0 && (
                  <p style={{ fontSize: 13.2, marginBottom: 8 }}>
                    <strong>Also includes / formerly known as:</strong>{" "}
                    {lodge.operatingCompany.legacyOrBuildingAliases.join(", ")}
                  </p>
                )}
              {lodge.operatingCompany.separationDisambiguationNote && (
                <div
                  className={styles.conflictAlert}
                  style={{ marginBottom: 10 }}
                >
                  {lodge.operatingCompany.separationDisambiguationNote}
                </div>
              )}

              {lodge.partnerServices.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13.5, color: "var(--deep)" }}>
                    Transfer Carriers &amp; Separately Arranged Services:
                  </strong>
                  <ul className={styles.cleanList}>
                    {lodge.partnerServices.map((partner, idx) => (
                      <li key={idx}>
                        <strong>{partner.providerName}:</strong>{" "}
                        {partner.details}{" "}
                        {partner.existingLfseOperatorSlug ? (
                          <Link
                            href={`/operators/${partner.existingLfseOperatorSlug}`}
                            style={{
                              color: "var(--forest)",
                              fontWeight: 700,
                              textDecoration: "underline",
                            }}
                          >
                            (Operator profile →)
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
                            (Official site ↗)
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 10,
                  borderTop: "1px solid var(--line)",
                  fontSize: 13.5,
                }}
              >
                <div>
                  <strong>Official Website:</strong>{" "}
                  <a
                    href={lodge.operatingCompany.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--forest)",
                      textDecoration: "underline",
                    }}
                  >
                    {lodge.operatingCompany.officialWebsite} ↗
                  </a>
                </div>
                {lodge.operatingCompany.officialPhone && (
                  <div style={{ marginTop: 4 }}>
                    <strong>Phone:</strong>{" "}
                    {lodge.operatingCompany.officialPhone}
                  </div>
                )}
                {lodge.operatingCompany.existingLfseOperatorSlug && (
                  <div style={{ marginTop: 8 }}>
                    <Link
                      href={`/operators/${lodge.operatingCompany.existingLfseOperatorSlug}`}
                      style={{ color: "var(--forest)", fontWeight: 700 }}
                    >
                      View Excursion Operator Profile →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Connected Guides + Expandable Unresolved Details & Sources */}
      <section
        className="section"
        id="connected-guides-and-sources"
        style={{
          background: "#ffffff",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="shell">
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>
              Plan Gateway Stays, Flights &amp; Ferry Connections
            </h3>
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
                    <div
                      style={{
                        fontSize: 12.8,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {link.relationshipNote}
                    </div>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Expandable 1: Unresolved Details & Questions to Confirm */}
          {lodge.unresolvedQuestionsForTraveler.length > 0 && (
            <div style={{ marginBottom: 14 }} id="questions-to-confirm">
              <details className="lfse-sources-details">
                <summary>
                  Details to confirm before paying a deposit (
                  {lodge.unresolvedQuestionsForTraveler.length})
                </summary>
                <div className="lfse-sources-body">
                  <ul className={styles.cleanList} style={{ marginTop: 0 }}>
                    {lodge.unresolvedQuestionsForTraveler.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </details>
            </div>
          )}

          {/* Expandable 2: Official Sources & Check Dates */}
          <div id="primary-source-evidence">
            <details className="lfse-sources-details">
              <summary>
                Official sources &amp; check dates ({lodge.claimEvidence.length}{" "}
                pages checked {lodge.verifiedAt})
              </summary>
              <div className="lfse-sources-body">
                <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>
                  Information on this page was compiled from the official pages
                  below (coordinates:{" "}
                  {lodge.accommodation.coordinates.latitude.toFixed(4)}° N,{" "}
                  {Math.abs(lodge.accommodation.coordinates.longitude).toFixed(
                    4,
                  )}
                  ° W — {lodge.accommodation.coordinates.coordinateNote}):
                </p>
                <div className={styles.evidenceTableWrap}>
                  <table className={styles.evidenceTable}>
                    <thead>
                      <tr>
                        <th>Topic</th>
                        <th>Applicable Season / Date</th>
                        <th>What Was Checked</th>
                        <th>Official Source &amp; Check Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lodge.claimEvidence.map((ev) => (
                        <tr key={ev.claimId}>
                          <td>
                            <strong>{CLAIM_SCOPE_LABELS[ev.scope]}</strong>
                          </td>
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
                            <div
                              style={{
                                fontSize: 11.8,
                                color: "var(--muted)",
                                marginTop: 2,
                              }}
                            >
                              Checked {ev.source.checkedAt}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* 7. Free Updates & Listing Claim */}
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
