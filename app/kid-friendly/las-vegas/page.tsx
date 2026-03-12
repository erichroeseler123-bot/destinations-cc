import type { Metadata } from "next";
import VegasHotelGridSection from "@/app/components/dcc/VegasHotelGridSection";
import { getVegasHotelsByTag } from "@/src/data/vegas-hotels-config";

const PAGE_URL = "https://destinationcommandcenter.com/kid-friendly/las-vegas";

export const metadata: Metadata = {
  title: "Kid-Friendly Las Vegas Hotels | Destination Command Center",
  description:
    "Browse kid-friendly Las Vegas hotels through a reusable family-oriented overlay connected to the wider Vegas hotel mesh.",
  alternates: { canonical: "/kid-friendly/las-vegas" },
  openGraph: {
    title: "Kid-Friendly Las Vegas Hotels",
    description:
      "A kid-friendly overlay page for Las Vegas hotel discovery, built from the same hotel node system as the main Vegas hotels hub.",
    url: PAGE_URL,
    type: "website",
  },
};

export default function KidFriendlyLasVegasPage() {
  const hotels = getVegasHotelsByTag("kid-friendly");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <VegasHotelGridSection
          title="Kid-friendly Las Vegas hotels"
          intro="This overlay is generated from the same Vegas hotel tag system. It gives family-search intent a dedicated landing page instead of leaving it buried inside generic Vegas advice."
          hotels={hotels}
        />
      </div>
    </main>
  );
}
