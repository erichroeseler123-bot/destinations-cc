import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PORTS, getPort } from "@/lib/ports";
import { getPortActivities } from "@/lib/portActivities";
import { getExcursionsByPort } from "@/lib/affiliate/catalog";
import { PortSlug } from "@/lib/affiliate/types";
import { buildAffiliateUrl } from "@/lib/affiliate/links";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { ExcursionFilters } from "@/components/ExcursionFilters";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import { ApprovedResearchQualificationSection } from "@/components/ApprovedResearchQualificationSection";
import { JuneauNormalizedSupplierFeedSection } from "@/components/JuneauNormalizedSupplierFeedSection";
import { loadLfseJuneauNormalizedSupplierFeed } from "@/lib/dccJuneauSupplierFeed";
import {
  BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS,
  loadLfseApprovedPortFacts,
  qualifyLfsePortDirectContexts,
} from "@/lib/dccResearchFeed";

const SITE = "https://www.lastfrontiershoreexcursions.com";

function getDistinctCategoryTourCount(
  activitySlug: string,
  portExcursions: ReturnType<typeof getExcursionsByPort>,
  liveFeedTours: Array<{
    normalizedTourId: string;
    activityCategory: string;
    matchedViatorProductCode: string | null;
    departureOptions?: Array<{ availableSpots: number | null }>;
    availableSpots: number | null;
  }>,
): number {
  const seenKeys = new Set<string>();
  for (const ex of portExcursions) {
    if (ex.activitySlug === activitySlug) {
      seenKeys.add((ex.productId || ex.title).trim().toLowerCase());
    }
  }
  for (const tour of liveFeedTours) {
    const matchesActivity =
      (activitySlug === "whale-watching" &&
        (tour.activityCategory === "whale-watching" ||
          tour.activityCategory === "combo-whale-glacier")) ||
      (activitySlug === "mendenhall-glacier-tours" &&
        (tour.activityCategory === "mendenhall-glacier-tours" ||
          tour.activityCategory === "combo-whale-glacier")) ||
      tour.activityCategory === activitySlug;
    if (!matchesActivity) continue;
    const hasPositive =
      Array.isArray(tour.departureOptions) && tour.departureOptions.length > 0
        ? tour.departureOptions.some(
            (o) => typeof o.availableSpots === "number" && o.availableSpots > 0,
          )
        : typeof tour.availableSpots === "number" && tour.availableSpots > 0;
    if (!hasPositive) continue;
    const dedupKey = (tour.matchedViatorProductCode || tour.normalizedTourId).trim().toLowerCase();
    seenKeys.add(dedupKey);
  }
  return seenKeys.size;
}

export function generateStaticParams() {
  return PORTS.map((port) => ({ slug: port.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const port = getPort(slug);
  if (!port) return {};
  return {
    title: `${port.name} Shore Excursions | Cruise-Safe Port Guide & Tours`,
    description: `Compare ${port.name} Alaska shore excursions by experience, port-day fit, duration, and weather backup. 2-hour recommended return-to-ship buffer.`,
    alternates: { canonical: `${SITE}/ports/${port.slug}` },
    openGraph: {
      title: `${port.name} Shore Excursions | Last Frontier Shore Excursions`,
      description: `Compare ${port.name} Alaska shore excursions by experience, port-day fit, duration, and weather backup.`,
      url: `${SITE}/ports/${port.slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
      images: [
        {
          url: `${SITE}${port.image}`,
          width: 1600,
          height: 1067,
          alt: port.imageAlt,
        },
      ],
    },
  };
}

export default async function PortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const port = getPort(slug);
  if (!port) notFound();

  const activities = getPortActivities(slug);
  const portExcursions = getExcursionsByPort(slug as PortSlug);

  const [researchLoad, juneauNormalizedFeed] = await Promise.all([
    slug === "juneau" || slug === "ketchikan"
      ? loadLfseApprovedPortFacts(slug, { revalidateSeconds: 60 })
      : Promise.resolve(null),
    slug === "juneau"
      ? loadLfseJuneauNormalizedSupplierFeed({ date: "2027-07-15", revalidateSeconds: 120 })
      : Promise.resolve(null),
  ]);
  const researchQualifications = researchLoad
    ? qualifyLfsePortDirectContexts(slug, researchLoad.facts)
    : [];

  const primaryBrowseUrl = portExcursions.length > 0
    ? buildAffiliateUrl(portExcursions[0].source, portExcursions[0].officialUrl, portExcursions[0].attributionCampaign, portExcursions[0].title, portExcursions[0].isExactProduct)
    : buildAffiliateUrl("viator", `${port.name} Alaska shore excursions`, `${port.slug}-hub`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: `${port.name} Shore Excursions`, item: `${SITE}/ports/${port.slug}` },
        ],
      },
      {
        "@type": "TouristDestination",
        name: `${port.name}, Alaska`,
        description: port.hook,
        touristType: ["Cruise Travelers", "Excursion Planners"],
      },
      ...(portExcursions.length > 0
        ? [
            {
              "@type": "ItemList",
              name: `${port.name} Featured Excursions`,
              itemListElement: portExcursions.map((ex, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Product",
                  name: ex.title,
                  description: ex.description,
                  offers: {
                    "@type": "Offer",
                    price: ex.priceFrom,
                    priceCurrency: ex.currency,
                    availability: "https://schema.org/InStock",
                    url: buildAffiliateUrl(ex.source, ex.officialUrl, ex.attributionCampaign, ex.title, ex.isExactProduct),
                  },
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="port-hero" style={{ padding: "40px 0 36px" }}>
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>{port.name}</span>
          </nav>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
            <div>
              <p className="eyebrow" style={{ color: "#607078" }}>{port.region} · Cruise Port Guide</p>
              <h1 style={{ marginTop: 6, marginBottom: 12 }}>{port.name} Shore Excursions</h1>
              <p className="lead" style={{ color: "#485b63", fontSize: "17px", marginBottom: 20 }}>{port.hook}</p>
              <div className="cta-row">
                <a className="button" href="#excursion-categories">
                  Explore {port.name} excursions ↓
                </a>
                <a className="button secondary" href="#calculator">
                  Calculate {port.name} ship window
                </a>
              </div>
              <TrustDisclosure compact />
            </div>

            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--card-shadow)",
                  aspectRatio: "16 / 10",
                  background: "#eef5f6",
                }}
              >
                <img
                  src={port.image}
                  alt={port.imageAlt}
                  width={1600}
                  height={1067}
                  loading="eager"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 10,
                    background: "rgba(14, 26, 31, 0.75)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {port.imageCaption}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Clusters Cards (Before calculator & technical evidence) */}
      <section className="section" id="excursion-categories" style={{ background: "#ffffff", padding: "32px 0" }}>
        <div className="shell">
          <h2>{port.name} Excursion Categories</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Choose an excursion category for timing breakdowns, return buffers, and available local operators in {port.name}:
          </p>

          <div className="grid" style={{ marginTop: 20 }}>
            {activities.map((act) => {
              const catCount = getDistinctCategoryTourCount(
                act.slug,
                portExcursions,
                juneauNormalizedFeed?.tours ?? [],
              );
              return (
                <Link className="card" href={`/${act.portSlug}/${act.slug}`} key={act.slug}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span className="badge badge-safety" style={{ alignSelf: "flex-start" }}>
                      {act.typicalDuration}
                    </span>
                    {catCount > 0 && (
                      <span
                        data-testid={`lfse-category-count-${act.slug}`}
                        style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--forest)", whiteSpace: "nowrap" }}
                      >
                        {catCount} {catCount === 1 ? "tour" : "tours"}
                      </span>
                    )}
                  </div>
                  <h3>{act.h1}</h3>
                  <p>{act.metaDescription}</p>
                  <div className="chips">
                    <span className="chip">{act.returnMargin}</span>
                    <span className="chip" style={{ color: act.weatherSensitivity === 'High' ? '#9e2323' : '#156d3a' }}>
                      {act.weatherSensitivity} Sensitivity
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {juneauNormalizedFeed && (
        <JuneauNormalizedSupplierFeedSection feed={juneauNormalizedFeed} />
      )}

      {/* Interactive Excursions Filter & Comparison */}
      <section className="section" id="clusters" style={{ background: "#f8fbfb" }}>
        <div className="shell">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>Compare Port Excursions</p>
              <h2>{port.name} Shore Excursion Directory</h2>
            </div>
            <span
              data-testid="lfse-port-excursion-count"
              style={{ fontSize: "14px", color: "var(--forest)", fontWeight: 700 }}
            >
              {portExcursions.length} {port.name} {portExcursions.length === 1 ? "excursion" : "excursions"}
            </span>
          </div>

          <ExcursionFilters excursions={portExcursions} initialPort={slug as PortSlug} showPortFilter={false} />
          <TrustDisclosure />
        </div>
      </section>

      {/* Dock & Tender Logistics Bar */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "28px 0" }}>
        <div className="shell">
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Typical Port Call</strong>
              <span style={{ fontSize: "16px", color: "var(--ink)", fontWeight: 600 }}>{port.typicalPortHours}</span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tendering Status</strong>
              <span style={{ fontSize: "14px", color: "var(--ink)" }}>{port.tenderStatus}</span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dock Berths</strong>
              <span style={{ fontSize: "14px", color: "var(--ink)" }}>{port.dockLocations.length} active berthing areas</span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Weather Reality</strong>
              <span style={{ fontSize: "13px", color: "#156d3a", fontWeight: 600 }}>{port.weatherBackup.slice(0, 70)}...</span>
            </div>
          </div>
        </div>
      </section>

      {/* Port Dock Locations Breakdown */}
      <section className="section" style={{ padding: "32px 0", background: "#f8fbfb" }}>
        <div className="shell">
          <h2>{port.name} Cruise Dock Logistics & Shuttle Transit</h2>
          <p style={{ color: "var(--muted)", maxWidth: 750 }}>
            Know your dock location before selecting a tour. Terminal transfer times dictate whether an excursion complies with our 2-hour recommended return buffer:
          </p>
          <div className="grid" style={{ marginTop: 20 }}>
            {port.dockLocations.map((dock, index) => (
              <div className="card" key={index} style={{ background: "#ffffff", border: "1px solid var(--line)" }}>
                <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 6 }}>
                  Berth {index + 1}
                </span>
                <strong style={{ fontSize: "16px", color: "var(--forest)", display: "block" }}>{dock}</strong>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: 6 }}>
                  Allow sufficient transfer buffer when meeting independent guides outside port security gates.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cruise Window Calculator */}
      <section className="section" id="calculator" style={{ background: "#ffffff" }}>
        <div className="shell">
          <CruiseWindowCalculator portSlug={slug as PortSlug} defaultDurationMinutes={portExcursions[0]?.durationMinutes || 210} />
        </div>
      </section>

      {/* Weather Backup Section */}
      <section className="section" style={{ background: "#f8fbfb" }}>
        <div className="shell">
          <div className="callout">
            <h2 style={{ fontSize: "20px", marginTop: 0 }}>Weather & Port Reality in {port.name}</h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6, marginTop: 8 }}>
              {port.weatherBackup}
            </p>
          </div>
        </div>
      </section>

      {researchQualifications.length > 0 && (
        <section className="section" style={{ background: "#ffffff", borderTop: "1px solid var(--line)", padding: "24px 0" }}>
          <div className="shell">
            <details
              data-testid="lfse-port-research-methodology-details"
              style={{
                background: "#f8fbfb",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "14px 18px",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "15px", color: "var(--deep)" }}>
                Research &amp; Operator Verification Methodology
              </summary>
              <div style={{ marginTop: 14 }}>
                <ApprovedResearchQualificationSection
                  portSlug={slug}
                  initialQualifications={researchQualifications}
                  initialLastSyncedAt={researchLoad?.lastSyncedAt ?? null}
                  blockedUmbrellaProducts={
                    slug === "ketchikan"
                      ? [...BLOCKED_KETCHIKAN_UMBRELLA_PRODUCTS]
                      : []
                  }
                />
              </div>
            </details>
          </div>
        </section>
      )}
    </main>
  );
}
