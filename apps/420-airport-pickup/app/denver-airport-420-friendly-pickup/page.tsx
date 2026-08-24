import type { Metadata } from "next";
import AirportPickupSeoPage from "@/app/components/AirportPickupSeoPage";

export const metadata: Metadata = {
  title: "420 Friendly Airport Pickup Denver | Private DEN Transportation",
  description:
    "Private 420-friendly airport pickup from Denver International Airport for adults 21+, with an optional lawful dispensary stop when practical and direct drop-off after the stop.",
  alternates: { canonical: "/denver-airport-420-friendly-pickup" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "420 Friendly Airport Pickup Denver | Private DEN Transportation",
    description:
      "Plan a private Denver airport pickup with an optional lawful dispensary stop built into the confirmed route when practical.",
    url: "https://420friendlyairportpickup.com/denver-airport-420-friendly-pickup",
    type: "website",
  },
};

export default function DenverAirport420FriendlyPickupPage() {
  return (
    <AirportPickupSeoPage
      sourcePage="/denver-airport-420-friendly-pickup"
      eyebrow="Denver International Airport · adults 21+"
      h1="420 Friendly Airport Pickup in Denver"
      quickAnswer="Private transportation from DEN with an optional lawful dispensary stop built into the confirmed route when practical—then drop-off at your destination."
      body="This is airport transportation first. Use the 420-friendly option when adults 21+ want a lawful retail stop included in the arrival plan instead of improvising after landing. The transportation provider does not sell cannabis, the vehicle is not a consumption space, and current law, retailer availability, road conditions, timing, and the confirmed trip determine whether a stop is practical."
      rows={[
        { title: "Private DEN pickup", copy: "Start at Denver International Airport with arrival-based pickup context and a private vehicle." },
        { title: "Optional lawful retail stop", copy: "For adults 21+, the dispensary stop can be part of the confirmed route when lawful and practical for the trip." },
        { title: "Transportation stays transportation", copy: "Passengers make retail purchases independently. The transportation provider does not sell cannabis and no consumption is permitted in the vehicle." },
        { title: "Drop-off after the stop", copy: "Continue to the agreed Denver-area destination after the optional stop is complete." },
        { title: "Check current trip terms", copy: "Roads, weather, timing, retailer availability, and applicable rules can affect whether a stop is practical." },
        { title: "Standard pickup is always available", copy: "If the retail stop is not part of your arrival plan, choose the standard private airport-pickup lane instead." },
      ]}
    />
  );
}
