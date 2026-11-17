import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import WnoOperatorClaimPanel from "../../components/WnoOperatorClaimPanel";
import { FAREHARBOR_SOURCES } from "../../lib/fareHarborAttribution";
import { getWnoOperatorEntity, WNO_OPERATOR_ENTITIES } from "../../data/operatorRegistry";
import {
  RESEARCHED_OPERATORS,
  getOperatorBooking,
  getResearchedOperator,
} from "../../data/operatorDirectory";
import {
  NEW_ORLEANS_OPERATORS,
  NEW_ORLEANS_PLACES,
  findNewOrleansOperatorBySlugOrAlias,
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
  const wnoInventoryEntity = getWnoOperatorEntity(operator.slug);
  const researchedProfile = getResearchedOperator(operator.slug);
  const liveConnected = isOperatorLiveAvailabilityConnected(operator);
  const directConnected = isOperatorDirectCheckoutConnected(operator);

  // Held operators render with explicit noindex status, hold rationale, and claim invitation
  if (!gate.indexable) {
    return (
      <div data-wno-surface="directory-dark" className="min-h-screen bg-[#080708] px-6 py-14 text-[#fdfbf7]">
        <div className="mx-auto max-w-4xl">
          <Link href="/operators" className="text-sm text-[#d4af37] underline">
            ← All Verified New Orleans Tour Operators
          </Link>
          <div
            data-testid="held-operator-noindex-banner"
            className="mt-6 rounded-xl border border-amber-400/40 bg-amber-950/30 p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Unindexed Operator Research Record · Verification Pending
            </p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl">
              {operator.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              {operator.companyOverview}
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-amber-100/90">
              {gate.holdDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            {operator.slug === "nola-ghost-riders" && (
              <div className="mt-5">
                <Link
                  href="/tours/nola-ghost-riders"
                  className="inline-block rounded bg-[#d4af37] px-4 py-2.5 text-xs font-bold text-[#080708]"
                >
                  View Preserved Partner Tour Collection →
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
  const servedPlaces = NEW_ORLEANS_PLACES.filter(
    (pl) =>
      pl.publicPlaceSlug &&
      operator.publicPlaceSlugs.includes(pl.publicPlaceSlug),
  );
  const separateOperators = (operator.separateFromOperatorIds || [])
    .map((sepId) => NEW_ORLEANS_OPERATORS.find((o) => o.operatorId === sepId))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  return (
    <div data-wno-surface="directory-dark" className="min-h-screen bg-[#080708] text-[#fdfbf7]">
      {/* HERO & GOVERNANCE HEADER */}
      <section className="border-b border-[#d4af37]/20 bg-[#110e14] px-6 py-14 md:py-18">
        <div className="mx-auto max-w-6xl">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/60">
            <Link href="/" className="hover:text-[#d4af37]">
              Home
            </Link>
            <span>/</span>
            <Link href="/operators" className="hover:text-[#d4af37]">
              Tour Operators
            </Link>
            <span>/</span>
            <span className="text-[#d4af37]">{operator.name}</span>
          </nav>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 font-bold uppercase tracking-wider text-[#d4af37]">
              Canonical Operator Profile
            </span>
            {operator.verifiedOwnershipBadges.map((badge) => (
              <span
                key={badge.tag}
                className="rounded-full border border-emerald-400/30 bg-emerald-950/30 px-3 py-1 font-medium text-emerald-200"
              >
                {badge.label}
              </span>
            ))}
          </div>

          <h1 className="mt-4 font-serif text-4xl md:text-6xl">
            {operator.name}
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-[#e8d59e]">
            {operator.tagline}
          </p>
          <p className="mt-4 max-w-4xl text-base leading-8 text-white/80">
            {operator.companyOverview}
          </p>

          {operator.claimStatus === "unclaimed" && (
            <p
              data-testid="operator-hero-unclaimed-notice"
              className="mt-5 max-w-3xl rounded-lg border border-amber-400/30 bg-amber-950/25 px-4 py-2.5 text-xs text-amber-100"
            >
              {UNCLAIMED_OPERATOR_PROFILE_NOTICE}{" "}
              <a
                href="#claim-operator-profile"
                className="font-semibold text-[#d4af37] underline"
              >
                Claim or update this profile ($0) →
              </a>
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/85">
            {operator.officialPhone && (
              <span className="rounded border border-white/15 bg-white/5 px-3.5 py-2">
                <strong>Phone:</strong> {operator.officialPhone}
              </span>
            )}
            {operator.officialWebsite && (
              <a
                href={operator.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-white/15 bg-white/5 px-3.5 py-2 text-[#d4af37] underline"
              >
                Official Operator Website ↗
              </a>
            )}
            <span className="rounded border border-white/15 bg-white/5 px-3.5 py-2">
              <strong>Live Feed:</strong>{" "}
              {liveConnected ? "Connected" : "Not yet connected"}
            </span>
            <span className="rounded border border-white/15 bg-white/5 px-3.5 py-2">
              <strong>Direct 10% Checkout:</strong>{" "}
              {directConnected ? "Connected" : "Not yet connected"}
            </span>
            <span className="rounded border border-white/15 bg-white/5 px-3.5 py-2">
              <strong>Verified:</strong> {operator.verifiedAt}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* SEPARATE-ENTITY DISAMBIGUATION BANNER (e.g. Ragin' Cajun vs Airboat Adventures) */}
        {operator.separationGovernanceNote && (
          <section
            data-testid="operator-separation-governance-banner"
            className="mb-10 rounded-xl border border-amber-400/40 bg-amber-950/25 p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Separate-Company Identity &amp; Dock Notice
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              {operator.separationGovernanceNote}
            </p>
            {separateOperators.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {separateOperators.map((other) => (
                  <Link
                    key={other.operatorId}
                    href={`/operators/${other.slug}`}
                    className="font-semibold text-[#d4af37] underline"
                  >
                    Compare separate company: {other.name} →
                  </Link>
                ))}
                {operator.slug === "airboat-adventures" && (
                  <Link
                    href="/tours/airboat-adventures"
                    className="font-semibold text-[#d4af37] underline"
                  >
                    Open Airboat Adventures vessel comparison directory →
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
            className="mb-12 rounded-xl border border-[#d4af37]/35 bg-[#121016] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Operator vs. Vessel Distinction &amp; Wharf Resolution
            </p>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl">
              Distinct vessels operated by {operator.name}
            </h2>
            <p className="mt-2 text-sm text-white/75">
              Do not assume both vessels board at the exact same gangway when sailing
              simultaneously—check your product and departure wharf below:
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {operator.operatedVessels.map((vessel) => (
                <div
                  key={vessel.vesselId}
                  className="rounded-lg border border-white/15 bg-[#0b090e] p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                    {vessel.vesselType}
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-white">
                    {vessel.vesselName}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/80">
                    {vessel.propulsionAndHullSummary}
                  </p>
                  <p className="mt-3 text-xs text-white/90">
                    <strong>Primary Boarding Wharf:</strong> {vessel.primaryWharfName} (
                    {vessel.primaryWharfAddress})
                  </p>
                  <p className="mt-1.5 text-xs text-amber-200/90">
                    {vessel.companionOrSubstituteWharfRule}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PICKUP, ACCESSIBILITY & PARTICIPANT RULES */}
        <section className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-[#121016] p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              Docks, Check-In &amp; Pickup
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
              {operator.arrivalAndPickupSummary}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-[#121016] p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              Accessibility &amp; Mobility
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
              {operator.accessibilityAndMobilityNotes}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-[#121016] p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37]">
              Age &amp; Rider Policies
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
              {operator.participantPolicies}
            </p>
          </div>
        </section>

        {/* 1. PRESERVED WNO STOREFRONT PRODUCT CARDS (IF IN WNO_OPERATOR_ENTITIES) */}
        {wnoInventoryEntity && wnoInventoryEntity.products.length > 0 && (
          <section className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Experiences on Welcome to New Orleans Tours
            </p>
            <h2 className="mt-2 font-serif text-3xl">
              Curated {operator.name} departures &amp; booking options
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-white/75">
              Select a tour below to inspect full trip fit, luggage guidance, and attributed
              operator/partner checkout.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {wnoInventoryEntity.products.map((product) => (
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
          </section>
        )}

        {/* 2. PRESERVED RESEARCHED OPERATOR PARTNER BOOKING CARDS (P00306962) */}
        {researchedProfile && (
          <section className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Verified Partner Booking Links
            </p>
            <h2 className="mt-2 font-serif text-3xl">
              Book {researchedProfile.name} experiences
            </h2>
            <p className="mt-2 text-sm text-white/75">
              Check current dates, prices, and cancellation terms on the partner checkout shown
              below (we may earn a commission at no extra cost to you).
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {researchedProfile.products.map((product) => {
                const booking = getOperatorBooking(product, researchedProfile.slug);
                return (
                  <article
                    key={product.viatorUrl}
                    className="rounded-xl border border-[#d4af37]/40 bg-[#121016] p-6"
                  >
                    <h3 className="text-xl font-semibold text-white">
                      {product.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      {product.description}
                    </p>
                    <a
                      href={booking.url}
                      rel="sponsored noopener"
                      className="mt-5 inline-block rounded bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#080708]"
                    >
                      Check dates &amp; prices on {booking.provider} →
                    </a>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. CANONICAL PRODUCT-LEVEL BOARDING & LOGISTICS MATRIX */}
        {activeProducts.length > 0 && (
          <section
            data-testid="operator-canonical-products-matrix"
            className="mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Product-Level Boarding &amp; Departure Resolution
            </p>
            <h2 className="mt-2 font-serif text-3xl">
              Exact dock, wharf &amp; pickup rules by tour
            </h2>
            <div className="mt-6 space-y-4">
              {activeProducts.map((prod) => {
                const bookingHref =
                  prod.viatorOfficialUrl ||
                  prod.fareharborDirectUrl ||
                  prod.wnoPublicTourPath ||
                  prod.officialProductUrl;
                const isExternalPartner =
                  bookingHref.startsWith("https://www.viator.com") ||
                  bookingHref.startsWith("https://fareharbor.com");

                return (
                  <article
                    key={prod.productId}
                    className="rounded-xl border border-white/15 bg-[#121016] p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#d4af37]">
                        {prod.vesselTypeSummary} · {prod.durationLabel}
                      </span>
                      <span className="text-white/75">{prod.priceDisplayLabel}</span>
                    </div>
                    <h3 className="mt-2 font-serif text-2xl text-white">
                      {prod.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/80">{prod.summary}</p>
                    <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-[#0b090e] p-4 text-xs text-white/85 md:grid-cols-2">
                      <div>
                        <strong className="text-white">
                          Primary Boarding Wharf / Dock:
                        </strong>
                        <p className="mt-1 text-white/75">
                          {prod.boardingLocationResolution.primaryBoardingWharfOrDock}
                        </p>
                      </div>
                      <div>
                        <strong className="text-white">
                          Check-In &amp; Voucher Rule (
                          {prod.boardingLocationResolution.checkInLeadMinutes}m prior):
                        </strong>
                        <p className="mt-1 text-white/75">
                          {prod.boardingLocationResolution.voucherConfirmationRule}
                        </p>
                        {prod.boardingLocationResolution
                          .companionOrAlternateBoardingRule && (
                          <p className="mt-1 text-amber-200/90">
                            {
                              prod.boardingLocationResolution
                                .companionOrAlternateBoardingRule
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                      <Link
                        href={`/areas/${prod.placeSlug}`}
                        className="rounded border border-white/20 px-3 py-2 text-white hover:border-[#d4af37]"
                      >
                        Departure Area: /areas/{prod.placeSlug}
                      </Link>
                      {prod.visitedHistoricSiteIds?.map((siteId) => {
                        const siteSlug = siteId.replace(/^place:/, "");
                        return (
                          <Link
                            key={siteId}
                            href={`/areas/${siteSlug}`}
                            className="rounded border border-[#d4af37]/40 px-3 py-2 text-[#d4af37]"
                          >
                            Historic Site Museum: /areas/{siteSlug}
                          </Link>
                        );
                      })}
                      {prod.wnoPublicTourPath &&
                      !prod.wnoPublicTourPath.startsWith("/operators/") ? (
                        <Link
                          href={prod.wnoPublicTourPath}
                          className="ml-auto rounded bg-[#d4af37] px-4 py-2 font-bold text-[#080708]"
                        >
                          Open Tour Page &amp; Booking →
                        </Link>
                      ) : isExternalPartner ? (
                        <a
                          href={bookingHref}
                          rel="sponsored noopener"
                          target="_blank"
                          className="ml-auto rounded bg-[#d4af37] px-4 py-2 font-bold text-[#080708]"
                        >
                          Check Dates &amp; Prices →
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* SERVED CANONICAL AREAS */}
        {servedPlaces.length > 0 && (
          <section className="mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Served Areas, Wetland Basins &amp; Historic Sites
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {servedPlaces.map((pl) => (
                <Link
                  key={pl.placeId}
                  href={`/areas/${pl.publicPlaceSlug}`}
                  className="rounded-lg border border-white/15 bg-[#121016] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#d4af37]"
                >
                  {pl.name} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* PRIMARY SOURCES */}
        <section className="border-t border-white/15 pt-8 text-xs text-white/70">
          <p className="font-bold uppercase tracking-wider text-white/90">
            Primary Sources &amp; Verification Provenance (Verified {operator.verifiedAt})
          </p>
          <ul className="mt-3 space-y-1.5">
            {operator.sources.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4af37] underline"
                >
                  {src.label}
                </a>{" "}
                (checked {src.checkedAt})
              </li>
            ))}
          </ul>
        </section>

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
