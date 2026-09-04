import type { Metadata } from "next";
import Link from "next/link";
import { getVegasTours } from "@/lib/fareharbor";
import { getVegasShows } from "@/lib/ticketmaster";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";
import { getVegasWhatsLiveFeed, type Next48BucketKey } from "@/lib/whatsLive";

export const metadata: Metadata = {
  title: "Save On The Strip | What Is Actually Worth It in Las Vegas",
  description:
    "Do not waste money in Vegas. Find what is worth doing tonight, which shows and tours deserve the spend, and where the free wins are.",
  alternates: { canonical: "https://saveonthestrip.com/" },
};

function Media({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="media-image"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

export default async function HomePage() {
  const [tourFeed, shows, whatsLive, photos] = await Promise.all([
    getVegasTours().catch(() => ({ tours: [], companies: [], configured: false })),
    getVegasShows().catch(() => []),
    getVegasWhatsLiveFeed().catch(() => null),
    getVegasPhotoLibrary(),
  ]);

  const liveItems = whatsLive
    ? (["now", "tonight", "tomorrow", "later-48h"] as Next48BucketKey[])
        .flatMap((bucket) => whatsLive.feed.buckets[bucket] || [])
        .slice(0, 6)
    : [];

  const heroStats = [
    { count: shows.length, label: "shows tracked" },
    { count: tourFeed.tours.length, label: "tours found" },
    { count: liveItems.length, label: "current planning picks" },
  ].filter((item) => item.count > 0);

  const decisionLanes = [
    {
      label: "Tonight",
      title: "I need a plan for tonight.",
      copy: "Skip the giant list. Start with what is happening soon and choose one strong night.",
      href: "/tonight",
      image: photos.sphere,
    },
    {
      label: "Worth it?",
      title: "Tell me what deserves the money.",
      copy: "Use the Vegas value filter before spending on a show, attraction, upgrade, or day trip.",
      href: "/worth-it",
      image: photos.bellagio,
    },
    {
      label: "Big outing",
      title: "Leave the Strip once.",
      copy: "Grand Canyon, Hoover Dam, Red Rock, or another outing that changes the whole trip.",
      href: "/tours",
      image: photos.grandCanyon,
    },
    {
      label: "Free",
      title: "Spend nothing for a few hours.",
      copy: "Use the free Vegas reset between the expensive parts of the trip.",
      href: "/free-things",
      image: photos.fremont,
    },
  ] as const;

  return (
    <main>
      <section className="hero hero-home hero-home-bold">
        <div className="hero-home-visual">
          <Media src={photos.vegasNight.src} alt={photos.vegasNight.alt} />
          <div className="hero-home-overlay" />
        </div>
        <div className="hero-home-content">
          <div className="eyebrow">Las Vegas money filter</div>
          <h1>DON&apos;T WASTE MONEY IN VEGAS.</h1>
          <p className="lead hero-home-lead">
            What is worth it tonight? What should you skip? Where should you splurge? Start there.
          </p>
          <div className="hero-primary-grid">
            <Link href="/tonight" className="hero-primary-card hero-primary-pink"><span>What should I do tonight?</span></Link>
            <Link href="/worth-it" className="hero-primary-card hero-primary-gold"><span>What is actually worth it?</span></Link>
            <Link href="/shows" className="hero-primary-card hero-primary-blue"><span>Find a show</span></Link>
            <Link href="/free-things" className="hero-primary-card hero-primary-green"><span>Find a free win</span></Link>
          </div>
          {heroStats.length ? (
            <div className="hero-stat-row">
              {heroStats.map((stat) => (
                <div className="hero-stat-chip" key={stat.label}>
                  <strong>{stat.count}</strong><span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel panel-tight">
        <div className="eyebrow">Pick your problem</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">Vegas is easier when you stop trying to plan all of Vegas.</h2>
        <p className="lead">Choose the decision you need to make next.</p>
        <div className="featured-lane-grid">
          {decisionLanes.map((lane) => (
            <Link href={lane.href} className="featured-lane-card" key={lane.title}>
              <div className="featured-lane-media">
                <Media src={lane.image.src} alt={lane.image.alt} />
                <div className="featured-lane-overlay" />
              </div>
              <div className="featured-lane-copy">
                <div className="eyebrow">{lane.label}</div>
                <h3>{lane.title}</h3>
                <p>{lane.copy}</p>
                <span className="featured-lane-cta">Open this lane</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">Next 48 hours</div>
        <div style={{ height: 10 }} />
        <h2>Vegas happening soon.</h2>
        <p className="lead">A short current board is more useful than a giant directory. Verify the exact date, availability, and terms with the provider before purchase.</p>
        <div style={{ height: 18 }} />
        {liveItems.length ? (
          <div className="grid">
            {liveItems.map((item) => (
              <article className="card whats-live-card" key={item.id}>
                <div className="eyebrow">{item.category}</div>
                <h2>{item.title}</h2>
                <p>
                  {new Date(item.startAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  {" • "}{item.venueOrArea}
                </p>
                <p>{item.whyItMatters}</p>
                <Link href={item.authorityCta.href} className="button button-secondary">{item.authorityCta.label}</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="card">
            <h2>No live feed right now.</h2>
            <p>Use shows, tours, and free things instead of pretending stale inventory is live.</p>
          </div>
        )}
      </section>

      <section className="panel panel-tight">
        <div className="eyebrow">The rule</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">Splurge once. Save twice. Skip the junk.</h2>
        <div className="value-prop-grid">
          <article className="value-prop-card"><strong>Splurge once</strong><p>Pick the one night or outing you would regret missing.</p></article>
          <article className="value-prop-card"><strong>Save twice</strong><p>Use free attractions and smarter timing around the expensive parts.</p></article>
          <article className="value-prop-card"><strong>Skip the junk</strong><p>Do not buy something just because Vegas put a flashing button in front of you.</p></article>
          <article className="value-prop-card"><strong>Keep moving</strong><p>One good decision now beats another hour of research.</p></article>
        </div>
      </section>

      <section className="split">
        <div className="panel panel-tight">
          <div className="eyebrow">Spend</div>
          <h2>Things worth comparing before you pay.</h2>
          <div className="footer-links">
            <Link href="/shows">Shows and residencies</Link>
            <Link href="/tours">Grand Canyon, Hoover Dam, Red Rock and Vegas tours</Link>
            <Link href="/hotels">Hotel moves and renovation reality</Link>
            <Link href="/deals">Current deal lanes</Link>
          </div>
        </div>
        <div className="panel panel-tight">
          <div className="eyebrow">Save</div>
          <h2>Things you do not need to overpay for.</h2>
          <div className="footer-links">
            <Link href="/free-things">Free Vegas</Link>
            <Link href="/tonight">A fast plan for tonight</Link>
            <Link href="/worth-it">The worth-it filter</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
