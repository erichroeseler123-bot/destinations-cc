import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpRequestForm } from "@/app/components/HelpRequestForm";
import { getSeatGeekVegasEvents } from "@/lib/seatgeek";
import { getVegasShowSlug } from "@/lib/content";
import { getVegasShows } from "@/lib/ticketmaster";

type ShowDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function buildTicketHref(show: Awaited<ReturnType<typeof getVegasShows>>[number]) {
  if (!show.url) return null;
  const slug = getVegasShowSlug(show);
  const url = new URL("/api/tickets/out", "https://saveonthestrip.com");
  url.searchParams.set("target", show.url);
  url.searchParams.set("affiliateTarget", "ticketmaster");
  url.searchParams.set("sourcePath", `/shows/${slug}`);
  url.searchParams.set("sourceSlug", "saveonthestrip-show-detail");
  url.searchParams.set("sourcePage", `/shows/${slug}`);
  url.searchParams.set("topicSlug", "vegas-shows");
  url.searchParams.set("eventId", show.id);
  url.searchParams.set("eventName", show.name);
  if (show.localDate) url.searchParams.set("eventDate", show.localDate);
  return url.pathname + url.search;
}

async function findShowBySlug(slug: string) {
  const shows = await getVegasShows().catch(() => []);
  return shows.find((show) => getVegasShowSlug(show) === slug) || null;
}

export async function generateStaticParams() {
  const shows = await getVegasShows().catch(() => []);
  return shows.slice(0, 40).map((show) => ({ slug: getVegasShowSlug(show) }));
}

export async function generateMetadata({ params }: ShowDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const show = await findShowBySlug(slug);
  if (!show) return { title: "Vegas show not found | Save On The Strip" };
  return {
    title: `${show.name} | Save On The Strip`,
    description: `${show.name} in Las Vegas with venue context, schedule information, and ticket links.`,
    alternates: { canonical: `https://saveonthestrip.com/shows/${slug}` },
  };
}

export default async function ShowDetailPage({ params }: ShowDetailPageProps) {
  const { slug } = await params;
  const show = await findShowBySlug(slug);
  if (!show) notFound();

  const seatGeekShows = await getSeatGeekVegasEvents().catch(() => []);
  const relatedSeatGeek = seatGeekShows
    .filter(
      (row) =>
        row.venueName?.toLowerCase() === show.venueName?.toLowerCase() ||
        row.performerNames.some((name) =>
          show.attractionNames.some((artist) => artist.toLowerCase() === name.toLowerCase())
        )
    )
    .slice(0, 4);

  const ticketHref = buildTicketHref(show);
  const fitNotes = [
    show.venueName ? `Best when ${show.venueName} is part of the appeal, not just the ticket.` : "Best when the venue itself helps make the night feel like Vegas.",
    "Good for one committed night out instead of endlessly comparing every listing on the trip.",
    "Skip it if you want the cheapest possible seat first and the show itself matters less than price.",
  ] as const;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">{show.venueName || "Las Vegas show"}</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">{show.name}</h1>
        <p className="lead">
          A focused Vegas show page for travelers who want the important details first instead of
          bouncing through generic ticket listings.
        </p>
        <div style={{ height: 16 }} />
        <div className="cta-row">
          {ticketHref ? (
            <Link href={ticketHref} className="button button-primary">
              View tickets
            </Link>
          ) : null}
          <Link href="/shows" className="button button-secondary">
            Back to all shows
          </Link>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          {show.imageUrl ? (
            <>
              <div className="inline-media-frame">
                <Image
                  src={show.imageUrl}
                  alt={show.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
              <div style={{ height: 12 }} />
            </>
          ) : null}
          <div className="eyebrow">What to know</div>
          <p>
            {show.localDate || "Date TBA"}
            {show.localTime ? ` • ${show.localTime}` : ""}
            {show.venueName ? ` • ${show.venueName}` : ""}
          </p>
          <p>
            {show.summary || `${show.name} is one of the current Vegas shows worth checking if it matches your kind of night.`}
          </p>
          <p>
            <strong>Style:</strong> {show.genre || "Live entertainment"}
            {show.attractionNames.length ? ` • ${show.attractionNames.join(", ")}` : ""}
          </p>
        </article>

        <article className="card">
          <div className="eyebrow">Best fit</div>
          <h2>Good for a clear Vegas night plan</h2>
          <ul className="list">
            {fitNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel panel-tight quick-start-panel">
        <div className="eyebrow">Next move</div>
        <h2>Book this, or use it to narrow the night.</h2>
        <div className="quick-start-grid">
          {ticketHref ? (
            <Link href={ticketHref} className="quick-start-card">
              <div className="eyebrow">Book this show</div>
              <h3>Go straight to tickets</h3>
              <p>Use this when the show already fits and you do not need more Vegas theory first.</p>
              <span className="quick-start-cta">View tickets</span>
            </Link>
          ) : null}
          <Link href="/shows/sphere" className="quick-start-card">
            <div className="eyebrow">Compare up</div>
            <h3>Check Sphere first</h3>
            <p>Use this if you still want to compare this against the strongest premium Vegas night.</p>
            <span className="quick-start-cta">Open Sphere</span>
          </Link>
          <Link href="/shows?q=comedy" className="quick-start-card">
            <div className="eyebrow">Compare down</div>
            <h3>See easier ticket wins</h3>
            <p>Use this when the goal is a simpler, cheaper, or more flexible Vegas night.</p>
            <span className="quick-start-cta">Browse easier wins</span>
          </Link>
        </div>
      </section>

      {relatedSeatGeek.length ? (
        <section className="panel">
          <div className="eyebrow">More ticket options</div>
          <div style={{ height: 10 }} />
          <h2>Related marketplace listings</h2>
          <div className="grid">
            {relatedSeatGeek.map((row) => (
              <article className="card" key={row.id}>
                <div className="eyebrow">{row.venueName || "Las Vegas"}</div>
                <h2 style={{ marginTop: 10 }}>{row.title}</h2>
                <p>
                  {row.localDate || "Date TBA"}
                  {row.localTime ? ` • ${row.localTime}` : ""}
                </p>
                {row.url ? (
                  <Link
                    href={`/api/tickets/out?target=${encodeURIComponent(row.url)}&affiliateTarget=seatgeek&sourcePath=/shows/${slug}&sourceSlug=saveonthestrip-show-detail&sourcePage=/shows/${slug}&topicSlug=vegas-shows&eventId=${encodeURIComponent(row.id)}&eventName=${encodeURIComponent(row.title)}${row.localDate ? `&eventDate=${encodeURIComponent(row.localDate)}` : ""}`}
                    className="button button-secondary"
                  >
                    View marketplace tickets
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <HelpRequestForm sourcePath={`/shows/${slug}`} />
    </main>
  );
}
