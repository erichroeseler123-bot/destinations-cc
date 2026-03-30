import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpRequestForm } from "@/app/components/HelpRequestForm";
import { getVegasTourSlug } from "@/lib/content";
import { getVegasTours } from "@/lib/fareharbor";

type TourDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function findTourBySlug(slug: string) {
  const payload = await getVegasTours().catch(() => ({ tours: [], companies: [], configured: false }));
  return payload.tours.find((tour) => getVegasTourSlug(tour) === slug) || null;
}

export async function generateStaticParams() {
  const payload = await getVegasTours().catch(() => ({ tours: [], companies: [], configured: false }));
  return payload.tours.slice(0, 60).map((tour) => ({ slug: getVegasTourSlug(tour) }));
}

export async function generateMetadata({ params }: TourDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = await findTourBySlug(slug);
  if (!tour) return { title: "Vegas tour not found | Save On The Strip" };
  return {
    title: `${tour.name} | Save On The Strip`,
    description: `${tour.name} from Las Vegas with area, duration, operator, and booking link.`,
    alternates: { canonical: `https://saveonthestrip.com/tours/${slug}` },
  };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const tour = await findTourBySlug(slug);
  if (!tour) notFound();

  const outboundHref = tour.productUrl
    ? `/api/tours/out?target=${encodeURIComponent(tour.productUrl)}&sourcePath=/tours/${slug}&sourceSlug=saveonthestrip-tour-detail&sourcePage=/tours/${slug}&topicSlug=vegas-tours&productSlug=${encodeURIComponent(tour.slug)}&company=${encodeURIComponent(tour.company)}&itemPk=${encodeURIComponent(String(tour.itemPk))}&area=${encodeURIComponent(tour.area)}`
    : null;

  const fitNotes = [
    `${tour.areaLabel} is the main decision lane for this tour.`,
    `${tour.durationLabel || "Variable duration"} tells you how much Strip time you are actually giving up.`,
    "Skip it if the trip only has room for a half-day or if leaving Vegas once already feels like enough.",
  ] as const;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">{tour.areaLabel}</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">{tour.name}</h1>
        <p className="lead">
          A cleaner tour page for deciding whether this is the one big Vegas outing worth taking.
        </p>
        <div style={{ height: 16 }} />
        <div className="cta-row">
          {outboundHref ? (
            <Link href={outboundHref} className="button button-primary">
              View operator page
            </Link>
          ) : null}
          <Link href="/tours" className="button button-secondary">
            Back to all tours
          </Link>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          {tour.imageUrl ? (
            <>
              <div className="inline-media-frame">
                <Image
                  src={tour.imageUrl}
                  alt={tour.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
              <div style={{ height: 12 }} />
            </>
          ) : null}
          <div className="eyebrow">Overview</div>
          <p>{tour.headline || tour.description || "Check the current operator page for live details."}</p>
          <p>
            {tour.durationLabel || "Duration varies"}
            {tour.fromPrice ? ` • ${tour.fromPrice}` : ""}
            {tour.company ? ` • ${tour.company}` : ""}
          </p>
        </article>
        <article className="card">
          <div className="eyebrow">Best fit</div>
          <h2>Good for one clear Vegas outing</h2>
          <ul className="list">
            {fitNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel panel-tight quick-start-panel">
        <div className="eyebrow">Next move</div>
        <h2>Book this, or resize the day.</h2>
        <div className="quick-start-grid">
          {outboundHref ? (
            <Link href={outboundHref} className="quick-start-card">
              <div className="eyebrow">Book this tour</div>
              <h3>Go to the operator page</h3>
              <p>Use this when this outing already fits the trip and you just want the live operator details.</p>
              <span className="quick-start-cta">View operator page</span>
            </Link>
          ) : null}
          <Link href="#hoover-dam-tours" className="quick-start-card">
            <div className="eyebrow">Smaller day</div>
            <h3>Compare easier half-day options</h3>
            <p>Use this if the current tour feels too large for the trip schedule.</p>
            <span className="quick-start-cta">See smaller day trips</span>
          </Link>
          <Link href="#las-vegas-experiences" className="quick-start-card">
            <div className="eyebrow">Stay closer</div>
            <h3>Keep it closer to Vegas</h3>
            <p>Use this if you want one outing without building the whole day around it.</p>
            <span className="quick-start-cta">See closer options</span>
          </Link>
        </div>
      </section>

      <HelpRequestForm sourcePath={`/tours/${slug}`} />
    </main>
  );
}
