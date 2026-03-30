import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getVegasShows } from "@/lib/ticketmaster";

function containsText(values: Array<string | null | undefined>, needle: string) {
  const normalized = needle.toLowerCase();
  return values.some((value) => (value || "").toLowerCase().includes(normalized));
}

function buildTicketHref(show: Awaited<ReturnType<typeof getVegasShows>>[number]) {
  if (!show.url) return null;

  const url = new URL("/api/tickets/out", "https://saveonthestrip.com");
  url.searchParams.set("target", show.url);
  url.searchParams.set("affiliateTarget", "ticketmaster");
  url.searchParams.set("sourcePath", "/shows/sphere");
  url.searchParams.set("sourceSlug", "saveonthestrip-sphere");
  url.searchParams.set("sourcePage", "/shows/sphere");
  url.searchParams.set("topicSlug", "sphere-shows");
  url.searchParams.set("eventId", show.id);
  url.searchParams.set("eventName", show.name);
  if (show.localDate) url.searchParams.set("eventDate", show.localDate);
  return url.pathname + url.search;
}

export const metadata: Metadata = {
  title: "Sphere Shows in Las Vegas | Save On The Strip",
  description:
    "See current Sphere shows in Las Vegas, including Wizard of Oz at Sphere, with a simple schedule and ticket links.",
  alternates: {
    canonical: "https://saveonthestrip.com/shows/sphere",
  },
};

export default async function SphereShowsPage() {
  const allLiveShows = await getVegasShows().catch(() => []);
  const sphereShows = allLiveShows.filter((show) =>
    containsText([show.name, show.summary, show.venueName, ...show.attractionNames], "sphere")
    || containsText([show.name, show.summary, ...show.attractionNames], "wizard of oz")
  );

  const wizardFeature =
    sphereShows.find((show) =>
      containsText([show.name, show.summary, ...show.attractionNames], "wizard of oz")
    ) || sphereShows[0] || null;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">Sphere guide</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">Sphere shows in Las Vegas</h1>
        <p className="lead">
          If you want the big immersive Vegas night, start here. Sphere is where to look first for
          a premium show night that feels different from a normal theater ticket.
        </p>
        <div style={{ height: 16 }} />
        <div className="cta-row">
          <Link href="/shows" className="button button-secondary">
            Back to all shows
          </Link>
          <Link href="#sphere-schedule" className="button button-primary">
            See Sphere schedule
          </Link>
        </div>
      </section>

      {wizardFeature ? (
        <section className="grid">
          <article className="card feature-card">
            <div className="eyebrow">Featured show</div>
            <h2>Wizard of Oz at Sphere</h2>
            {wizardFeature.imageUrl ? (
              <>
                <div style={{ height: 12 }} />
                <div className="inline-media-frame">
                  <Image
                    src={wizardFeature.imageUrl}
                    alt={wizardFeature.name}
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="media-image"
                  />
                </div>
              </>
            ) : null}
            <p>
              Wizard of Oz is the clear featured pick here because it gives people a specific
              Sphere decision instead of making them dig through a generic event feed.
            </p>
            <p>
              This is the kind of Vegas show you build a night around when you want the room,
              visuals, and format to be the main event.
            </p>
            <div style={{ height: 12 }} />
            {buildTicketHref(wizardFeature) ? (
              <Link href={buildTicketHref(wizardFeature) || "#"} className="button button-primary">
                View Wizard of Oz tickets
              </Link>
            ) : null}
          </article>

          <article className="card feature-card">
            <div className="eyebrow">Why Sphere</div>
            <h2>Best for a premium Vegas night</h2>
            <p>
              Sphere is not just another ticket on the Strip. It is the right lane when someone
              wants one major show night and is willing to pay for the room, the scale, and the
              experience.
            </p>
            <ul className="list">
              <li>Best for travelers who want one big signature night.</li>
              <li>Good fit for shorter Vegas trips where you want one clear headliner plan.</li>
              <li>Stronger premium pick than a generic browse-all-shows approach.</li>
            </ul>
          </article>
        </section>
      ) : null}

      <section className="panel" id="sphere-schedule">
        <div className="eyebrow">Current schedule</div>
        <div style={{ height: 10 }} />
        <h2>Upcoming Sphere dates</h2>
        <p>
          Use this list to see the current Sphere schedule in one place. If Wizard of Oz is live,
          it should be the first thing you look at here.
        </p>
        <div style={{ height: 18 }} />
        <div className="grid">
          {sphereShows.map((show) => (
            <article className="card" key={show.id}>
              <div className="eyebrow">{show.venueName || "Sphere"}</div>
              {show.imageUrl ? (
                <>
                  <div style={{ height: 12 }} />
                  <div className="inline-media-frame">
                    <Image
                      src={show.imageUrl}
                      alt={show.name}
                      fill
                      sizes="(max-width: 900px) 100vw, 50vw"
                      className="media-image"
                    />
                  </div>
                </>
              ) : null}
              <h2 style={{ marginTop: 10 }}>{show.name}</h2>
              <p>
                {show.localDate || "Date TBA"}
                {show.localTime ? ` • ${show.localTime}` : ""}
              </p>
              {show.summary ? <p>{show.summary}</p> : null}
              <div style={{ height: 12 }} />
              {buildTicketHref(show) ? (
                <Link href={buildTicketHref(show) || "#"} className="button button-primary">
                  View tickets
                </Link>
              ) : null}
            </article>
          ))}
          {!sphereShows.length ? (
            <article className="card">
              <div className="eyebrow">No live Sphere list right now</div>
              <h2>Check back soon</h2>
              <p>
                Sphere listings are not available at the moment. Try again later or return to the
                main shows page.
              </p>
              <div style={{ height: 12 }} />
              <Link href="/shows" className="button button-secondary">
                Back to all shows
              </Link>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
