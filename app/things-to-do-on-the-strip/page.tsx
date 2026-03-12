import type { Metadata } from "next";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import { getVegasAttractionsByTag } from "@/src/data/vegas-attractions-config";

export const metadata: Metadata = {
  title: "Things To Do on the Las Vegas Strip | Attractions, Landmarks, and Nearby Hotel Routing",
  description:
    "A Strip-specific attraction overlay for Las Vegas covering Bellagio landmarks, Sphere-adjacent entertainment, observation rides, and nearby hotel routing.",
  alternates: { canonical: "/things-to-do-on-the-strip" },
};

export default function ThingsToDoOnTheStripPage() {
  const attractions = getVegasAttractionsByTag("strip");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Overlay</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Things to do on the Las Vegas Strip</h1>
          <p className="max-w-3xl text-zinc-300">
            This overlay catches the highest-volume Strip attraction intent and routes it into hotels, shows, and
            nearby landmark planning instead of leaving it trapped inside the broader city page.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <VegasEntityGridSection
          title="Strip attraction and landmark layer"
          intro="These are the strongest Strip-facing attractions inside the current Vegas mesh."
          entities={attractions.map((attraction) => ({
            slug: attraction.slug,
            name: attraction.name,
            summary: attraction.summary,
            primaryHref: attraction.primaryHref,
            chips: attraction.tags.map((tag) => tag.replace("-", " ")),
            nearbyLinks: attraction.nearbyLinks,
          }))}
          backLinks={[
            { href: "/las-vegas-strip", label: "Las Vegas Strip" },
            { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
            { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
          ]}
        />
      </div>
    </main>
  );
}
