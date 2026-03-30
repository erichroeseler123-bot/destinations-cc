import type { Metadata } from "next";
import TourFinderPlanner from "@/app/components/dcc/TourFinderPlanner";
import { getViatorDestinationOptions } from "@/lib/viator/destinations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tour Finder | Destination Command Center",
  description:
    "Find the best tours for your trip by destination, travel dates, intent, and group size. DCC ranks the strongest Viator-backed options first.",
  alternates: { canonical: "/tour-finder" },
};

type TourFinderPageSearchParams = {
  destination?: string;
  startDate?: string;
  endDate?: string;
  intent?: string;
  groupSize?: string;
};

export default async function TourFinderPage({
  searchParams,
}: {
  searchParams: Promise<TourFinderPageSearchParams>;
}) {
  const sp = await searchParams;
  const destinationOptions = getViatorDestinationOptions().slice(0, 150).map((option) => ({
    routeSlug: option.routeSlug,
    cityName: option.cityName,
    state: option.state,
  }));

  const initialIntent =
    sp.intent === "concerts-nightlife" ||
    sp.intent === "tours-sightseeing" ||
    sp.intent === "adventure-excursions" ||
    sp.intent === "private-group-transport"
      ? sp.intent
      : "tours-sightseeing";

  const parsedGroupSize = Number(sp.groupSize);
  const initialGroupSize = [2, 4, 6, 8].includes(parsedGroupSize) ? parsedGroupSize : 2;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <TourFinderPlanner
        destinationOptions={destinationOptions}
        initialDestination={sp.destination || "Las Vegas"}
        initialStartDate={sp.startDate || ""}
        initialEndDate={sp.endDate || ""}
        initialIntent={initialIntent}
        initialGroupSize={initialGroupSize}
      />
    </main>
  );
}
