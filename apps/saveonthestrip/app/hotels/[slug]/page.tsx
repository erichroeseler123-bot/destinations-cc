import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpRequestForm } from "@/app/components/HelpRequestForm";
import { getVegasHotelGuide, getVegasHotelGuides } from "@/lib/hotels";

type HotelGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ sent?: string; error?: string }>;
};

export async function generateStaticParams() {
  return getVegasHotelGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: HotelGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getVegasHotelGuide(slug);
  if (!guide) return { title: "Vegas hotel guide not found | Save On The Strip" };

  return {
    title: `${guide.title} | Save On The Strip`,
    description: guide.description,
    alternates: {
      canonical: `https://saveonthestrip.com/hotels/${slug}`,
    },
  };
}

export default async function HotelGuidePage({ params, searchParams }: HotelGuidePageProps) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const guide = getVegasHotelGuide(slug);

  if (!guide) notFound();

  const fitNotes = [
    `${guide.shortTitle} is worth checking when hotel changes or reopening details affect whether the stay still makes sense.`,
    "Use this page before booking if the room choice still changes the shape of the trip.",
    "Skip deep hotel research if the room is just a sleep base and shows, dining, or tours matter more.",
  ] as const;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://saveonthestrip.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Hotels",
        item: "https://saveonthestrip.com/hotels",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.shortTitle,
        item: `https://saveonthestrip.com/hotels/${guide.slug}`,
      },
    ],
  };

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="panel">
        <div className="eyebrow">{guide.eyebrow}</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">{guide.title}</h1>
        <p className="lead">{guide.heroSummary}</p>
        <div style={{ height: 16 }} />
        <div className="cta-row">
          <Link href="/hotels" className="button button-secondary">
            Back to hotel guides
          </Link>
          <Link href="/deals" className="button button-primary">
            See Vegas deals
          </Link>
        </div>
        <div style={{ height: 14 }} />
        <div className="filter-pills">
          <div className="pill">{guide.updatedLabel}</div>
          {guide.quickFacts.map((fact) => (
            <div className="pill" key={fact.label}>
              {fact.label}
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-tight quick-start-panel">
        <div className="eyebrow">Use this page right</div>
        <h2>Decide whether this hotel still fits the stay.</h2>
        <div className="quick-start-grid">
          <Link href="/hotels" className="quick-start-card">
            <div className="eyebrow">Compare hotels</div>
            <h3>Go back to hotel guides</h3>
            <p>Use this when the room decision is still open and you want the cleaner side-by-side call.</p>
            <span className="quick-start-cta">Back to hotel guides</span>
          </Link>
          <Link href="/deals" className="quick-start-card">
            <div className="eyebrow">Save money</div>
            <h3>Check current deal lanes</h3>
            <p>Use this when the hotel still works, but the price or offer structure needs to improve.</p>
            <span className="quick-start-cta">Open deals</span>
          </Link>
          <article className="quick-start-card">
            <div className="eyebrow">Best fit</div>
            <h3>What this guide helps you answer</h3>
            <p>{fitNotes[0]}</p>
            <span className="quick-start-cta">Use the facts below</span>
          </article>
        </div>
      </section>

      <section className="grid">
        {guide.quickFacts.map((fact) => (
          <article className="card" key={fact.label}>
            <div className="eyebrow">{fact.label}</div>
            <h2>{fact.value}</h2>
          </article>
        ))}
      </section>

      {guide.sections.map((section) => (
        <section className="panel" key={section.title}>
          <div className="eyebrow">{section.eyebrow}</div>
          <div style={{ height: 10 }} />
          <h2>{section.title}</h2>
          <div style={{ height: 12 }} />
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets?.length ? (
            <>
              <div style={{ height: 10 }} />
              <ul className="list">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ))}

      <section className="grid">
        <article className="card">
          <div className="eyebrow">Best fit</div>
          <h2>When this hotel guide matters</h2>
          <ul className="list">
            {fitNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <div className="eyebrow">FAQ</div>
          <h2>Quick questions people keep asking</h2>
          <div className="faq-list">
            {guide.faq.map((item) => (
              <div key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <div className="eyebrow">Related pages</div>
          <div className="footer-links">
            <Link href="/deals">Vegas deals</Link>
            <Link href="/free-things">Free things to do</Link>
            <Link href="/shows">Vegas shows</Link>
            <Link href="/tours">Vegas tours</Link>
          </div>
        </article>
      </section>

      <HelpRequestForm
        sourcePath={`/hotels/${guide.slug}`}
        sent={sp.sent === "1"}
        error={sp.error === "contact"}
      />
    </main>
  );
}
