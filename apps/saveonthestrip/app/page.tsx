import type { Metadata } from "next";
import Link from "next/link";
import { getDccImageSet } from "@/lib/dccMedia";
import { getVegasTours, groupVegasToursByArea } from "@/lib/fareharbor";
import { getVegasShows, type VegasShow } from "@/lib/ticketmaster";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";
import { getVegasWhatsLiveFeed, type Next48BucketKey } from "@/lib/whatsLive";

function pickFirstWithImage<T extends { imageUrl: string | null }>(items: T[]) {
  return items.find((item) => item.imageUrl) || items[0] || null;
}

function getLiveItemImage(
  title: string,
  photos: Awaited<ReturnType<typeof getVegasPhotoLibrary>>,
) {
  const lower = title.toLowerCase();

  if (lower.includes("bellagio")) {
    return photos.bellagio;
  }

  if (lower.includes("fremont")) {
    return photos.fremont;
  }

  if (lower.includes("sphere")) {
    return photos.sphere;
  }

  if (lower.includes("grand canyon")) {
    return photos.grandCanyon;
  }

  return null;
}

function FillMediaImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className="media-image"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
}

export const metadata: Metadata = {
  title: "Save On The Strip | Vegas Shows, Tours, Deals, and Hotel Moves",
  description:
    "Decision-first Vegas planning for shows, tours, free wins, hotel moves, and Strip logistics.",
  alternates: { canonical: "https://saveonthestrip.com/" },
  openGraph: {
    title: "Save On The Strip | Vegas Shows, Tours, Deals, and Hotel Moves",
    description:
      "Use Save On The Strip to choose a better Vegas night, a worthwhile day trip, and the right low-friction backup plan.",
    url: "https://saveonthestrip.com/",
    type: "website",
  },
};

export default async function HomePage() {
  const [tourFeed, shows, hotelImageSet, whatsLive, photos] = await Promise.all([
    getVegasTours().catch(() => ({ tours: [], companies: [], configured: false })),
    getVegasShows().catch(() => []),
    getDccImageSet("hotel", "bellagio", {
      hero: {
        src: "/SOTS_HEADER_ENHANCED.jpg",
        alt: "Las Vegas hotel at night",
        source: "local",
      },
      card: {
        src: "/SOTS_HEADER_ENHANCED.jpg",
        alt: "Las Vegas hotel at night",
        source: "local",
      },
      gallery: [],
    }),
    getVegasWhatsLiveFeed().catch(() => null),
    getVegasPhotoLibrary(),
  ]);

  const groupedTours = groupVegasToursByArea(tourFeed.tours);
  const heroTour = pickFirstWithImage([
    ...groupedTours.grandCanyon,
    ...groupedTours.hooverDam,
    ...groupedTours.redRock,
    ...groupedTours.lasVegas,
  ]);
  const heroShow =
    shows.find((show: VegasShow) => {
      const haystack = [show.name, show.venueName, ...show.attractionNames].join(" ").toLowerCase();
      return haystack.includes("sphere") || haystack.includes("wizard of oz");
    }) || pickFirstWithImage(shows);
  const rawFeaturedHotelImage = hotelImageSet?.hero || hotelImageSet?.card || null;
  const featuredHotelImage =
    rawFeaturedHotelImage && !rawFeaturedHotelImage.src.endsWith(".svg")
      ? rawFeaturedHotelImage
      : photos.luxuryHotel;
  const liveItems = whatsLive
    ? (["now", "tonight", "tomorrow", "later-48h"] as Next48BucketKey[])
        .flatMap((bucket) => whatsLive.feed.buckets[bucket] || [])
        .slice(0, 4)
    : [];
  const heroVisual = photos.bellagio.src;
  const heroVisualAlt = photos.bellagio.alt;
  const featuredLanes = [
    {
      title: "Shows",
      copy: "Sphere, residencies, comedy, and one strong night out.",
      href: "/shows",
      cta: "Browse shows",
      image: heroShow?.imageUrl || photos.sphere.src,
      alt: heroShow?.name || photos.sphere.alt,
      tone: "lane-card-pink",
    },
    {
      title: "Deals",
      copy: "Ticket pickup, value combos, and faster Vegas savings.",
      href: "/deals",
      cta: "Open deals",
      image: photos.fremont.src,
      alt: photos.fremont.alt,
      tone: "lane-card-gold",
    },
    {
      title: "Tours",
      copy: "One big outing worth leaving the Strip for.",
      href: "/tours",
      cta: "Browse tours",
      image: heroTour?.imageUrl || photos.grandCanyon.src,
      alt: heroTour?.name || photos.grandCanyon.alt,
      tone: "lane-card-blue",
    },
    {
      title: "Free Wins",
      copy: "Bellagio, Fremont, and zero-cost Vegas resets.",
      href: "/free-things",
      cta: "See free wins",
      image: photos.bellagio.src,
      alt: photos.bellagio.alt,
      tone: "lane-card-green",
    },
  ] as const;
  const heroStats = [
    { label: "Shows tracked", value: String(shows.length || 0) },
    { label: "Tours found", value: String(tourFeed.tours.length || 0) },
    { label: "Live picks", value: String(liveItems.length || 0) },
  ] as const;
  const quickStartLanes = [
    {
      title: "Pick tonight",
      copy: "Use this first if the main question is what to do after dinner and you only want one strong Vegas night.",
      href: "/shows",
      cta: "Start with shows",
    },
    {
      title: "Leave the Strip once",
      copy: "Use this when the trip needs one real outing instead of more casino wandering.",
      href: "/tours",
      cta: "Browse tours",
    },
    {
      title: "Save money without killing the trip",
      copy: "Use this for Bellagio, Fremont, and no-cost resets between bigger spends.",
      href: "/free-things",
      cta: "Open free wins",
    },
  ] as const;

  const valueProps = [
    {
      title: "Move fast",
      copy: "Lock one strong night, one strong deal, and one strong daytime plan without wasting the trip on indecision.",
    },
    {
      title: "Spend where it counts",
      copy: "Put money into the nights and outings that actually feel like Vegas, then trim the rest.",
    },
    {
      title: "Keep the trip easy",
      copy: "Use simpler picks when timing, budget, or energy matters more than chasing every option.",
    },
    {
      title: "Balance the splurges",
      copy: "Mix Sphere, Bellagio, Fremont, and one big outing so the trip feels full without feeling blown out.",
    },
  ] as const;

  return (
    <main>
      <section className="hero hero-home hero-home-bold">
        <div className="hero-home-visual">
          <FillMediaImage src={heroVisual} alt={heroVisualAlt} priority />
          <div className="hero-home-overlay" />
        </div>
        <div className="hero-home-content">
          <div className="eyebrow">Las Vegas</div>
          <h1>SAVE BIG ON THE LAS VEGAS STRIP</h1>
          <p className="lead hero-home-lead">
            Skip the overwhelm. Premium nights, best deals, free wins, and one big outing if you want it.
          </p>
          <div className="hero-primary-grid">
            <Link href="/shows" className="hero-primary-card hero-primary-pink">
              <span>Find tonight&apos;s shows</span>
            </Link>
            <Link href="/deals" className="hero-primary-card hero-primary-gold">
              <span>Best deals now</span>
            </Link>
            <Link href="/tours" className="hero-primary-card hero-primary-blue">
              <span>Epic tours</span>
            </Link>
            <Link href="/free-things" className="hero-primary-card hero-primary-green">
              <span>Free Vegas wins</span>
            </Link>
          </div>
          <div className="hero-stat-row">
            {heroStats.map((item) => (
              <div key={item.label} className="hero-stat-chip">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel panel-tight quick-start-panel">
        <div className="eyebrow">Use the site right</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">Make one good Vegas decision first.</h2>
        <p className="lead quick-start-lead">
          Save On The Strip works best when you solve one part of the trip at a time: tonight, one big outing, or the cheapest useful reset.
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

      <section className="panel panel-tight">
        <div className="eyebrow">Start here</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">Big Vegas subjects. Faster decisions.</h2>
        <div style={{ height: 18 }} />
        <div className="featured-lane-grid">
          {featuredLanes.map((lane) => (
            <Link href={lane.href} className={`featured-lane-card ${lane.tone}`} key={lane.title}>
              <div className="featured-lane-media">
                <FillMediaImage src={lane.image} alt={lane.alt} />
                <div className="featured-lane-overlay" />
              </div>
              <div className="featured-lane-copy">
                <div className="eyebrow">{lane.title}</div>
                <h3>{lane.title}</h3>
                <p>{lane.copy}</p>
                <span className="featured-lane-cta">{lane.cta}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">What&apos;s live in Vegas</div>
        <div style={{ height: 10 }} />
        <h2>What looks worth doing in the next 48 hours</h2>
        <div style={{ height: 18 }} />
        {liveItems.length ? (
          <div className="grid">
            {liveItems.map((item) => {
              const liveItemImage = getLiveItemImage(item.title, photos);

              return (
                <article className="card whats-live-card" key={item.id}>
                  {liveItemImage ? (
                    <div className="inline-media-frame category-card-image">
                      <FillMediaImage
                        src={liveItemImage.src}
                        alt={liveItemImage.alt}
                      />
                    </div>
                  ) : null}
                  <div className="eyebrow">{item.category}</div>
                  <h2>{item.title}</h2>
                  <p>
                    {new Date(item.startAt).toLocaleString("en-US", {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    • {item.venueOrArea}
                  </p>
                  <p>{item.whyItMatters}</p>
                  <Link href={item.authorityCta.href} className="button button-secondary">
                    {item.authorityCta.label}
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="lead">Vegas live picks are refreshing right now.</p>
        )}
      </section>

      <section className="panel panel-tight">
        <div className="eyebrow">Keep the trip sharp</div>
        <div style={{ height: 10 }} />
        <div className="value-prop-grid">
          {valueProps.map((item) => (
            <article className="value-prop-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split">
        <div className="panel panel-tight">
          <div className="eyebrow">More Vegas essentials</div>
          <div style={{ height: 10 }} />
          <h2>Keep the stay clean and the extras optional.</h2>
          <div style={{ height: 18 }} />
          <div className="grid">
            <Link href="/hotels" className="card category-card">
              {featuredHotelImage ? (
                <div className="inline-media-frame category-card-image">
                  <FillMediaImage src={featuredHotelImage.src} alt={featuredHotelImage.alt} />
                </div>
              ) : null}
              <div className="eyebrow">Hotels</div>
              <h2>Renovations and reopenings</h2>
              <p>Check what changed before you lock the room.</p>
            </Link>
            <Link href="/timeshares" className="card category-card">
              <div className="inline-media-frame category-card-image">
                <FillMediaImage
                  src={photos.vegasNight.src}
                  alt={photos.vegasNight.alt}
                />
              </div>
              <div className="eyebrow">Optional help</div>
              <h2>Timeshares and side-by-side context</h2>
              <p>Only use this if the offer actually improves the stay.</p>
            </Link>
          </div>
        </div>

        <div className="panel panel-tight">
          <div className="eyebrow">Build the trip</div>
          <div style={{ height: 10 }} />
          <ul className="list">
            <li>One premium night instead of endless show browsing.</li>
            <li>One big outing instead of overplanning the whole trip.</li>
            <li>Saving money without turning the trip into a coupon hunt.</li>
            <li>Balancing premium Vegas with zero-cost resets.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
