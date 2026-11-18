import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import FareHarborBookingButton from "../../components/FareHarborBookingButton";
import OperatorIdentityMark from "../../components/OperatorIdentityMark";
import ProductCard from "../../components/ProductCard";
import WnoOperatorClaimPanel from "../../components/WnoOperatorClaimPanel";
import WnoSourcesAndFreshnessDisclosure from "../../components/WnoSourcesAndFreshnessDisclosure";
import {
  buildAttributedTourHref,
  FAREHARBOR_SOURCES,
  isApprovedProductSlug,
} from "../../lib/fareHarborAttribution";
import { buildWnoOperatorProfileJsonLd } from "../../lib/structuredData";
import {
  normalizeWtnoTourPath,
  resolveHumanPlaceName,
} from "../../lib/wtnoDirectoryHelpers";
import { isHeldProduct } from "../../data/truthPolicy";
import {
  getFareHarborUrl,
  getProductPrimaryBookingHref,
  STOREFRONT_PRODUCTS,
  type NolaFareHarborProduct,
} from "../../tours/pageConfig";
import { getWnoOperatorEntity, WNO_OPERATOR_ENTITIES } from "../../data/operatorRegistry";
import {
  RESEARCHED_OPERATORS,
  getOperatorBooking,
  getResearchedOperator,
  type OperatorBookingProduct,
} from "../../data/operatorDirectory";
import {
  NEW_ORLEANS_OPERATORS,
  findNewOrleansOperatorBySlugOrAlias,
  getNewOrleansDirectorySnapshot,
} from "@/lib/dcc/shared/newOrleansDirectoryData";
import {
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
} from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";

export function generateStaticParams() {
  const slugs = new Set<string>([
    ...NEW_ORLEANS_OPERATORS.map((o) => o.slug),
    ...WNO_OPERATOR_ENTITIES.map((o) => o.slug),
    ...RESEARCHED_OPERATORS.map((o) => o.slug),
  ]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonicalMatch = findNewOrleansOperatorBySlugOrAlias(slug);

  if (canonicalMatch) {
    const { operator, gate, canonicalSlug } = canonicalMatch;
    const title = `${operator.name} — Verified New Orleans Tours, Docks & Pickup | WNO`;
    const description = operator.tagline;
    return {
      title,
      description,
      alternates: { canonical: `/operators/${canonicalSlug}` },
      robots: {
        index: gate.indexable,
        follow: true,
      },
      openGraph: {
        title,
        description,
        url: `/operators/${canonicalSlug}`,
        type: "website",
      },
    };
  }

  const wnoOp = getWnoOperatorEntity(slug);
  if (wnoOp) {
    const title = `${wnoOp.name} New Orleans Tours | Welcome to New Orleans Tours`;
    const description = `See the ${wnoOp.products.length} ${wnoOp.name} experience${wnoOp.products.length === 1 ? "" : "s"} currently represented on Welcome to New Orleans Tours.`;
    return {
      title,
      description,
      alternates: { canonical: `/operators/${wnoOp.slug}` },
    };
  }

  const profile = getResearchedOperator(slug);
  if (profile) {
    return {
      title: `${profile.name} Tours & Booking | Welcome to New Orleans Tours`,
      description: profile.summary,
      alternates: { canonical: `/operators/${profile.slug}` },
    };
  }

  return {};
}

function normalizeViatorPathname(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes("viator.com")) return null;
    return parsed.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return null;
  }
}

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalMatch = findNewOrleansOperatorBySlugOrAlias(slug);

  if (!canonicalMatch) {
    notFound();
  }

  if (canonicalMatch.matchedViaAlias) {
    permanentRedirect(`/operators/${canonicalMatch.canonicalSlug}`);
  }

  const { operator, products, gate } = canonicalMatch;
  const snapshot = getNewOrleansDirectorySnapshot();
  const indexablePlaceSlugSet = new Set(
    snapshot.places
      .filter((entry) => entry.gate.indexable && Boolean(entry.place.publicPlaceSlug))
      .map((entry) => entry.place.publicPlaceSlug!),
  );
  const indexableOperatorIdSet = new Set(
    snapshot.operators
      .filter((entry) => entry.gate.indexable)
      .map((entry) => entry.operator.operatorId),
  );

  const wnoInventoryEntity = getWnoOperatorEntity(operator.slug);
  const researchedProfile = getResearchedOperator(operator.slug);
  const liveConnected = isOperatorLiveAvailabilityConnected(operator);
  const directConnected = isOperatorDirectCheckoutConnected(operator);

  // Held operators render with explicit noindex status, hold rationale, and claim invitation
  if (!gate.indexable) {
    return (
      <div
        data-wno-surface="directory-warm"
        className="min-h-screen bg-[#faf6ee] px-6 py-14 text-[#1e1915]"
      >
        <div className="mx-auto max-w-4xl">
          <Link
            href="/operators"
            className="text-sm font-semibold text-[#163828] underline underline-offset-4 hover:text-[#6b2737]"
          >
            ← All Verified New Orleans Tour Operators
          </Link>
          <div
            data-testid="held-operator-noindex-banner"
            className="mt-6 rounded-2xl border border-[#b8893a]/45 bg-[#fffdf9] p-6 md:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Unindexed Operator Research Record · Verification Pending
            </p>
            <div className="mt-3 flex items-center gap-3.5">
              <OperatorIdentityMark name={operator.name} size="md" variant="on-light" />
              <h1 className="font-serif text-3xl font-bold text-[#163828] md:text-5xl">
                {operator.name}
              </h1>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#4a4138]">
              {operator.companyOverview}
            </p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-xs text-[#6b2737]">
              {gate.holdDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            {operator.slug === "nola-ghost-riders" && (
              <div className="mt-6">
                <Link
                  href="/tours/nola-ghost-riders"
                  className="wno-dir-primary-btn inline-flex items-center rounded-full bg-[#163828] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#faf6ee]"
                >
                  View Curated Partner Tour Collection →
                </Link>
              </div>
            )}
          </div>

          <WnoOperatorClaimPanel
            operatorId={operator.operatorId}
            operatorSlug={operator.slug}
            operatorName={operator.name}
            claimStatus={operator.claimStatus}
            officialEmailDomain={operator.officialEmailDomain}
            liveAvailabilityConnected={liveConnected}
            directCheckoutConnected={directConnected}
          />
        </div>
      </div>
    );
  }

  const activeProducts = products.filter(
    (p) => !p.isCommerciallyHeld && Boolean(p.verifiedAt),
  );
  const servedPlaces = snapshot.places
    .filter(
      (entry) =>
        entry.gate.indexable &&
        Boolean(entry.place.publicPlaceSlug) &&
        operator.publicPlaceSlugs.includes(entry.place.publicPlaceSlug!),
    )
    .map((entry) => entry.place);

  const separateOperators = (operator.separateFromOperatorIds || [])
    .map((sepId) => NEW_ORLEANS_OPERATORS.find((o) => o.operatorId === sepId))
    .filter(
      (o): o is NonNullable<typeof o> =>
        Boolean(o) && indexableOperatorIdSet.has(o!.operatorId),
    );

  // Deduplicate storefront & researched partner products into the canonical tour list
  const liveStorefrontProducts: NolaFareHarborProduct[] = (
    wnoInventoryEntity?.products ?? []
  ).filter((p) => !isHeldProduct(p.slug));

  const matchedStorefrontSlugs = new Set<string>();
  const matchedResearchedViatorUrls = new Set<string>();

  const mergedCanonicalTours = activeProducts.map((prod) => {
    const normalizedTourPath =
      prod.wnoPublicTourPath && !prod.wnoPublicTourPath.startsWith("/operators/")
        ? normalizeWtnoTourPath(prod.wnoPublicTourPath)
        : null;

    let matchedStorefront: NolaFareHarborProduct | null = null;
    if (normalizedTourPath?.startsWith("/tours/")) {
      const targetSlug = normalizedTourPath.replace(/^\/tours\//, "").split(/[?#]/)[0];
      const found =
        liveStorefrontProducts.find((sf) => sf.slug === targetSlug) ||
        STOREFRONT_PRODUCTS.find((sf) => sf.slug === targetSlug && !isHeldProduct(sf.slug)) ||
        null;
      if (found) {
        matchedStorefront = found;
        matchedStorefrontSlugs.add(found.slug);
      }
    }

    let matchedResearched: OperatorBookingProduct | null = null;
    if (researchedProfile) {
      const prodViatorPath = normalizeViatorPathname(prod.viatorOfficialUrl);
      const foundResearched = researchedProfile.products.find((rp) => {
        if (matchedResearchedViatorUrls.has(rp.viatorUrl)) return false;
        const rpPath = normalizeViatorPathname(rp.viatorUrl);
        if (prodViatorPath && rpPath && prodViatorPath === rpPath) return true;
        return rp.title.trim().toLowerCase() === prod.title.trim().toLowerCase();
      });
      if (foundResearched) {
        matchedResearched = foundResearched;
        matchedResearchedViatorUrls.add(foundResearched.viatorUrl);
      }
    }

    return {
      prod,
      normalizedTourPath,
      matchedStorefront,
      matchedResearched,
    };
  });

  const unmatchedStorefrontProducts = liveStorefrontProducts.filter(
    (sf) => !matchedStorefrontSlugs.has(sf.slug),
  );
  const unmatchedResearchedProducts = (researchedProfile?.products ?? []).filter(
    (rp) => !matchedResearchedViatorUrls.has(rp.viatorUrl),
  );

  const profileSchema = buildWnoOperatorProfileJsonLd({
    slug: operator.slug,
    name: operator.name,
    description: operator.tagline,
    officialWebsite: operator.officialWebsite,
    officialPhone: operator.officialPhone,
    dateModified: operator.lastModifiedAt,
  });

  return (
    <div
      data-wno-surface="directory-warm"
      className="min-h-screen bg-[#faf6ee] text-[#1e1915]"
    >
      <JsonLd data={profileSchema} />

      {/* WARM DEEP CYPRESS HERO & GOVERNANCE HEADER */}
      <section className="wno-dir-hero border-b-2 border-[#b8893a] bg-[#163828] px-6 py-14 text-[#faf6ee] md:py-18">
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#faf6ee]/75"
          >
            <Link href="/" className="underline-offset-4 hover:text-[#e4c17a] hover:underline">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/operators"
              className="underline-offset-4 hover:text-[#e4c17a] hover:underline"
            >
              Tour Operators
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#e4c17a]">{operator.name}</span>
          </nav>

          <div className="grid items-start gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {operator.verifiedOwnershipBadges.map((badge) => (
                  <span key={badge.tag} className="wno-pill-brass">
                    {badge.label}
                  </span>
                ))}
                {operator.yearEstablished && (
                  <span className="wno-pill-burgundy">
                    Est. {operator.yearEstablished}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <OperatorIdentityMark name={operator.name} size="lg" variant="on-dark" />
                <h1 className="font-serif text-3xl font-bold leading-tight text-[#faf6ee] md:text-5xl">
                  {operator.name}
                </h1>
              </div>

              <p className="mt-3 max-w-3xl text-lg font-medium text-[#e4c17a]">
                {operator.tagline}
              </p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[#efe7d8]">
                {operator.companyOverview}
              </p>

              {operator.claimStatus === "unclaimed" && (
                <p
                  data-testid="operator-hero-unclaimed-notice"
                  className="mt-5 max-w-3xl rounded-xl border border-[#e4c17a]/40 bg-[#112a1e] px-4 py-3 text-xs leading-relaxed text-[#faf6ee]"
                >
                  {UNCLAIMED_OPERATOR_PROFILE_NOTICE}{" "}
                  <a
                    href="#claim-operator-profile"
                    className="font-bold text-[#e4c17a] underline underline-offset-4 hover:text-[#faf6ee]"
                  >
                    Claim or update this profile ($0) →
                  </a>
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-[#faf6ee]">
                {operator.officialPhone && (
                  <span className="rounded-lg border border-[#faf6ee]/20 bg-[#112a1e] px-3.5 py-2">
                    <strong>Phone:</strong> {operator.officialPhone}
                  </span>
                )}
                {operator.officialWebsite && (
                  <a
                    href={operator.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-[#e4c17a]/50 bg-[#112a1e] px-3.5 py-2 font-semibold text-[#e4c17a] underline underline-offset-4 hover:text-[#faf6ee]"
                  >
                    Official Operator Website ↗
                  </a>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#e4c17a]/35 bg-[#112a1e] shadow-lg">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  src={operator.heroImage}
                  alt={operator.heroImageAlt}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="px-4 py-2.5 text-[11px] text-[#efe7d8]/85">
                {operator.heroImageCredit}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* SEPARATE-ENTITY DISAMBIGUATION BANNER (e.g. Ragin' Cajun vs Airboat Adventures) */}
        {operator.separationGovernanceNote && (
          <section
            data-testid="operator-separation-governance-banner"
            className="mb-10 rounded-2xl border border-[#b8893a]/45 bg-[#f7efe0] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a6220]">
              Separate-Company Identity &amp; Dock Notice
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#1e1915]">
              {operator.separationGovernanceNote}
            </p>
            {(separateOperators.length > 0 || operator.slug === "airboat-adventures") && (
              <div className="mt-3.5 flex flex-wrap gap-4 text-xs">
                {separateOperators.map((other) => (
                  <Link
                    key={other.operatorId}
                    href={`/operators/${other.slug}`}
                    className="font-bold text-[#6b2737] underline underline-offset-4 hover:text-[#163828]"
                  >
                    Compare separate company: {other.name} →
                  </Link>
                ))}
                {operator.slug === "airboat-adventures" && (
                  <Link
                    href="/tours/airboat-adventures"
                    className="font-bold text-[#163828] underline underline-offset-4 hover:text-[#6b2737]"
                  >
                    Open Airboat Adventures vessel comparison guide →
                  </Link>
                )}
              </div>
            )}
          </section>
        )}

        {/* OPERATED VESSELS & WHARF RESOLUTION (e.g. Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS) */}
        {operator.operatedVessels && operator.operatedVessels.length > 0 && (
          <section
            data-testid="operator-vessels-wharf-section"
            className="mb-12 rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6 md:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a6220]">
              Vessel &amp; Boarding Wharf Guide
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828] md:text-3xl">
              Distinct vessels operated by {operator.name}
            </h2>
            <p className="mt-2 text-sm text-[#4a4138]">
              Do not assume both vessels board at the exact same gangway when sailing
              simultaneously—check your product and departure wharf below:
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {operator.operatedVessels.map((vessel) => (
                <div
                  key={vessel.vesselId}
                  className="rounded-xl border border-[#1e1915]/12 bg-[#faf6ee] p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8a6220]">
                    {vessel.vesselType}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-[#163828]">
                    {vessel.vesselName}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#4a4138]">
                    {vessel.propulsionAndHullSummary}
                  </p>
                  <p className="mt-3 text-xs text-[#1e1915]">
                    <strong>Primary Boarding Wharf:</strong> {vessel.primaryWharfName} (
                    {vessel.primaryWharfAddress})
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-[#6b2737]">
                    {vessel.companionOrSubstituteWharfRule}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PICKUP, ACCESSIBILITY & PARTICIPANT RULES */}
        <section className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="wno-dir-card rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#8a6220]">
              Docks, Check-In &amp; Pickup
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              {operator.arrivalAndPickupSummary}
            </p>
          </div>
          <div className="wno-dir-card rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#8a6220]">
              Accessibility &amp; Mobility
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              {operator.accessibilityAndMobilityNotes}
            </p>
          </div>
          <div className="wno-dir-card rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#8a6220]">
              Age &amp; Rider Policies
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              {operator.participantPolicies}
            </p>
          </div>
        </section>

        {/* COHESIVE DEDUPLICATED TOURS & BOOKING OPTIONS SECTION */}
        {(mergedCanonicalTours.length > 0 ||
          unmatchedStorefrontProducts.length > 0 ||
          unmatchedResearchedProducts.length > 0) && (
          <section
            data-testid="operator-canonical-products-matrix"
            className="mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6220]">
              Verified Departures, Docks &amp; Reservations
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828]">
              Tours &amp; Booking Options
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4a4138]">
              Compare departure docks, check-in lead times, pickup options, and booking calendars
              for {operator.name}. Check current dates, prices, and cancellation terms during
              checkout (we may earn a commission on partner bookings at no extra cost to you).
            </p>

            {mergedCanonicalTours.length > 0 && (
              <div className="mt-6 space-y-5">
                {mergedCanonicalTours.map(
                  ({ prod, normalizedTourPath, matchedStorefront, matchedResearched }) => {
                    const researchedBooking =
                      matchedResearched && researchedProfile
                        ? getOperatorBooking(matchedResearched, researchedProfile.slug)
                        : prod.viatorOfficialUrl
                          ? getOperatorBooking(
                              {
                                title: prod.title,
                                description: prod.summary,
                                viatorUrl: prod.viatorOfficialUrl,
                              },
                              operator.slug,
                            )
                          : null;

                    const storefrontDetailHref = matchedStorefront
                      ? isApprovedProductSlug(matchedStorefront.slug)
                        ? buildAttributedTourHref(
                            matchedStorefront.slug,
                            FAREHARBOR_SOURCES.guide,
                          )
                        : `/tours/${matchedStorefront.slug}`
                      : normalizedTourPath;

                    const cardFlowId =
                      matchedStorefront?.flowId ||
                      matchedStorefront?.bookingVariants?.[0]?.flowId;
                    const storefrontFallbackHref = matchedStorefront
                      ? getProductPrimaryBookingHref(matchedStorefront) ||
                        matchedStorefront.bookingVariants?.[0]?.bookingUrl ||
                        getFareHarborUrl(
                          matchedStorefront.companyShortname,
                          matchedStorefront.itemId,
                          cardFlowId,
                        )
                      : "";

                    const directPartnerHref =
                      researchedBooking?.url ||
                      prod.fareharborDirectUrl ||
                      null;

                    const departureAreaLabel = resolveHumanPlaceName(prod.placeSlug, true);
                    const canLinkDepartureArea = indexablePlaceSlugSet.has(prod.placeSlug);

                    return (
                      <article
                        key={prod.productId}
                        className="wno-dir-card rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6 md:p-7"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold uppercase tracking-wider text-[#8a6220]">
                            {prod.vesselTypeSummary} · {prod.durationLabel}
                          </span>
                          <span className="rounded-full bg-[#f5efe2] px-3 py-1 font-bold text-[#163828]">
                            {prod.priceDisplayLabel}
                          </span>
                        </div>

                        <h3 className="mt-2.5 font-serif text-2xl font-bold text-[#163828]">
                          {prod.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#4a4138]">
                          {prod.summary}
                        </p>

                        <div className="mt-4 grid gap-4 rounded-xl border border-[#1e1915]/10 bg-[#faf6ee] p-4 text-xs text-[#4a4138] md:grid-cols-2">
                          <div>
                            <strong className="text-[#1e1915]">
                              Primary Boarding Wharf / Dock:
                            </strong>
                            <p className="mt-1 leading-relaxed">
                              {prod.boardingLocationResolution.primaryBoardingWharfOrDock}
                            </p>
                          </div>
                          <div>
                            <strong className="text-[#1e1915]">
                              Check-In &amp; Voucher Rule (
                              {prod.boardingLocationResolution.checkInLeadMinutes} min prior):
                            </strong>
                            <p className="mt-1 leading-relaxed">
                              {prod.boardingLocationResolution.voucherConfirmationRule}
                            </p>
                            {prod.boardingLocationResolution
                              .companionOrAlternateBoardingRule && (
                              <p className="mt-1.5 font-medium text-[#6b2737]">
                                {
                                  prod.boardingLocationResolution
                                    .companionOrAlternateBoardingRule
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            {canLinkDepartureArea ? (
                              <Link
                                href={`/areas/${prod.placeSlug}`}
                                className="rounded-lg border border-[#1e1915]/15 bg-[#faf6ee] px-3 py-1.5 font-semibold text-[#163828] hover:border-[#8a6220]"
                              >
                                Departure Area: {departureAreaLabel}
                              </Link>
                            ) : (
                              <span className="rounded-lg border border-[#1e1915]/15 bg-[#faf6ee] px-3 py-1.5 font-semibold text-[#4a4138]">
                                Departure Area: {departureAreaLabel}
                              </span>
                            )}

                            {prod.visitedHistoricSiteIds?.map((siteId) => {
                              const siteSlug = siteId.replace(/^place:/, "");
                              const siteName = resolveHumanPlaceName(siteSlug, true);
                              if (!indexablePlaceSlugSet.has(siteSlug)) {
                                return (
                                  <span
                                    key={siteId}
                                    className="rounded-lg border border-[#b8893a]/40 bg-[#f7efe0] px-3 py-1.5 font-semibold text-[#8a6220]"
                                  >
                                    Historic Site: {siteName}
                                  </span>
                                );
                              }
                              return (
                                <Link
                                  key={siteId}
                                  href={`/areas/${siteSlug}`}
                                  className="rounded-lg border border-[#b8893a]/45 bg-[#f7efe0] px-3 py-1.5 font-semibold text-[#6b2737] hover:border-[#6b2737]"
                                >
                                  Historic Site: {siteName}
                                </Link>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            {storefrontDetailHref && (
                              <Link
                                href={storefrontDetailHref}
                                className="rounded-full border border-[#163828]/30 bg-[#faf6ee] px-4 py-2 font-bold text-[#163828] hover:border-[#163828]"
                              >
                                Tour Details &amp; Guide →
                              </Link>
                            )}

                            {matchedStorefront && matchedStorefront.companyShortname ? (
                              <FareHarborBookingButton
                                productTitle={matchedStorefront.title}
                                productSlug={matchedStorefront.slug}
                                shortname={matchedStorefront.companyShortname}
                                itemId={matchedStorefront.itemId}
                                flowId={cardFlowId}
                                asn="aktourcenter"
                                refCode={FAREHARBOR_SOURCES.guide}
                                fallbackHref={storefrontFallbackHref}
                                fullItems="yes"
                                placement="tour_catalog_card"
                                className="wno-dir-primary-btn inline-flex items-center rounded-full bg-[#163828] px-4 py-2 font-bold text-[#faf6ee] hover:bg-[#1f4d37]"
                              >
                                Check Dates &amp; Prices →
                              </FareHarborBookingButton>
                            ) : matchedStorefront &&
                              storefrontFallbackHref &&
                              (storefrontFallbackHref.startsWith("/api/") ||
                                storefrontFallbackHref.startsWith("http")) ? (
                              <a
                                href={
                                  storefrontFallbackHref.startsWith("http") &&
                                  storefrontFallbackHref.includes("viator.com")
                                    ? `https://www.destinationcommandcenter.com/go/commerce/handoff?site=welcometoneworleanstours.com&provider=viator&account=P00058396&product=${encodeURIComponent(matchedStorefront.viatorProductCode || matchedStorefront.slug)}&campaign=${encodeURIComponent(`wno-operator-${operator.slug}-${matchedStorefront.slug}`)}&sourcePage=${encodeURIComponent(`/operators/${operator.slug}`)}&url=${encodeURIComponent(storefrontFallbackHref)}`
                                    : storefrontFallbackHref
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="wno-dir-primary-btn inline-flex items-center rounded-full bg-[#163828] px-4 py-2 font-bold text-[#faf6ee] hover:bg-[#1f4d37]"
                              >
                                Check Dates &amp; Prices →
                              </a>
                            ) : directPartnerHref ? (
                              <a
                                href={directPartnerHref}
                                rel="sponsored noopener"
                                target="_blank"
                                className="wno-dir-primary-btn inline-flex items-center rounded-full bg-[#163828] px-4 py-2 font-bold text-[#faf6ee] hover:bg-[#1f4d37]"
                              >
                                {researchedBooking
                                  ? `Check dates & prices on ${researchedBooking.provider} →`
                                  : "Check Dates & Prices →"}
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}

            {unmatchedStorefrontProducts.length > 0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {unmatchedStorefrontProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    attributionSource={FAREHARBOR_SOURCES.guide}
                    product={
                      {
                        ...product,
                        operatorAttribution: undefined,
                        isBookable: true,
                        ctaLabel: "Check Times & Prices",
                      } as never
                    }
                  />
                ))}
              </div>
            )}

            {unmatchedResearchedProducts.length > 0 && researchedProfile && (
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {unmatchedResearchedProducts.map((product) => {
                  const booking = getOperatorBooking(product, researchedProfile.slug);
                  return (
                    <article
                      key={product.viatorUrl}
                      className="wno-dir-card rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6"
                    >
                      <h3 className="font-serif text-xl font-bold text-[#163828]">
                        {product.title}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-[#4a4138]">
                        {product.description}
                      </p>
                      <a
                        href={booking.url}
                        rel="sponsored noopener"
                        target="_blank"
                        className="wno-dir-primary-btn mt-5 inline-flex items-center rounded-full bg-[#163828] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#faf6ee] hover:bg-[#1f4d37]"
                      >
                        Check dates &amp; prices on {booking.provider} →
                      </a>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SERVED AREAS */}
        {servedPlaces.length > 0 && (
          <section className="mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6220]">
              Served Areas, Wetland Basins &amp; Historic Sites
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {servedPlaces.map((pl) => (
                <Link
                  key={pl.placeId}
                  href={`/areas/${pl.publicPlaceSlug}`}
                  className="rounded-xl border border-[#1e1915]/12 bg-[#fffdf9] px-4 py-2.5 text-xs font-semibold text-[#163828] hover:border-[#8a6220] hover:text-[#6b2737]"
                >
                  {pl.name} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CALM SOURCES & FRESHNESS DISCLOSURE */}
        <WnoSourcesAndFreshnessDisclosure
          verifiedAt={operator.verifiedAt}
          sources={operator.sources}
          showIntegrationStatus
          liveAvailabilityConnected={liveConnected}
          directCheckoutConnected={directConnected}
        />

        {/* $0 OPERATOR PROFILE CLAIM & OPTIONAL DIRECT INTEGRATION FORM */}
        <WnoOperatorClaimPanel
          operatorId={operator.operatorId}
          operatorSlug={operator.slug}
          operatorName={operator.name}
          claimStatus={operator.claimStatus}
          officialEmailDomain={operator.officialEmailDomain}
          liveAvailabilityConnected={liveConnected}
          directCheckoutConnected={directConnected}
        />
      </div>
    </div>
  );
}
