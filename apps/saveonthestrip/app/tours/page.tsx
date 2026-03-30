import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getVegasTourSlug } from "@/lib/content";
import { getDccImageSet } from "@/lib/dccMedia";
import { getVegasTours, groupVegasToursByArea, type VegasTour } from "@/lib/fareharbor";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";

export const metadata: Metadata = {
  title: "Vegas Tours | Save On The Strip",
  description:
    "Compare Grand Canyon, Hoover Dam, Red Rock, and nearby Vegas tours with a decision-first layout and live operator links.",
  alternates: { canonical: "https://saveonthestrip.com/tours" },
  openGraph: {
    title: "Vegas Tours | Save On The Strip",
    description:
      "Choose the size of the day first, then compare the Vegas tour routes that actually fit the trip.",
    url: "https://saveonthestrip.com/tours",
    type: "website",
  },
};

const VEGAS_TOUR_LANES = [
  {
    eyebrow: "Big day",
    title: "Grand Canyon all-day commitment",
    description: "Use this first when the trip needs one marquee outing people will actually plan around.",
    href: "#grand-canyon-tours",
  },
  {
    eyebrow: "Easy add-on",
    title: "Hoover Dam half-day and combo routes",
    description: "Best for travelers who want real scenery and history without losing the whole day.",
    href: "#hoover-dam-tours",
  },
  {
    eyebrow: "Close nature",
    title: "Red Rock reset without the bus-marathon feel",
    description: "A cleaner lane for desert views, shorter timing, and easy contrast to the Strip.",
    href: "#red-rock-tours",
  },
  {
    eyebrow: "Flexible Vegas",
    title: "In-city and nearby experiences",
    description: "Use this when you want one more activity but not a full commitment outside Las Vegas.",
    href: "#las-vegas-experiences",
  },
] as const;

function TourCard({ tour }: { tour: VegasTour }) {
  const outboundHref = tour.productUrl
    ? `/api/tours/out?target=${encodeURIComponent(tour.productUrl)}&sourcePath=/tours&sourceSlug=saveonthestrip-tours&sourcePage=/tours&topicSlug=vegas-tours&productSlug=${encodeURIComponent(tour.slug)}&company=${encodeURIComponent(tour.company)}&itemPk=${encodeURIComponent(String(tour.itemPk))}&area=${encodeURIComponent(tour.area)}`
    : null;

  return (
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
      <div className="eyebrow">{tour.areaLabel}</div>
      <h2 style={{ marginTop: 10 }}>{tour.name}</h2>
      <p>{tour.headline || tour.description || "View live details and current FareHarbor listing."}</p>
      <p>
        {tour.durationLabel || "Duration varies"}
        {tour.fromPrice ? ` • ${tour.fromPrice}` : ""}
        {tour.company ? ` • ${tour.company}` : ""}
      </p>
      {outboundHref ? (
        <>
          <div style={{ height: 12 }} />
          <div className="detail-actions">
            <Link href={`/tours/${getVegasTourSlug(tour)}`} className="button button-secondary">
              More information
            </Link>
            <Link href={outboundHref} className="button button-primary">
              View operator page
            </Link>
          </div>
        </>
      ) : null}
    </article>
  );
}

function TourSection({
  sectionId,
  title,
  description,
  tours,
}: {
  sectionId: string;
  title: string;
  description: string;
  tours: VegasTour[];
}) {
  if (!tours.length) return null;

  return (
    <section className="panel" id={sectionId}>
      <div className="eyebrow">Live FareHarbor feed</div>
      <div style={{ height: 10 }} />
      <h2>{title}</h2>
      <p>{description}</p>
      <div style={{ height: 18 }} />
      <div className="grid">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  );
}

export default async function ToursPage() {
  const photos = await getVegasPhotoLibrary();
  const [{ tours, companies, configured }, vegasImageSet] = await Promise.all([
    getVegasTours(),
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
  const grouped = groupVegasToursByArea(tours);
  const heroImage = vegasImageSet?.hero || vegasImageSet?.card || null;
  const heroStatusValue = tours.length > 0 ? String(tours.length) : String(VEGAS_TOUR_LANES.length);
  const quickStartLanes = [
    {
      title: "Make it the big day",
      copy: "Use Grand Canyon when the trip needs one outing people will talk about more than another casino night.",
      href: "#grand-canyon-tours",
      cta: "Open Grand Canyon",
    },
    {
      title: "Keep half the day",
      copy: "Use Hoover Dam when you want a real excursion without sacrificing the full Vegas schedule.",
      href: "#hoover-dam-tours",
      cta: "See Hoover Dam",
    },
    {
      title: "Get off the Strip fast",
      copy: "Use Red Rock when the trip needs desert contrast and breathing room without a long operator day.",
      href: "#red-rock-tours",
      cta: "Open Red Rock",
    },
  ] as const;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="hero hero-home">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Vegas tours</div>
            <div style={{ height: 10 }} />
            <h1>Pick one Las Vegas outing worth leaving the Strip for</h1>
            <p className="lead">
              Start with the strongest lanes first: Grand Canyon when you want the marquee day,
              Hoover Dam when you want an easier half-day, and Red Rock when you just need desert
              time without a bus-marathon commitment.
            </p>
            <div style={{ height: 18 }} />
            <div className="cta-row">
              <Link href="#grand-canyon-tours" className="button button-primary">
                Start with Grand Canyon
              </Link>
              <Link href="#hoover-dam-tours" className="button button-secondary">
                See Hoover Dam options
              </Link>
            </div>
            <div style={{ height: 14 }} />
            <div className="filter-pills">
              <div className="pill">Grand Canyon</div>
              <div className="pill">Hoover Dam</div>
              <div className="pill">Red Rock</div>
              <div className="pill">Half-day tours</div>
              <div className="pill">One big outing</div>
              <div className="pill">Vegas day trips</div>
            </div>
          </div>

          <aside className="hero-status">
            <div className="eyebrow">Trip shape</div>
            <div className="status-value">{heroStatusValue}</div>
            <p>
              {configured
                ? `${companies.length} operators are live. Decide whether the day should be Grand Canyon, Hoover Dam, Red Rock, or an easier in-town add-on.`
                : "Decide whether the day should be Grand Canyon, Hoover Dam, Red Rock, or an easier in-town add-on."}
            </p>
            <div className="status-grid">
              <div className="status-chip">
                <strong>Biggest win</strong>
                <span>Grand Canyon is the clear choice when the trip needs one headline outing.</span>
              </div>
              <div className="status-chip">
                <strong>Easier fit</strong>
                <span>Hoover Dam usually works better for shorter stays and lower-friction planning.</span>
              </div>
              <div className="status-chip">
                <strong>Closest reset</strong>
                <span>Red Rock is the fastest way to get real desert scenery into a Vegas trip.</span>
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
        <h2 className="detail-title">Choose the size of the day first.</h2>
        <p className="lead quick-start-lead">
          Vegas tours get easier once you decide whether the day should be marquee, half-day, or close-in scenery. Pick the commitment level before you compare operators.
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
        {VEGAS_TOUR_LANES.map((lane) => (
          <article className="card category-card" key={lane.title}>
            <div className="media-frame category-card-image">
              <Image
                src={
                  lane.title.includes("Grand Canyon")
                    ? photos.grandCanyon.src
                    : lane.title.includes("Hoover")
                      ? photos.vegasNight.src
                      : lane.title.includes("Red Rock")
                        ? photos.desertOutdoor.src
                        : photos.bellagio.src
                }
                alt={
                  lane.title.includes("Grand Canyon")
                    ? photos.grandCanyon.alt
                    : lane.title.includes("Hoover")
                      ? photos.vegasNight.alt
                      : lane.title.includes("Red Rock")
                        ? photos.desertOutdoor.alt
                        : photos.bellagio.alt
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

      {!configured ? (
        <section className="panel">
          <div className="eyebrow">Tour listings not available right now</div>
          <div style={{ height: 10 }} />
          <h2>Check back soon</h2>
          <p>
            Live operator listings are not available at the moment. Try again later for current
            Vegas tour options.
          </p>
        </section>
      ) : null}

      <TourSection
        sectionId="las-vegas-experiences"
        title="Las Vegas tours and experiences"
        description="In-city experiences, add-ons, and easier options that do not require a full day out."
        tours={grouped.lasVegas}
      />
      <TourSection
        sectionId="grand-canyon-tours"
        title="Grand Canyon tours from Las Vegas"
        description="The biggest day-trip category from Las Vegas, including bus, helicopter, and premium canyon options."
        tours={grouped.grandCanyon}
      />
      <TourSection
        sectionId="hoover-dam-tours"
        title="Hoover Dam tours from Las Vegas"
        description="Good for half-day plans, combo tours, and travelers who want something easier than a full canyon day."
        tours={grouped.hooverDam}
      />
      <TourSection
        sectionId="red-rock-tours"
        title="Red Rock Canyon tours"
        description="A strong nearby option for scenic desert time without committing to the longest bus days."
        tours={grouped.redRock}
      />
      <TourSection
        sectionId="other-day-trips"
        title="Other nearby day trips"
        description="Additional regional departures for travelers who want more than the standard Strip-only plan."
        tours={grouped.dayTrips}
      />
    </main>
  );
}
