import type { Metadata } from "next";
import AirportPickupSeoPage from "@/app/components/AirportPickupSeoPage";

export const metadata: Metadata = {
  title: "Denver Airport 420-Friendly Pickup | Dispensary Stop Built In",
  description:
    "Book Denver Airport 420-friendly pickup with DEN pickup, dispensary stop built into the route, and drop-off after the stop.",
  alternates: { canonical: "/denver-airport-420-friendly-pickup" },
  robots: { index: true, follow: true },
};

export default function DenverAirport420FriendlyPickupPage() {
  return (
    <AirportPickupSeoPage
      sourcePage="/denver-airport-420-friendly-pickup"
      eyebrow="DEN arrival"
      h1="Denver Airport 420-Friendly Pickup"
      quickAnswer="A private DEN pickup with the dispensary stop planned into the route before checkout."
      body="Use this when the stop is part of the arrival plan. The pickup starts at Denver International Airport, the dispensary stop is built into the route, and drop-off happens after the stop. The point is to avoid improvising after landing or trying to explain the route inside a random rideshare."
      rows={[
        { title: "DEN pickup", copy: "Start at Denver International Airport with arrival-based pickup context." },
        { title: "Stop built in", copy: "Choose the 420-friendly package when the dispensary stop belongs in the route." },
        { title: "Drop-off after", copy: "Continue to your Denver metro drop-off after the stop is complete." },
        { title: "No improvising", copy: "The checkout link carries package=420-friendly and mode=420 into booking." },
      ]}
    />
  );
}
