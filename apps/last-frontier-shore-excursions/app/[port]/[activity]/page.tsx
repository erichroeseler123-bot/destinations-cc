import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PORT_ACTIVITIES, getPortActivity } from "@/lib/portActivities";
import { getPort } from "@/lib/ports";
import { buildAffiliateUrl } from "@/lib/affiliate/links";
import { getExcursionsByActivity, getExcursionsByPort } from "@/lib/affiliate/catalog";
import { getEditorialInsight } from "@/lib/affiliate/editorial";
import { getActivityImage } from "@/lib/images";
import { PortSlug } from "@/lib/affiliate/types";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { ExcursionCard } from "@/components/ExcursionCard";
import { ExcursionComparisonTable } from "@/components/ExcursionComparisonTable";
import { TrustDisclosure } from "@/components/TrustDisclosure";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export function generateStaticParams() {
  return PORT_ACTIVITIES.map((activity) => ({
    port: activity.portSlug,
    activity: activity.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ port: string; activity: string }>;
}): Promise<Metadata> {
  const { port, activity } = await params;
  const item = getPortActivity(port, activity);
  if (!item) return {};

  const image = getActivityImage(port, activity);

  return {
    title: item.title,
    description: item.metaDescription,
    alternates: {
      canonical: `${SITE}/${item.portSlug}/${item.slug}`,
    },
    openGraph: {
      title: item.title,
      description: item.metaDescription,
      url: `${SITE}/${item.portSlug}/${item.slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "article",
      images: [
        {
          url: `${SITE}${image.url}`,
          width: 1200,
          height: 800,
          alt: image.alt,
        },
      ],
    },
  };
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ port: string; activity: string }>;
}) {
  const { port, activity } = await params;
  const item = getPortActivity(port, activity);
  const portData = getPort(port);

  if (!item || !portData) notFound();

  const editorial = getEditorialInsight(port, activity);
  const matchedExcursions = getExcursionsByActivity(port as PortSlug, activity);
  const fallbackExcursions = matchedExcursions.length > 0 ? matchedExcursions : getExcursionsByPort(port as PortSlug).slice(0, 2);
  const activityImg = getActivityImage(port, activity);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${portData.name} Shore Excursions`,
            item: `${SITE}/ports/${portData.slug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: item.h1,
            item: `${SITE}/${item.portSlug}/${item.slug}`,
          },
        ],
      },
      {
        "@type": "TouristTrip",
        name: item.h1,
        description: item.metaDescription,
        touristType: ["Cruise Travelers", "Families", "Adventure Travelers"],
        itinerary: {
          "@type": "ItemList",
          numberOfItems: 5,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: `Disembarkation: ${item.timingBreakdown.disembarkation}` },
            { "@type": "ListItem", position: 2, name: `Travel to Site: ${item.timingBreakdown.travelToSite}` },
            { "@type": "ListItem", position: 3, name: `Active Experience: ${item.timingBreakdown.activeExperience}` },
            { "@type": "ListItem", position: 4, name: `Return Transit: ${item.timingBreakdown.returnTransit}` },
            { "@type": "ListItem", position: 5, name: `Pier Return Buffer: ${item.timingBreakdown.pierBuffer}` },
          ],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: item.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      ...(fallbackExcursions.length > 0
        ? [
            {
              "@type": "ItemList",
              name: `${item.h1} Curated Excursion Options`,
              itemListElement: fallbackExcursions.map((ex, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "TouristTrip",
                  name: ex.title,
                  description: ex.description,
                  provider: {
                    "@type": "Organization",
                    name: ex.provider,
                  },
                },
              })),
            },
          ]
        : []),
    ],
  };

  const primaryOutboundUrl = fallbackExcursions.length > 0
    ? buildAffiliateUrl(fallbackExcursions[0].source, fallbackExcursions[0].officialUrl, fallbackExcursions[0].attributionCampaign)
    : buildAffiliateUrl("viator", item.sampleTours[0]?.searchQuery || "Alaska shore excursions", item.sampleTours[0]?.campaignTag || "juneau-tour");

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
            <Link href={`/ports/${portData.slug}`}>{portData.name}</Link>
            <span>›</span>
            <span>{item.slug}</span>
          </nav>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "center" }}>
            <div>
              <p className="eyebrow" style={{ color: "#607078" }}>{item.eyebrow}</p>
              <h1 style={{ marginTop: 6, marginBottom: 12 }}>{item.h1}</h1>
              <p className="lead" style={{ color: "#485b63", fontSize: "16px", marginBottom: 20 }}>
                {item.overview[0]}
              </p>
              <div className="cta-row">
                <a
                  className="button"
                  href={primaryOutboundUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                >
                  Check live tour options & availability →
                </a>
                <Link className="button secondary" href="#calculator">
                  Calculate ship-window fit ↓
                </Link>
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
                  src={activityImg.url}
                  alt={activityImg.alt}
                  width={1200}
                  height={800}
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
                  {activityImg.caption}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Specs Bar */}
      <section className="section" style={{ background: "#ffffff", borderBottom: "1px solid var(--line)", padding: "28px 0" }}>
        <div className="shell">
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Typical Duration</strong>
              <span style={{ fontSize: "16px", color: "var(--ink)", fontWeight: 600 }}>{item.typicalDuration}</span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Return Margin</strong>
              <span style={{ fontSize: "16px", color: "#156d3a", fontWeight: 700 }}>{item.returnMargin}</span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Weather Sensitivity</strong>
              <span style={{ fontSize: "16px", color: item.weatherSensitivity === "High" ? "#9e2323" : "#156d3a", fontWeight: 700 }}>
                {item.weatherSensitivity} Sensitivity
              </span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--deep)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Meeting Point</strong>
              <span style={{ fontSize: "14px", color: "var(--ink)" }}>{item.meetingLogistics.slice(0, 75)}...</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cruise Window Calculator Section */}
      <section className="section" id="calculator" style={{ background: "#f8fbfb", padding: "36px 0" }}>
        <div className="shell">
          <CruiseWindowCalculator portSlug={port as PortSlug} defaultDurationMinutes={fallbackExcursions[0]?.durationMinutes || 210} />
        </div>
      </section>

      {/* Curated Partner Excursions Comparison */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>Curated Operator Options</p>
          <h2>Compare Cruise-Safe Excursion Options</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            Review real local operators, starting prices, departure schedules, and cancellation terms. Follow partner links to explore live availability with direct provider checkout:
          </p>

          <div className="grid" style={{ marginTop: 24 }}>
            {fallbackExcursions.map((excursion) => (
              <ExcursionCard key={excursion.attributionCampaign || excursion.title} excursion={excursion} />
            ))}
          </div>

          <ExcursionComparisonTable excursions={fallbackExcursions} />
          <TrustDisclosure />
        </div>
      </section>

      {/* Editorial Depth & Port Day Guidance */}
      <section className="section" style={{ background: "#fbfcfc", borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="grid-2">
            <div>
              <h2>How this excursion fits {portData.name}</h2>
              <p style={{ fontSize: "16px", color: "var(--ink)", lineHeight: 1.7, marginBottom: 16 }}>
                {editorial.whyThisFits}
              </p>

              <h3>Timing Risks & Dock Bottlenecks</h3>
              <p style={{ fontSize: "15px", color: "var(--ink)", lineHeight: 1.6, marginBottom: 16 }}>
                {editorial.timingRisks}
              </p>

              <h3>Meeting Point & Transfer Logistics</h3>
              <p style={{ fontSize: "15px", color: "var(--ink)", lineHeight: 1.6, marginBottom: 16 }}>
                {editorial.meetingPointExplanation}
              </p>

              <div className="callout" style={{ marginTop: 20 }}>
                <strong>Weather & Operating Reality</strong>
                <p style={{ marginTop: 6 }}>{editorial.weatherReality}</p>
              </div>
            </div>

            <div>
              <div className="card" style={{ background: "#ffffff" }}>
                <h3>Who Should Choose This</h3>
                <ul className="list">
                  {editorial.whoShouldChoose.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>

                <h3 style={{ marginTop: 24 }}>Who Should Consider Other Options</h3>
                <ul className="list">
                  {editorial.whoShouldAvoid.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>

                <div style={{ marginTop: 24, padding: "16px", background: "#f0f6f7", borderRadius: "6px" }}>
                  <strong style={{ display: "block", color: "var(--deep)", marginBottom: 4 }}>
                    Recommended Backup Option
                  </strong>
                  <p style={{ fontSize: "14px", margin: 0, color: "var(--ink)" }}>
                    {editorial.bestBackupOption}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cruise Safety Rule Banner */}
      <section className="section" id="safety" style={{ padding: "36px 0 0" }}>
        <div className="shell">
          <div className="rule">
            <span className="badge badge-safety">The 45-Minute Safety Standard</span>
            <h2 style={{ marginTop: 8, fontSize: "26px" }}>The Last Frontier Cruise Safety Standard</h2>
            <p style={{ fontWeight: 600, fontSize: "16px", marginBottom: 12 }}>
              {item.cruiseSafetyRule}
            </p>
            <div className="timing-matrix">
              <div className="timing-step">
                <span>1. Gangway Disembarkation & Meetup</span>
                <strong>{item.timingBreakdown.disembarkation}</strong>
              </div>
              <div className="timing-step">
                <span>2. Transit from Pier to Activity</span>
                <strong>{item.timingBreakdown.travelToSite}</strong>
              </div>
              <div className="timing-step">
                <span>3. Active Tour / Wildlife / Flight</span>
                <strong>{item.timingBreakdown.activeExperience}</strong>
              </div>
              <div className="timing-step">
                <span>4. Return Transit to Cruise Pier</span>
                <strong>{item.timingBreakdown.returnTransit}</strong>
              </div>
              <div className="timing-step">
                <span>5. Pier Arrival Margin Before All-Aboard</span>
                <strong>{item.timingBreakdown.pierBuffer}</strong>
              </div>
            </div>
            <p style={{ fontSize: "14px", margin: "8px 0 0" }}>
              <strong>Meeting Logistics:</strong> {item.meetingLogistics}
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Overview & Highlights */}
      <section className="section">
        <div className="shell">
          <div className="grid-2">
            <div>
              <h2>Experience Overview</h2>
              {item.overview.map((p, i) => (
                <p key={i} style={{ fontSize: "16px", color: "var(--ink)", lineHeight: "1.7", marginBottom: 16 }}>{p}</p>
              ))}

              <div className="callout">
                <strong>Weather Backup Advice</strong>
                <p style={{ marginTop: 6 }}>{item.weatherBackupAdvice}</p>
              </div>
            </div>

            <div>
              <div className="card" style={{ background: "#ffffff" }}>
                <h3>Key Highlights</h3>
                <ul className="list">
                  {item.keyHighlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>

                <h3 style={{ marginTop: 24 }}>What to Bring</h3>
                <ul className="list">
                  {item.whatToBring.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="section" style={{ background: "#f8fbfb" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>Port Day Questions</p>
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {item.faqs.map((faq) => (
              <article className="faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Methodology & Provenance */}
      <section className="section" style={{ borderTop: "1px solid var(--line)", background: "#ffffff" }}>
        <div className="shell">
          <h3>Last Frontier Editorial Methodology & Provenance</h3>
          <p style={{ fontSize: "14px", color: "#485b63", lineHeight: 1.6, maxWidth: 800 }}>
            {editorial.methodology} Our analysis is derived from official municipal port authority berthing calendars, National Park and Forest Service permits, and approved partner listing research across Viator and GetYourGuide.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
            {editorial.sourcesAndTimestamps.map((src, i) => (
              <span key={i} className="chip" style={{ fontSize: "12px", color: "var(--muted)" }}>
                Source: {src.name} (Reviewed {src.date})
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Link Silo */}
      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="grid-2">
            <div>
              <h3>More {portData.name} Shore Excursions</h3>
              <ul className="list">
                {item.relatedActivities.map((rel) => (
                  <li key={rel.href}>
                    <Link href={rel.href} style={{ color: "var(--forest)", fontWeight: 700 }}>
                      {rel.name} →
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={`/ports/${portData.slug}`} style={{ color: "var(--accent)", fontWeight: 700 }}>
                    Browse all {portData.name} port tours & dock guides →
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3>Cruise Decision Guides</h3>
              <ul className="list">
                {item.relatedDecisions.map((rel) => (
                  <li key={rel.href}>
                    <Link href={rel.href} style={{ color: "var(--forest)", fontWeight: 700 }}>
                      {rel.name} →
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/decision/best-excursion-for-each-port" style={{ color: "var(--accent)", fontWeight: 700 }}>
                    Best shore excursion for each Alaska port →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
