import type { Metadata } from "next";
import { VegasDecisionPage } from "../components/VegasDecisionPage";

export const metadata: Metadata = {
  title: "What to Skip in Las Vegas | Save On The Strip",
  description: "A practical Vegas skip list: avoid low-value spending, bad geography, and filler that eats your trip.",
  alternates: { canonical: "https://saveonthestrip.com/what-to-skip-in-las-vegas" },
};

export default function Page() {
  return <VegasDecisionPage eyebrow="Vegas skip list" title="Skip the stuff that steals time or money without improving the trip." lead="Vegas sells urgency extremely well. Your job is to separate real experiences from expensive filler." verdict="Skip anything you would not choose if the flashing sign, countdown timer, or street pitch disappeared." sections={[
    { title: "Skip bad geography", body: "Do not cross the valley twice for a mediocre attraction. Group plans by area and protect your evening energy." },
    { title: "Skip filler fees", body: "Look at the total cost, not the headline price. Fees, rideshare, parking, upgrades, and wasted time all count." },
    { title: "Skip panic booking", body: "If you do not know whether something is worth it, compare the experience first instead of buying because inventory looks urgent.", links: [{ href: "/worth-it", label: "Use the worth-it filter" }, { href: "/tonight", label: "Build tonight instead" }] },
  ]} />;
}
