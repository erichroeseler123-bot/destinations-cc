import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import { headers } from "next/headers";

type GuideConfig = {
  id: string;
  title: string;
  quickAnswer: string;
  steps: { title: string; desc: string }[];
  extendedText: string;
  relatedCategorySlug: string;
  relatedCategoryName: string;
};

const GUIDES_MAP: Record<string, GuideConfig> = {
  "best-new-orleans-swamp-tour": {
    id: "best-new-orleans-swamp-tour",
    title: "How to Choose the Best New Orleans Swamp Tour",
    quickAnswer: "If you want a relaxing, shaded ride suitable for all ages, choose a Covered Pontoon Boat Tour. If you want a fast-paced, high-speed tour that gets closer to the water and wildlife, choose a Small-Group Airboat Tour.",
    steps: [
      {
        title: "Step 1: Choose Your Vessel Type",
        desc: "Covered pontoon boats are slow, stable, shaded, and permit easy moving around. Airboats are loud, fast, and open-air, allowing them to glide into shallow marshes where alligators nest.",
      },
      {
        title: "Step 2: Check Transportation Options",
        desc: "Most swamps are located 35–45 minutes outside of downtown New Orleans (CBD/French Quarter). We highly recommend booking a tour that includes hotel pickup and round-trip shuttle transportation.",
      },
      {
        title: "Step 3: Consider the Timing & Weather",
        desc: "Morning tours are cooler and more comfortable in summer months. However, alligators are cold-blooded and are most active on sunny afternoons in spring and autumn.",
      },
    ],
    extendedText: "Louisiana bayous are home to a fragile and beautiful ecosystem. Shaded pontoon tours are led by local captains who narrate the history of Cajuns and wetlands preservation. Airboat excursions, while louder, offer access to areas that regular boats cannot reach, making them popular for wildlife photography and adrenaline seekers.",
    relatedCategorySlug: "swamp-tours",
    relatedCategoryName: "Swamp Tours",
  },
  "french-quarter-tour-timing": {
    id: "french-quarter-tour-timing",
    title: "French Quarter Tour Timing Guide",
    quickAnswer: "Book a morning walking tour (between 9:00 AM and 11:00 AM) to beat the Louisiana heat and afternoon rain. For ghost and history tours, evening slots (starting after 6:00 PM) offer the best spooky ambiance and cooler breezes.",
    steps: [
      {
        title: "Morning (9:00 AM - Noon)",
        desc: "Ideal for historical and architectural tours. The streets are clean, crowds are light, and temperatures are still manageable.",
      },
      {
        title: "Afternoon (Noon - 4:00 PM)",
        desc: "Best spent on indoor activities, air-conditioned museum tours, or culinary tasting walks that involve air-conditioned tavern stops.",
      },
      {
        title: "Evening (6:00 PM - 9:00 PM)",
        desc: "The prime time for ghost walks, cemetery lore, and voodoo tours. The historic lanterns are lit, and the Quarter comes alive with street jazz.",
      },
    ],
    extendedText: "New Orleans walking tours cover substantial ground, usually 1 to 2 miles. Historic sidewalks in the French Quarter are made of uneven brick and flagstone, so comfortable walking shoes are mandatory. Afternoon rain showers are extremely common in summer, so carry a travel umbrella.",
    relatedCategorySlug: "",
    relatedCategoryName: "All New Orleans Tours",
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(GUIDES_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = GUIDES_MAP[slug];
  if (!config) {
    return { title: "Guide Not Found" };
  }
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";

  return {
    title: `${config.title} | New Orleans Tours`,
    description: config.quickAnswer.slice(0, 150),
    metadataBase: new URL(origin),
    alternates: { canonical: isWto ? `/guides/${slug}` : `/new-orleans/guides/${slug}` },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const config = GUIDES_MAP[slug];

  if (!config) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": config.title,
          "description": config.quickAnswer,
          "url": `https://welcometoneworleanstours.com/guides/${slug}`,
        }}
      />
      <main className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6">
            ← Back to Storefront
          </Link>

          {/* Guide Title */}
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {config.title}
            </h1>
          </header>

          {/* Quick Answer Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
            <span className="block font-bold text-emerald-800 text-xs uppercase tracking-wider mb-2">⚡️ Quick Answer</span>
            <p className="text-emerald-900 leading-relaxed font-medium">
              {config.quickAnswer}
            </p>
          </div>

          {/* Steps / Decision Cards */}
          <section className="space-y-6 mb-10">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wider mb-4">Key Decisions to Make</h2>
            {config.steps.map((step, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-950 text-base mb-2">{step.title}</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </section>

          {/* Related Category link */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900">Ready to compare options?</h3>
              <p className="text-sm text-slate-500 mt-1">Browse verified tours matching this guide.</p>
            </div>
            <Link 
              href={config.relatedCategorySlug ? `/categories/${config.relatedCategorySlug}` : "/"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
            >
              View {config.relatedCategoryName} →
            </Link>
          </section>

          {/* Extended Explanation */}
          <section className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Additional Local Context</h3>
            <p>{config.extendedText}</p>
          </section>
        </div>
      </main>
    </>
  );
}
