import Image from "next/image";
import Link from "next/link";
import { VEGAS_TIMESHARE_RESORTS } from "@/lib/timeshares";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";

const TIMESHARE_LANES = [
  {
    eyebrow: "Center Strip",
    title: "Walk-first resorts and easiest show access",
    description: "Best when you want the presentation option without giving up the easiest Vegas nights.",
  },
  {
    eyebrow: "Value lane",
    title: "Bigger rooms without center-Strip pricing",
    description: "The practical play if room size and value matter more than walking to everything.",
  },
  {
    eyebrow: "Calmer base",
    title: "South Strip and easier airport-side stays",
    description: "Good for travelers who want a quieter resort base and simpler arrival-day logistics.",
  },
  {
    eyebrow: "No-pressure",
    title: "Skip the offer if it does not help",
    description: "If the presentation angle does not improve the stay, ignore it and book the trip normally.",
  },
] as const;

function getResortImage(slug: string, photos: Awaited<ReturnType<typeof getVegasPhotoLibrary>>) {
  if (slug.includes("elara") || slug.includes("flamingo") || slug.includes("jockey")) return photos.bellagio;
  if (slug.includes("marriott") || slug.includes("polo")) return photos.vegasNight;
  if (slug.includes("tahiti") || slug.includes("cancun")) return photos.resortPool;
  return photos.hotelValue;
}

export default async function TimesharesPage() {
  const photos = await getVegasPhotoLibrary();
  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="hero hero-home">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Vegas timeshares</div>
            <div style={{ height: 10 }} />
            <h1>Use timeshare offers only if they actually improve the Vegas trip</h1>
            <p className="lead">
              This page is here for travelers who want to compare resort locations, presentation
              angles, and better-value offer paths without getting trapped in junk pitch language.
            </p>
            <div style={{ height: 18 }} />
            <div className="cta-row">
              <Link href="#major-resorts" className="button button-primary">
                Compare resorts
              </Link>
              <Link href="#how-to-think-about-it" className="button button-secondary">
                Choose by location
              </Link>
            </div>
            <div style={{ height: 14 }} />
            <div className="filter-pills">
              <div className="pill">Center Strip</div>
              <div className="pill">Value stay</div>
              <div className="pill">South Strip</div>
              <div className="pill">Presentation help</div>
              <div className="pill">No-pressure option</div>
            </div>
          </div>

          <aside className="hero-status">
            <div className="eyebrow">Decision filter</div>
            <div className="status-value">{VEGAS_TIMESHARE_RESORTS.length}</div>
            <p>
              Start with location first. If the offer makes the stay easier or cheaper, keep
              looking. If not, ignore the presentation angle entirely.
            </p>
            <div className="status-grid">
              <div className="status-chip">
                <strong>Best location</strong>
                <span>Center Strip works when shows and walking access matter most.</span>
              </div>
              <div className="status-chip">
                <strong>Best value</strong>
                <span>Off-Strip and west-side resorts usually win when room size matters more.</span>
              </div>
              <div className="status-chip">
                <strong>No pressure</strong>
                <span>You do not need a presentation to use the site or plan a strong Vegas trip.</span>
              </div>
            </div>
          </aside>
        </div>

        <div style={{ height: 18 }} />
        <div className="media-frame hero-header-frame">
          <Image
            src={photos.resortPool.src}
            alt={photos.resortPool.alt}
            fill
            priority
            sizes="100vw"
            className="media-image"
          />
        </div>
      </section>

      <section className="grid">
        {TIMESHARE_LANES.map((lane, index) => {
          const lanePhoto = index === 0
            ? photos.bellagio
            : index === 1
              ? photos.hotelValue
              : index === 2
                ? photos.resortPool
                : photos.vegasNight;
          return (
            <article className="card category-card" key={lane.title}>
              <div className="media-frame category-card-image">
                <Image
                  src={lanePhoto.src}
                  alt={lanePhoto.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 25vw"
                  className="media-image"
                />
              </div>
              <div className="eyebrow">{lane.eyebrow}</div>
              <h2>{lane.title}</h2>
              <p>{lane.description}</p>
            </article>
          );
        })}
      </section>

      <section className="panel" id="how-to-think-about-it">
        <div className="eyebrow">Location first</div>
        <div style={{ height: 10 }} />
        <h2>Choose by location first</h2>
        <div className="grid">
          <article className="card">
            <div className="eyebrow">Center Strip</div>
            <p>
              Best if you want to walk to shows, casinos, and restaurants without planning your
              whole night around rideshare.
            </p>
          </article>
          <article className="card">
            <div className="eyebrow">South Strip</div>
            <p>
              Better for travelers who want a resort feel, easier airport access, or a calmer home
              base.
            </p>
          </article>
          <article className="card">
            <div className="eyebrow">Off Strip</div>
            <p>
              Usually best when room size and value matter more than staying right in the center of
              the action.
            </p>
          </article>
          <article className="card">
            <div className="eyebrow">Day-trip heavy stays</div>
            <p>
              If you plan to do Grand Canyon or Hoover Dam, south-side and easier-departure
              locations can be worth considering.
            </p>
          </article>
        </div>
      </section>

      <section className="panel" id="major-resorts">
        <div className="eyebrow">Major Vegas timeshare resorts</div>
        <div style={{ height: 10 }} />
        <h2>Main places to know</h2>
        <p>
          This is a practical working list of the main timeshare-style resorts travelers usually
          compare around Las Vegas. It is focused on location, fit, and what each property is most
          useful for.
        </p>
        <div style={{ height: 18 }} />
        <div className="grid">
          {VEGAS_TIMESHARE_RESORTS.map((resort) => (
            <article className="card" key={resort.slug}>
              <div className="inline-media-frame">
                <Image
                  src={getResortImage(resort.slug, photos).src}
                  alt={getResortImage(resort.slug, photos).alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
              <div style={{ height: 12 }} />
              <div className="eyebrow">{resort.area}</div>
              <h2 style={{ marginTop: 10 }}>{resort.name}</h2>
              <p>{resort.brand}</p>
              <p>{resort.locationSummary}</p>
              <p>
                <strong>Strip access:</strong> {resort.stripAccess}
              </p>
              <p>
                <strong>Best for:</strong> {resort.bestFor}
              </p>
              <div style={{ height: 12 }} />
              <Link href={`/timeshares/${resort.slug}`} className="button button-secondary">
                More information
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="eyebrow">Important note</div>
        <div style={{ height: 10 }} />
        <h2>Always confirm the current offer details</h2>
        <p>
          Presentation offers, free extras, discounts, eligibility rules, and required attendance
          windows can change. Always confirm the exact details before booking anything tied to a
          presentation.
        </p>
      </section>
    </main>
  );
}
