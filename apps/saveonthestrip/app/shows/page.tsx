import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getVegasShowSlug } from "@/lib/content";
import { getDccImageSet } from "@/lib/dccMedia";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";
import { getSeatGeekVegasEvents } from "@/lib/seatgeek";
import { getVegasShowFilterOptions, getVegasShows } from "@/lib/ticketmaster";

export const metadata: Metadata = {
  title: "Vegas Shows | Save On The Strip",
  description:
    "Browse live Vegas shows, Sphere nights, residencies, comedy, and easier same-night picks with direct ticket routes.",
  alternates: { canonical: "https://saveonthestrip.com/shows" },
  openGraph: {
    title: "Vegas Shows | Save On The Strip",
    description:
      "Use Save On The Strip to sort Sphere, residencies, comedy, and classic Vegas production nights faster.",
    url: "https://saveonthestrip.com/shows",
    type: "website",
  },
};

const VEGAS_SHOW_LANES = [
  {
    eyebrow: "Premium night",
    title: "Sphere immersive experiences",
    description: "Start here when the night should feel like a marquee Vegas event, not just another ticket purchase.",
    href: "/shows/sphere",
  },
  {
    eyebrow: "Classic Vegas",
    title: "Cirque-style spectacle and residency nights",
    description: "Use this lane for big-production rooms, Strip polish, and the shows people dress up for.",
    href: "/shows?q=cirque",
  },
  {
    eyebrow: "Headliner lane",
    title: "Residencies and major concert names",
    description: "Best when the trip already revolves around one artist, one venue, or one signature night out.",
    href: "/shows?q=residency",
  },
  {
    eyebrow: "Easy win",
    title: "Magic, comedy, and lower-friction tickets",
    description: "Good for same-night plans, easier budgets, and travelers who want a simpler Vegas answer.",
    href: "/shows?q=comedy",
  },
] as const;

function buildTicketHref(show: Awaited<ReturnType<typeof getVegasShows>>[number]) {
  if (!show.url) return null;

  const url = new URL("/api/tickets/out", "https://saveonthestrip.com");
  url.searchParams.set("target", show.url);
  url.searchParams.set("affiliateTarget", "ticketmaster");
  url.searchParams.set("sourcePath", "/shows");
  url.searchParams.set("sourceSlug", "saveonthestrip-shows");
  url.searchParams.set("sourcePage", "/shows");
  url.searchParams.set("topicSlug", "vegas-shows");
  url.searchParams.set("eventId", show.id);
  url.searchParams.set("eventName", show.name);
  if (show.localDate) url.searchParams.set("eventDate", show.localDate);
  return url.pathname + url.search;
}

type ShowsPageProps = {
  searchParams?: Promise<{
    genre?: string;
    venue?: string;
    q?: string;
  }>;
};

function firstValue(value?: string) {
  return value?.trim() ? value.trim() : "";
}

function clearHref(params: Record<string, string>, key: string) {
  const next = new URLSearchParams(params);
  next.delete(key);
  const query = next.toString();
  return query ? `/shows?${query}` : "/shows";
}

function containsText(values: Array<string | null | undefined>, needle: string) {
  const normalized = needle.toLowerCase();
  return values.some((value) => (value || "").toLowerCase().includes(normalized));
}

function findFeaturedShow(shows: Awaited<ReturnType<typeof getVegasShows>>, matcher: (show: Awaited<ReturnType<typeof getVegasShows>>[number]) => boolean) {
  return shows.find(matcher) || null;
}

function buildSearchHref(q: string) {
  const url = new URL("/shows", "https://saveonthestrip.com");
  url.searchParams.set("q", q);
  return url.pathname + url.search;
}

export default async function ShowsPage({ searchParams }: ShowsPageProps) {
  const resolved = (await searchParams) || {};
  const filters = {
    genre: firstValue(resolved.genre),
    venue: firstValue(resolved.venue),
    q: firstValue(resolved.q),
  };

  const photos = await getVegasPhotoLibrary();
  const [shows, options, seatGeekShows, vegasImageSet] = await Promise.all([
    getVegasShows(filters).catch(() => []),
    getVegasShowFilterOptions().catch(() => ({ genres: [], venues: [], totalShows: 0 })),
    getSeatGeekVegasEvents().catch(() => []),
    getDccImageSet("city", "las-vegas", {
      hero: {
        src: photos.vegasNight.src,
        alt: photos.vegasNight.alt,
        source: "local",
      },
      card: {
        src: photos.vegasNight.src,
        alt: photos.vegasNight.alt,
        source: "local",
      },
      gallery: [],
    }),
  ]);
  const activeParams = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  ) as Record<string, string>;
  const allLiveShows = await getVegasShows().catch(() => []);
  const sphereFeature = findFeaturedShow(
    allLiveShows,
    (show) =>
      containsText([show.name, show.summary, ...show.attractionNames], "wizard of oz")
      || containsText([show.venueName], "sphere")
  );
  const stratFeature = seatGeekShows.find(
    (show) =>
      containsText([show.title, show.shortTitle, ...show.performerNames], "comedy")
      && containsText([show.venueName], "strat")
  ) || null;
  const heroImage = vegasImageSet?.hero || vegasImageSet?.card || null;
  const heroStatusValue = shows.length > 0 ? String(shows.length) : String(VEGAS_SHOW_LANES.length);
  const quickStartLanes = [
    {
      title: "Go premium",
      copy: "Start with Sphere when the trip needs one expensive, obvious, headline Vegas night.",
      href: "/shows/sphere",
      cta: "Open Sphere",
    },
    {
      title: "Dress up for one night",
      copy: "Use residencies and big-room spectacle when the whole stay bends around one dinner-and-show plan.",
      href: buildSearchHref("residency"),
      cta: "Find residency nights",
    },
    {
      title: "Keep it easy",
      copy: "Use comedy or magic when budget, timing, or same-night flexibility matters more than prestige.",
      href: buildSearchHref("comedy"),
      cta: "See easier wins",
    },
  ] as const;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="hero hero-home">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Vegas shows hub</div>
            <div style={{ height: 10 }} />
            <h1>Pick a Las Vegas show worth dressing up for</h1>
            <p className="lead">
              Start with the strongest Vegas lanes first: Sphere when you want the premium answer,
              big residencies when the whole trip bends around one night, and comedy or magic when
              you want the easiest live-ticket win.
            </p>
            <div style={{ height: 18 }} />
            <div className="cta-row">
              <Link href="/shows/sphere" className="button button-primary">
                Start with Sphere
              </Link>
              <Link href={buildSearchHref("residency")} className="button button-secondary">
                Find residency nights
              </Link>
            </div>
            <div style={{ height: 14 }} />
            <div className="filter-pills">
              <div className="pill">Sphere</div>
              <div className="pill">Cirque</div>
              <div className="pill">Residencies</div>
              <div className="pill">Comedy</div>
              <div className="pill">Magic</div>
              <div className="pill">Vegas night out</div>
            </div>
          </div>

          <aside className="hero-status">
            <div className="eyebrow">Tonight's shape</div>
            <div className="status-value">{heroStatusValue}</div>
            <p>
              {options.totalShows
                ? `${options.totalShows} live Vegas events are in the feed. Start with the kind of night you want, then narrow to the right ticket.`
                : "Start with the kind of night you want, then narrow to the cleanest live option."}
            </p>
            <div className="status-grid">
              <div className="status-chip">
                <strong>Premium answer</strong>
                <span>Sphere is still the cleanest top-of-page answer when someone wants one major night out.</span>
              </div>
              <div className="status-chip">
                <strong>Classic Vegas</strong>
                <span>Residencies and big-room spectacle work best when the trip needs a real event feel.</span>
              </div>
              <div className="status-chip">
                <strong>Easy fallback</strong>
                <span>Comedy and magic usually win when budget, timing, or same-night availability matters more.</span>
              </div>
            </div>
          </aside>
        </div>

        {heroImage ? (
          <>
            <div style={{ height: 18 }} />
            <div className="media-frame hero-header-frame">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                priority
                sizes="100vw"
                className="media-image"
              />
            </div>
          </>
        ) : null}
      </section>

      <section className="panel panel-tight quick-start-panel">
        <div className="eyebrow">Use this page right</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">Choose the kind of Vegas night first.</h2>
        <p className="lead quick-start-lead">
          The fastest way through Vegas show pages is not more scrolling. Decide whether the night should feel premium, classic, or easy, then narrow tickets inside that lane.
        </p>
        <div className="quick-start-grid">
          {quickStartLanes.map((lane) => (
            <Link href={lane.href} key={lane.title} className="quick-start-card">
              <div className="eyebrow">{lane.title}</div>
              <h3>{lane.title}</h3>
              <p>{lane.copy}</p>
              <span className="quick-start-cta">{lane.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid">
        {VEGAS_SHOW_LANES.map((lane) => (
          <article className="card category-card" key={lane.title}>
            <div className="media-frame category-card-image">
              <Image
                src={
                  lane.title.includes("Sphere")
                    ? photos.sphere.src
                    : lane.title.includes("Cirque")
                      ? photos.bellagio.src
                      : lane.title.includes("Residencies")
                        ? photos.vegasNight.src
                        : photos.fremont.src
                }
                alt={
                  lane.title.includes("Sphere")
                    ? photos.sphere.alt
                    : lane.title.includes("Cirque")
                      ? photos.bellagio.alt
                      : lane.title.includes("Residencies")
                        ? photos.vegasNight.alt
                        : photos.fremont.alt
                }
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                className="media-image"
              />
            </div>
            <div className="eyebrow">{lane.eyebrow}</div>
            <h2>{lane.title}</h2>
            <p>{lane.description}</p>
            <Link href={lane.href} className="button button-secondary">
              Open this lane
            </Link>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="eyebrow">Top Las Vegas Shows Right Now</div>
        <div style={{ height: 10 }} />
        <h2>Start with the strongest Vegas answers.</h2>
        <p>
          Go straight to Sphere, a real residency night, or an easier comedy-value fallback before
          you wade into the full ticket wall.
        </p>
      </section>

      <section className="panel panel-tight quick-start-panel">
        <div className="eyebrow">Use this page right</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">Choose the kind of Vegas night first.</h2>
        <p className="lead quick-start-lead">
          The fastest way through Vegas show pages is not more scrolling. Decide whether the night should feel premium, classic, or easy, then narrow tickets inside that lane.
        </p>
        <div className="quick-start-grid">
          {quickStartLanes.map((lane) => (
            <Link href={lane.href} key={lane.title} className="quick-start-card">
              <div className="eyebrow">{lane.title}</div>
              <h3>{lane.title}</h3>
              <p>{lane.copy}</p>
              <span className="quick-start-cta">{lane.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid">
        <article className="card feature-card">
          <div className="eyebrow">Featured now</div>
          <h2>Wizard of Oz at Sphere</h2>
          {sphereFeature?.imageUrl ? (
            <>
              <div style={{ height: 12 }} />
              <div className="inline-media-frame">
                <Image
                  src={sphereFeature.imageUrl}
                  alt={sphereFeature.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
            </>
          ) : null}
          <p>
            Sphere is one of the clearest premium Vegas show decisions right now, and
            <em> The Wizard of Oz at Sphere</em> deserves a dedicated featured spot instead of being
            buried in a generic event list.
          </p>
          <p>
            Focus the pitch on the immersive-format difference, not just “tickets available.”
            This is the kind of show people plan around.
          </p>
          <div style={{ height: 12 }} />
          <Link
            href="/shows/sphere"
            className="button button-primary"
          >
            Find Sphere dates
          </Link>
        </article>

        <article className="card feature-card">
          <div className="eyebrow">Featured deal lane</div>
          <h2>STRAT comedy and pickup-only offers</h2>
          {stratFeature?.imageUrl ? (
            <>
              <div style={{ height: 12 }} />
              <div className="inline-media-frame">
                <Image
                  src={stratFeature.imageUrl}
                  alt={stratFeature.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
            </>
          ) : null}
          <p>
            STRAT works well as a value pick for comedy, easier night plans, and specials that
            feel more local than the biggest headliner nights.
          </p>
          <p>
            This is the better lane when you want a cheaper night, faster availability, or a live
            option that does not need the full residency-level budget.
          </p>
          <div style={{ height: 12 }} />
          <Link
            href={stratFeature?.url ? `/api/tickets/out?target=${encodeURIComponent(stratFeature.url)}&affiliateTarget=seatgeek&sourcePath=/shows&sourceSlug=saveonthestrip-shows&sourcePage=/shows&topicSlug=vegas-shows&eventId=${encodeURIComponent(stratFeature.id)}&eventName=${encodeURIComponent(stratFeature.title)}${stratFeature.localDate ? `&eventDate=${encodeURIComponent(stratFeature.localDate)}` : ""}` : buildSearchHref("strat comedy")}
            className="button button-secondary"
          >
            {stratFeature ? "View STRAT comedy" : "Search STRAT comedy"}
          </Link>
        </article>
      </section>

      <section className="panel">
        <div className="eyebrow">Ticketmaster listings</div>
        <div style={{ height: 10 }} />
        <h2>Upcoming Vegas shows</h2>
        <p>
          Browse current Ticketmaster listings for Las Vegas, sorted by date and focused on the
          kinds of events most people are actually comparing for a Vegas night out.
        </p>
        <div style={{ height: 18 }} />
        <form className="filters" action="/shows">
          <label className="field">
            <span>Search</span>
            <input
              type="search"
              name="q"
              placeholder="Artist, venue, comedy, magic..."
              defaultValue={filters.q}
            />
          </label>
          <label className="field">
            <span>Genre</span>
            <select name="genre" defaultValue={filters.genre}>
              <option value="">All genres</option>
              {options.genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Venue</span>
            <select name="venue" defaultValue={filters.venue}>
              <option value="">All venues</option>
              {options.venues.slice(0, 80).map((venue) => (
                <option key={venue} value={venue}>
                  {venue}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button button-primary">
            Filter shows
          </button>
        </form>
        {Object.keys(activeParams).length ? (
          <>
            <div style={{ height: 12 }} />
            <div className="filter-pills">
              {filters.q ? (
                <Link href={clearHref(activeParams, "q")} className="pill">
                  Search: {filters.q} ×
                </Link>
              ) : null}
              {filters.genre ? (
                <Link href={clearHref(activeParams, "genre")} className="pill">
                  Genre: {filters.genre} ×
                </Link>
              ) : null}
              {filters.venue ? (
                <Link href={clearHref(activeParams, "venue")} className="pill">
                  Venue: {filters.venue} ×
                </Link>
              ) : null}
              <Link href="/shows" className="pill">
                Clear all
              </Link>
            </div>
          </>
        ) : null}
        <div style={{ height: 18 }} />
        <p>
          Showing {shows.length} of {options.totalShows} live Ticketmaster events in Las Vegas.
        </p>
        <div style={{ height: 12 }} />
        <div className="grid">
          {shows.map((show) => {
            const ticketHref = buildTicketHref(show);
            return (
              <article className="card" key={show.id}>
                <div className="eyebrow">{show.segment || "Show"}</div>
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
                  {(show.localDate || "Date TBA")}
                  {show.localTime ? ` • ${show.localTime}` : ""}
                  {show.venueName ? ` • ${show.venueName}` : ""}
                </p>
                <p>
                  {show.attractionNames.length ? show.attractionNames.join(", ") : show.genre || "Vegas live entertainment"}
                </p>
                {show.minPrice || show.maxPrice ? (
                  <p>
                    {show.currency || "USD"} {show.minPrice ?? "?"}
                    {show.maxPrice ? ` - ${show.maxPrice}` : ""}
                  </p>
                ) : null}
                {show.summary ? <p>{show.summary}</p> : null}
                <div style={{ height: 12 }} />
                <div className="detail-actions">
                  <Link href={`/shows/${getVegasShowSlug(show)}`} className="button button-secondary">
                    More information
                  </Link>
                  {ticketHref ? (
                    <Link href={ticketHref} className="button button-primary">
                      View tickets
                    </Link>
                  ) : (
                    <div className="pill">No ticket URL</div>
                  )}
                </div>
              </article>
            );
          })}
          {!shows.length ? (
            <article className="card">
              <div className="eyebrow">{options.totalShows ? "No matches" : "Shows not available right now"}</div>
              <h2>{options.totalShows ? "Adjust your filters" : "Check back soon"}</h2>
              <p>
                {options.totalShows
                  ? "No current Vegas events matched this search. Try a broader genre, venue, or keyword."
                  : "The show list is not available at the moment. Try again later."}
              </p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">More ticket options</div>
        <div style={{ height: 10 }} />
        <h2>SeatGeek Vegas events</h2>
        <p>
          Use this section when you want to compare more ticket options beyond the main official
          listings.
        </p>
        <div style={{ height: 18 }} />
        <div className="grid">
          {seatGeekShows.slice(0, 24).map((show) => {
            const url = new URL("/api/tickets/out", "https://saveonthestrip.com");
            if (show.url) url.searchParams.set("target", show.url);
            url.searchParams.set("affiliateTarget", "seatgeek");
            url.searchParams.set("sourcePath", "/shows");
            url.searchParams.set("sourceSlug", "saveonthestrip-shows");
            url.searchParams.set("sourcePage", "/shows");
            url.searchParams.set("topicSlug", "vegas-shows");
            url.searchParams.set("eventId", show.id);
            url.searchParams.set("eventName", show.title);
            if (show.localDate) url.searchParams.set("eventDate", show.localDate);

            return (
              <article className="card" key={show.id}>
                <div className="eyebrow">SeatGeek</div>
                {show.imageUrl ? (
                  <>
                    <div style={{ height: 12 }} />
                    <div className="inline-media-frame">
                      <Image
                        src={show.imageUrl}
                        alt={show.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 50vw"
                        className="media-image"
                      />
                    </div>
                  </>
                ) : null}
                <h2 style={{ marginTop: 10 }}>{show.title}</h2>
                <p>
                  {(show.localDate || "Date TBA")}
                  {show.localTime ? ` • ${show.localTime}` : ""}
                  {show.venueName ? ` • ${show.venueName}` : ""}
                </p>
                <p>
                  {show.performerNames.length
                    ? show.performerNames.join(", ")
                    : show.genre || "Vegas live entertainment"}
                </p>
                {show.lowestPrice || show.highestPrice ? (
                  <p>
                    USD {show.lowestPrice ?? "?"}
                    {show.highestPrice ? ` - ${show.highestPrice}` : ""}
                  </p>
                ) : null}
                <div style={{ height: 12 }} />
                <div className="detail-actions">
                  <Link href="/deals" className="button button-secondary">
                    Ask about deals
                  </Link>
                  {show.url ? (
                    <Link href={url.pathname + url.search} className="button button-secondary">
                      View marketplace tickets
                    </Link>
                  ) : (
                    <div className="pill">No marketplace URL</div>
                  )}
                </div>
              </article>
            );
          })}
          {!seatGeekShows.length ? (
            <article className="card">
              <div className="eyebrow">More listings not available right now</div>
              <h2>Check back soon</h2>
              <p>
                Additional marketplace listings are not available at the moment. Try again later.
              </p>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
