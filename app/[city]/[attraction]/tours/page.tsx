import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CityTimePanel from "@/app/components/dcc/CityTimePanel";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import {
  getManifestAttraction,
  getAttractionsManifest,
  getCityManifest,
  listManifestCitySlugs,
} from "@/lib/dcc/manifests/cityExpansion";

type Params = { city: string; attraction: string };

export function generateStaticParams() {
  return listManifestCitySlugs().flatMap((city) =>
    (getAttractionsManifest(city)?.attractions || []).map((entry) => ({
      city,
      attraction: entry.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city, attraction } = await params;
  const entry = getManifestAttraction(city, attraction);
  if (!entry) return { title: "Local Tours" };
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const description = `Browse guided experiences, local tours, and popular ways visitors explore ${entry.name} in ${cityName}.`;

  return {
    title: `${entry.name} Tours and Guided Experiences | ${cityName}`,
    description,
    keywords: [
      `${entry.name} tours`,
      `${entry.name} guided experiences`,
      `${entry.name} ${cityName}`,
      `${cityName} tours`,
    ],
    alternates: { canonical: `/${city}/${entry.slug}/tours` },
    openGraph: {
      title: `${entry.name} Tours and Guided Experiences | ${cityName}`,
      description,
      url: `https://destinationcommandcenter.com/${city}/${entry.slug}/tours`,
      type: "website",
    },
  };
}

function ToursJsonLd({
  entry,
  city,
}: {
  entry: NonNullable<ReturnType<typeof getManifestAttraction>>;
  city: string;
}) {
  const pageUrl = `https://destinationcommandcenter.com/${city}/${entry.slug}/tours`;
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${entry.name} Tours`,
        description: `Guided experiences and local tours related to ${entry.name} in ${cityName}.`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://destinationcommandcenter.com/" },
          { "@type": "ListItem", position: 2, name: cityName, item: `https://destinationcommandcenter.com/${city}` },
          { "@type": "ListItem", position: 3, name: entry.name, item: `https://destinationcommandcenter.com/${city}/${entry.slug}` },
          { "@type": "ListItem", position: 4, name: "Tours", item: pageUrl },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function AttractionToursPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city, attraction } = await params;
  const entry = getManifestAttraction(city, attraction);
  if (!entry) notFound();
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const cityManifest = getCityManifest(city);

  const viatorAction = await getViatorActionForPlace({
    slug: entry.slug,
    name: `${cityName} ${entry.name}`,
    citySlug: city,
  });

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <ToursJsonLd entry={entry} city={city} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">{cityName} experiences</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{entry.name} tours and guided experiences</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
            Browse helpful local tours and guided experiences connected to {entry.name}, from first-time walking tours to more focused food, music, or history experiences.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/${city}/${entry.slug}`} className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to attraction guide
            </Link>
            <Link href={`/${city}`} className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to {cityName}
            </Link>
          </div>
          {cityManifest?.timezone ? (
            <div className="mt-6 max-w-sm">
              <CityTimePanel cityName={cityName} timezone={cityManifest.timezone} showWeekday />
            </div>
          ) : null}
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Conditions First</p>
              <h2 className="mt-2 text-2xl font-bold">Timing matters more than the tour type.</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                The same experience can feel completely different depending on when you go. Conditions, crowd level, and weather windows often change the quality of the outing more than the label on the tour card.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-[#8fd0ff]">Plan this in this order</div>
              <div className="mt-4 grid gap-3">
                {[
                  "1. When conditions are best",
                  "2. How long the experience runs",
                  "3. Then which option fits that window",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ViatorTourGrid
          placeName={`${city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())} ${entry.name}`}
          title={entry.experiencesIntro || `Popular ways to experience ${entry.name}`}
          description={
            entry.experiencesDescription ||
            `Browse guided experiences and local tours connected to ${entry.name}.`
          }
          products={viatorAction.products}
          fallbacks={(entry.experienceIntents || []).map((item) => ({ label: item.label, query: item.query }))}
          ctaLabel="View experience"
        />

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Related planning</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {entry.thingsToDoHref ? (
              <Link href={entry.thingsToDoHref} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/82 hover:bg-white/10">
                Things to do in {cityName}
              </Link>
            ) : null}
            {(entry.relatedAttractions || []).map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/82 hover:bg-white/10">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
