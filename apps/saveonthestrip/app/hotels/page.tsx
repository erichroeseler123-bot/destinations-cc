import type { Metadata } from "next";
import Link from "next/link";
import { getDccImageSet } from "@/lib/dccMedia";
import { getVegasHotelGuides } from "@/lib/hotels";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";

export const metadata: Metadata = {
  title: "Vegas Hotel Guides | Save On The Strip",
  description:
    "Practical Las Vegas hotel guides covering renovation updates, reopening timelines, value picks, and what travelers should know before booking.",
  alternates: {
    canonical: "https://saveonthestrip.com/hotels",
  },
  openGraph: {
    title: "Vegas Hotel Guides | Save On The Strip",
    description:
      "Use Vegas hotel guides for renovation updates, reopening reality, premium-versus-value decisions, and lower-friction booking picks.",
    url: "https://saveonthestrip.com/hotels",
    type: "website",
    images: [
      {
        url: "https://saveonthestrip.com/SOTS_HEADER_ENHANCED.jpg",
        alt: "Las Vegas at night",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vegas Hotel Guides | Save On The Strip",
    description:
      "Vegas hotel updates, renovation reality, value picks, and smarter booking lanes in one fast guide.",
    images: ["https://saveonthestrip.com/SOTS_HEADER_ENHANCED.jpg"],
  },
};

const HOTELS_PAGE_BUILD_TAG = "2026-03-20-cache-bust-1";

const GUIDE_ENTITY_MAP: Record<string, { entityType: string; slug: string; fallback: string; alt: string }> = {
  "rio-las-vegas-renovation-update": {
    entityType: "hotel",
    slug: "rio",
    fallback: "https://saveonthestrip.com/SOTS_HEADER_ENHANCED.jpg",
    alt: "Rio Las Vegas guide image",
  },
  "hard-rock-las-vegas-construction-update": {
    entityType: "hotel",
    slug: "hard-rock-las-vegas",
    fallback: "https://saveonthestrip.com/SOTS_HEADER_ENHANCED.jpg",
    alt: "Hard Rock Las Vegas guide image",
  },
};

export default async function HotelsPage() {
  void HOTELS_PAGE_BUILD_TAG;
  const guides = getVegasHotelGuides();
  const photos = await getVegasPhotoLibrary();
  const hotelLanes = [
    {
      eyebrow: "Premium stay",
      title: "Premium Strip stay lane",
      description: "Use this when the room is part of the night, not just a place to crash.",
      image: photos.luxuryHotel.src,
      imageAlt: photos.luxuryHotel.alt,
      bullets: ["Look for credits, not just lower rates", "Verify what is actually open before you splurge"],
    },
    {
      eyebrow: "Value first",
      title: "Value-first hotel lane",
      description: "Start here when total trip value matters more than Strip branding.",
      image: photos.hotelValue.src,
      imageAlt: photos.hotelValue.alt,
      bullets: ["Off-Strip can beat headline resorts on value", "Parking and total cost usually matter more than one flashy photo"],
    },
    {
      eyebrow: "Avoid surprises",
      title: "Renovation and reopening lane",
      description: "Use this when a hotel is in transition and you need the fast yes-or-no answer.",
      image: photos.vegasNight.src,
      imageAlt: photos.vegasNight.alt,
      bullets: ["Separate open now from future headlines", "Treat construction stories as planning risk"],
    },
    {
      eyebrow: "Lower friction",
      title: "Fee-conscious and easier-stay lane",
      description: "Use this when cleaner logistics matter more than maximum Strip prestige.",
      image: photos.resortPool.src,
      imageAlt: photos.resortPool.alt,
      bullets: ["Check fee relief and parking before booking", "Use official offer pages before OTAs"],
    },
  ] as const;
  const guideImages = await Promise.all(
    guides.map(async (guide) => {
      const config = GUIDE_ENTITY_MAP[guide.slug];
      if (!config) return [guide.slug, null] as const;

      const imageSet = await getDccImageSet(config.entityType, config.slug, {
        hero: { src: config.fallback, alt: config.alt, source: "local" },
        card: { src: config.fallback, alt: config.alt, source: "local" },
        gallery: [],
      });

      return [guide.slug, imageSet?.hero || imageSet?.card || null] as const;
    }),
  );
  const guideImageMap = new Map(guideImages);
  const heroGuide = guides.find((guide) => guideImageMap.get(guide.slug)) || guides[0] || null;
  const heroGuideImage = heroGuide ? guideImageMap.get(heroGuide.slug) : null;
  const featuredGuides = guides.filter((guide) => guideImageMap.get(guide.slug)).slice(0, 2);

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <div className="eyebrow">Vegas hotel guides</div>
            <div style={{ height: 10 }} />
            <h1 className="detail-title">Las Vegas hotel updates that are actually useful</h1>
            <p className="lead">
              Skip rumor loops. Start with the hotel lane that matches your trip, then use the live
              guide cards below for the properties people are actually asking about.
            </p>
            <div style={{ height: 18 }} />
            <div className="cta-row">
              <a href="#best-vegas-hotel-lanes-right-now" className="button button-primary">
                Start with hotel lanes
              </a>
              <a href="#featured-hotel-guides" className="button button-secondary">
                See live hotel guides
              </a>
              <Link href="/deals" className="button button-secondary">
                Pair with deals
              </Link>
              <Link href="/shows" className="button button-secondary">
                Pair with a show night
              </Link>
            </div>
            <div style={{ height: 14 }} />
            <div className="filter-pills">
              <div className="pill">Premium rooms</div>
              <div className="pill">Value stays</div>
              <div className="pill">Renovation watch</div>
              <div className="pill">Fee-conscious picks</div>
            </div>
          </div>

          {heroGuideImage ? (
            <article className="home-hero-stage">
              <div className="home-hero-visual media-frame hero-header-frame">
                <img
                  src={heroGuideImage.src}
                  alt={heroGuideImage.alt}
                  className="media-image"
                  loading="eager"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div className="hero-visual-overlay" />
                <div className="hero-visual-copy">
                  <div className="eyebrow">{heroGuide?.eyebrow || "Hotel update"}</div>
                  <h2>{heroGuide?.title || "Vegas hotel guide"}</h2>
                  <p>{heroGuide?.heroSummary || "Use the current hotel guides instead of stale Vegas rumor threads."}</p>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="panel" id="best-vegas-hotel-lanes-right-now">
        <div className="eyebrow">Best Vegas hotel lanes</div>
        <div style={{ height: 10 }} />
        <h2 className="detail-title">BEST VEGAS HOTEL LANES RIGHT NOW</h2>
        <div style={{ height: 18 }} />
        <div className="feature-grid">
          {hotelLanes.map((lane) => (
            <article className="card category-card" key={lane.title}>
              <div className="inline-media-frame category-card-image">
                <img
                  src={lane.image}
                  alt={lane.imageAlt}
                  className="media-image"
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div className="eyebrow">{lane.eyebrow}</div>
              <h2>{lane.title.toUpperCase()}</h2>
              <p>{lane.description}</p>
              <ul className="quick-picks">
                {lane.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {featuredGuides.length ? (
        <section className="grid" id="featured-hotel-guides">
          {featuredGuides.map((guide) => {
            const guideImage = guideImageMap.get(guide.slug);
            if (!guideImage) return null;

            return (
              <article className="card media-card" key={`featured-${guide.slug}`}>
                <div className="media-frame">
                  <img
                    src={guideImage.src}
                    alt={guideImage.alt}
                    className="media-image"
                    loading="lazy"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="media-copy">
                  <div className="eyebrow">{guide.eyebrow}</div>
                  <h2>{guide.title}</h2>
                  <p>{guide.heroSummary}</p>
                  <Link href={`/hotels/${guide.slug}`} className="button button-primary">
                    Read guide
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <section className="grid">
        {guides.map((guide) => {
          if (featuredGuides.some((featuredGuide) => featuredGuide.slug === guide.slug)) {
            return null;
          }
          const guideImage = guideImageMap.get(guide.slug);

          return (
          <article className="card" key={guide.slug}>
            {guideImage ? (
              <div className="inline-media-frame category-card-image" style={{ marginBottom: 14 }}>
                <img
                  src={guideImage.src}
                  alt={guideImage.alt}
                  className="media-image"
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : null}
            <div className="eyebrow">{guide.eyebrow}</div>
            <h2>{guide.title}</h2>
            <p>{guide.heroSummary}</p>
            <div style={{ height: 12 }} />
            <Link href={`/hotels/${guide.slug}`} className="button button-primary">
              Read guide
            </Link>
          </article>
        )})}
      </section>
    </main>
  );
}
