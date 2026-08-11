import type { Metadata } from "next";
import StaticPage from "../../components/StaticPage";

export const metadata: Metadata = {
  title: "What to Do if Your Juneau Helicopter Tour Is Canceled",
  description:
    "A practical Juneau cruise-day backup plan when helicopter weather cancels or changes your glacier flight.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
};

export default function JuneauHelicopterCanceledPage() {
  return (
    <StaticPage
      eyebrow="Juneau weather pivot"
      title="If the helicopter cancels, save the shore day."
      intro="A canceled flight does not have to become a lost port day. Recheck the ship clock first, then choose a backup that still fits the remaining window."
      bullets={[
        "Confirm the operator's cancellation or rebooking status before buying a replacement activity.",
        "Recalculate from the current time to your ship's all-aboard time, including transportation and a return margin.",
        "Whale watching can be a strong Alaska pivot when marine conditions remain suitable.",
        "Mendenhall-area sightseeing or a shorter Juneau city option can work when the remaining port window is tighter.",
        "Use live provider pages for current departures, pickup details, weather status, prices, and final terms.",
      ]}
      ctaHref="/juneau-whale-watching-tours"
      ctaLabel="Compare whale backup"
    />
  );
}
