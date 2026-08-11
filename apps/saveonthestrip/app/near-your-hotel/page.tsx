import type { Metadata } from "next";
import { VegasDecisionPage } from "../components/VegasDecisionPage";

export const metadata: Metadata = {
  title: "Things to Do Near Your Las Vegas Hotel | Save On The Strip",
  description: "Plan Las Vegas by hotel area so you spend less time crossing the Strip and more time actually doing things.",
  alternates: { canonical: "https://saveonthestrip.com/near-your-hotel" },
};

export default function Page() {
  return <VegasDecisionPage eyebrow="Near your hotel" title="Plan Vegas by geography, not by wish list." lead="The Strip is longer and slower than it looks. Start near where you are staying and only cross town when the experience is worth the move." verdict="Build one local cluster first. Make the second neighborhood earn the rideshare." sections={[
    { title: "Central Strip", body: "Bellagio, Caesars Palace, Paris, LINQ, Flamingo, Cosmopolitan and nearby properties can support a full block without constant transportation.", links: [{ href: "/free-things", label: "Free Vegas" }, { href: "/shows", label: "Shows" }] },
    { title: "South Strip", body: "MGM Grand, New York-New York, Park MGM, Excalibur, Luxor and Mandalay Bay work better as a southern cluster than as separate missions." },
    { title: "Downtown / Fremont", body: "Treat Fremont as its own Vegas zone. Go there intentionally rather than trying to weave it into a tightly timed Strip night.", links: [{ href: "/four-hours-in-vegas", label: "Four-hour plan" }] },
  ]} />;
}
