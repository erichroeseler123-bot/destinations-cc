import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DECISION_PAGES, getDecisionPage } from "@/lib/decisionPages";
import { buildAffiliateUrl } from "@/lib/affiliate/links";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { TrustDisclosure } from "@/components/TrustDisclosure";

const SITE = "https://www.lastfrontiershoreexcursions.com";

export function generateStaticParams() {
  return DECISION_PAGES.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getDecisionPage(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: {
      canonical: `${SITE}/decision/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      url: `${SITE}/decision/${guide.slug}`,
      siteName: "Last Frontier Shore Excursions",
      type: "article",
    },
  };
}

export default async function DecisionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getDecisionPage(slug);
  if (!guide) notFound();

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
            name: "Decision Guides",
            item: `${SITE}/tours#decisions`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: guide.h1,
            item: `${SITE}/decision/${guide.slug}`,
          },
        ],
      },
      {
        "@type": "Article",
        headline: guide.h1,
        description: guide.metaDescription,
        author: {
          "@type": "Organization",
          name: "Last Frontier Shore Excursions Editorial Board",
          url: `${SITE}/about`,
        },
        publisher: {
          "@type": "Organization",
          name: "Last Frontier Shore Excursions",
          url: SITE,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
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
            <Link href="/tours#decisions">Decision Guides</Link>
            <span>›</span>
            <span>{guide.slug}</span>
          </nav>
          <p className="eyebrow" style={{ color: "#607078" }}>{guide.eyebrow}</p>
          <h1>{guide.h1}</h1>
          <p className="lead" style={{ color: "#485b63" }}>
            {guide.lead}
          </p>
          <div className="cta-row">
            <a className="button" href="#matrix">
              View comparison matrix ↓
            </a>
            <a className="button secondary" href="#calculator">
              Calculate ship-window fit
            </a>
          </div>
          <TrustDisclosure compact />
        </div>
      </section>

      {/* Quick Rule Banner */}
      <section className="section" style={{ background: "#ffffff", borderBottom: "1px solid var(--line)", padding: "24px 0" }}>
        <div className="shell">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="badge badge-safety">The 45-Minute Safety Rule</span>
            <strong style={{ fontSize: "16px", color: "var(--deep)" }}>
              {guide.quickRule}
            </strong>
          </div>
        </div>
      </section>

      {/* Comparison Matrix Table */}
      <section className="section" id="matrix">
        <div className="shell">
          <h2>Port Decision Matrix</h2>
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "white", border: "1px solid var(--line)" }}>
              <thead>
                <tr style={{ background: "#eef5f6", borderBottom: "2px solid var(--line)" }}>
                  {guide.comparisonMatrix.headers.map((h, i) => (
                    <th key={i} style={{ padding: "12px 14px", textAlign: "left", color: "var(--deep)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.comparisonMatrix.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)", background: i % 2 === 0 ? "white" : "#fbfcfc" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--forest)" }}>{row.category}</td>
                    <td style={{ padding: "12px 14px" }}>{row.col1}</td>
                    <td style={{ padding: "12px 14px" }}>{row.col2}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--ink)" }}>{row.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="section" id="calculator" style={{ background: "#f8fbfb" }}>
        <div className="shell">
          <CruiseWindowCalculator portSlug="juneau" defaultDurationMinutes={210} />
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="shell">
          <h2>Key Decision Factors</h2>
          <div className="grid" style={{ marginTop: 20 }}>
            {guide.keyTakeaways.map((takeaway, i) => (
              <div className="card" key={i} style={{ border: "1px solid var(--line)" }}>
                <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 6 }}>
                  Factor {i + 1}
                </span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", lineHeight: 1.6 }}>{takeaway}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* In-depth Sections */}
      <section className="section" style={{ background: "#fbfcfc", borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          {guide.inDepthSections.map((sec, i) => (
            <article key={i} style={{ marginBottom: 36, maxWidth: 840 }}>
              <h2>{sec.heading}</h2>
              {sec.paragraphs.map((p, pi) => (
                <p key={pi} style={{ fontSize: "16px", lineHeight: 1.7, color: "var(--ink)", marginBottom: 14 }}>{p}</p>
              ))}
              {sec.callout && (
                <div className="callout" style={{ marginTop: 14 }}>
                  <strong>Key Takeaway:</strong> {sec.callout}
                </div>
              )}
            </article>
          ))}

          <div className="callout" style={{ marginTop: 24 }}>
            <h3 style={{ marginTop: 0 }}>Cruise-Day All-Aboard Safety Rules</h3>
            <ul className="list">
              {guide.cruiseSafetyAdvice.map((advice, i) => (
                <li key={i}>{advice}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Recommended Tours */}
      <section className="section" id="recommendations" style={{ background: "#eef5f6" }}>
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>Curated Options</p>
          <h2>Recommended Cruise-Safe Excursions</h2>
          <p className="lead" style={{ color: "var(--muted)" }}>
            These provider excursions match our return-to-ship timing standards and booking boundaries:
          </p>

          <div className="grid" style={{ marginTop: 24 }}>
            {guide.recommendedTours.map((tour) => {
              const matched = AFFILIATE_CATALOG.find((c) => c.attributionCampaign.includes(tour.campaignTag) || tour.campaignTag.includes(c.attributionCampaign));
              const outboundUrl = matched
                ? buildAffiliateUrl(matched.source, matched.officialUrl, matched.attributionCampaign)
                : buildAffiliateUrl("viator", tour.searchQuery, tour.campaignTag);

              return (
                <article className="card" key={tour.name} style={{ background: "white" }}>
                  <span className="badge badge-safety" style={{ alignSelf: "flex-start", marginBottom: 8 }}>
                    {tour.port} · {tour.duration}
                  </span>
                  <h3>{tour.name}</h3>
                  <p style={{ flexGrow: 1 }}>{tour.whyItFits}</p>
                  <a
                    className="button"
                    href={outboundUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                  >
                    Search live options on partner platform →
                  </a>
                  <TrustDisclosure compact />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="section">
        <div className="shell">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>Common Questions</p>
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {guide.faqs.map((faq) => (
              <article className="faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Related Silos */}
      <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="shell">
          <div className="grid-2">
            <div>
              <h3>Related Port Excursions</h3>
              <ul className="list">
                {guide.relatedActivities.map((rel) => (
                  <li key={rel.href}>
                    <Link href={rel.href} style={{ color: "var(--forest)", fontWeight: 700 }}>
                      {rel.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3>More Decision Guides</h3>
              <ul className="list">
                {guide.relatedDecisions.map((rel) => (
                  <li key={rel.href}>
                    <Link href={rel.href} style={{ color: "var(--forest)", fontWeight: 700 }}>
                      {rel.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
