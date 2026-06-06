import type { Metadata } from "next";
import AirportPickupSeoPage from "@/app/components/AirportPickupSeoPage";

export const metadata: Metadata = {
  title: "420-Friendly Airport Transport Denver | Standard or Dispensary Stop",
  description:
    "Compare standard Denver airport pickup with 420-friendly airport transport that includes a dispensary stop in the arrival plan.",
  alternates: { canonical: "/420-friendly-airport-transport-denver" },
  robots: { index: true, follow: true },
};

export default function FriendlyAirportTransportDenverPage() {
  return (
    <AirportPickupSeoPage
      sourcePage="/420-friendly-airport-transport-denver"
      eyebrow="Denver airport transport"
      h1="420-Friendly Airport Transport in Denver"
      quickAnswer="Choose standard pickup for the fastest arrival. Choose 420-friendly pickup when the dispensary stop should be part of the route."
      body="This is an execution page, not a tour guide. The decision is simple: standard airport transport gets you from DEN to your drop-off faster, while the 420-friendly lane adds the dispensary stop before drop-off. Pick the lane that matches the arrival you actually want, then continue directly to checkout."
      rows={[
        { title: "Standard pickup", copy: "Best when speed and direct drop-off matter most after landing." },
        { title: "420-friendly pickup", copy: "Best when the dispensary stop should be included before drop-off." },
        { title: "DEN context", copy: "Both booking links carry DEN pickup and arrival-based timing." },
        { title: "Checkout context", copy: "The 420-friendly button preserves package=420-friendly and mode=420." },
      ]}
    />
  );
}
