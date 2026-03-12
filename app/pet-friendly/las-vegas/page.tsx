import type { Metadata } from "next";
import VegasHotelGridSection from "@/app/components/dcc/VegasHotelGridSection";
import { getVegasHotelsByTag } from "@/src/data/vegas-hotels-config";

const PAGE_URL = "https://destinationcommandcenter.com/pet-friendly/las-vegas";

export const metadata: Metadata = {
  title: "Pet-Friendly Las Vegas Hotels | Destination Command Center",
  description:
    "Browse pet-friendly Las Vegas hotels through a reusable tag-driven overlay connected to the wider Vegas hotel mesh.",
  alternates: { canonical: "/pet-friendly/las-vegas" },
  openGraph: {
    title: "Pet-Friendly Las Vegas Hotels",
    description:
      "A pet-friendly overlay page for Las Vegas hotel discovery, built from the same hotel node system as the main Vegas hotels hub.",
    url: PAGE_URL,
    type: "website",
  },
};

export default function PetFriendlyLasVegasPage() {
  const hotels = getVegasHotelsByTag("pet-friendly");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <VegasHotelGridSection
          title="Pet-friendly Las Vegas hotels"
          intro="This overlay is generated from the same hotel tag system as the main Vegas hotels hub. It exists so pet-friendly is a real search surface, not just a filter buried inside a longer page."
          hotels={hotels}
        />
      </div>
    </main>
  );
}
