import Link from "next/link";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import type { AttractionManifest } from "@/lib/dcc/manifests/cityExpansion";

export default function AttractionExperienceSection({
  entry,
  products,
}: {
  entry: AttractionManifest["attractions"][number];
  products: ViatorActionProduct[];
}) {
  const fallbacks = (entry.experienceIntents || []).map((item) => ({
    label: item.label,
    query: item.query,
  }));

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Popular experiences</p>
          <h2 className="mt-2 text-3xl font-bold">{entry.experiencesIntro || `Popular ways visitors experience ${entry.name}`}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/74">
            {entry.experiencesDescription || "Guided experiences can help visitors get more context, structure, and local insight."}
          </p>
        </div>
        <Link
          href={entry.primaryToursHref || "#"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/88 hover:bg-white/10"
        >
          Browse all experiences
        </Link>
      </div>

      <ViatorTourGrid
        placeName={entry.name}
        title="Guided experiences"
        description="These tours and local experiences fit naturally with the attraction instead of interrupting the guide."
        products={products}
        fallbacks={fallbacks}
        ctaLabel="View experience"
      />
    </section>
  );
}
