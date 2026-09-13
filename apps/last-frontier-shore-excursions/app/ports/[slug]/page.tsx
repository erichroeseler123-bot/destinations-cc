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

const SITE = "https://www.lastfrontiershoreexcursions.com";

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
    description: `Compare ${port.name} Alaska shore excursions by experience, port-day fit, duration, and weather backup. 45-minute return-to-ship safety rule.`,
    alternates: { canonical: `${SITE}/ports/${port.slug}` },
    openGraph: {
      title: `${port.name} Shore Excursions | Last Frontier Shore Excursions`,
      description: `Compare ${port.name} Alaska shore excursions by experience, port-day fit, duration, and weather backup.`,
      url: `${SITE}/ports/${port.slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "website",
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

  const primaryBrowseUrl = portExcursions.length > 0
    ? buildAffiliateUrl(portExcursions[0].source, portExcursions[0].officialUrl, portExcursions[0].attributionCampaign)
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
                    url: buildAffiliateUrl(ex.source, ex.officialUrl, ex.attributionCampaign),
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

      <section className="port-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>{port.name}</span>
          </nav>
          <p className="eyebrow" style={{ color: "#607078" }}>{port.region} · Cruise Port Guide</p>
          <h1>{port.name} Shore Excursions</h1>
          <p className="lead" style={{ color: "#485b63" }}>{port.hook}</p>
          <div className="cta-row">
            <a className="button" href={primaryBrowseUrl} target="_blank" rel="sponsored noopener noreferrer">
              Browse live tours on partner platforms →
            </a>
            <a className="button secondary" href="#calculator">
              Calculate {port.name} ship window
            </a>
          </div>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* Dock & Tender Logistics Bar */}
      <section className="section" style={{ background: "#ffffff", borderBottom: "1px solid var(--line)", padding: "28px 0" }}>
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
            Know your dock location before selecting a tour. Terminal transfer times dictate whether an excursion complies with our 45-minute return safety margin:
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

      {/* Interactive Excursions Filter & Comparison */}
      <section className="section" id="clusters" style={{ background: "#f8fbfb" }}>
        <div className="shell">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>Compare Port Excursions</p>
              <h2>{port.name} Shore Excursion Directory</h2>
            </div>
            <span style={{ fontSize: "14px", color: "var(--forest)", fontWeight: 700 }}>
              {portExcursions.length} Curated Options
            </span>
          </div>

          <ExcursionFilters excursions={portExcursions} initialPort={slug as PortSlug} showPortFilter={false} />
          <TrustDisclosure />
        </div>
      </section>

      {/* Activity Clusters Cards */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="shell">
          <h2>{port.name} Excursion Categories</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            In-depth timing breakdowns, return buffers, and curated independent providers for every major {port.name} experience:
          </p>

          <div className="grid" style={{ marginTop: 24 }}>
            {activities.map((act) => (
              <Link className="card" href={`/${act.portSlug}/${act.slug}`} key={act.slug}>
                <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                  {act.typicalDuration}
                </span>
                <h3>{act.h1}</h3>
                <p>{act.metaDescription}</p>
                <div className="chips">
                  <span className="chip">{act.returnMargin}</span>
                  <span className="chip" style={{ color: act.weatherSensitivity === 'High' ? '#9e2323' : '#156d3a' }}>
                    {act.weatherSensitivity} Sensitivity
                  </span>
                </div>
              </Link>
            ))}
          </div>
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
    </main>
  );
}
