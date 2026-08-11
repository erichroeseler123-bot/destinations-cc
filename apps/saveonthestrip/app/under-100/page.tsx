import type { Metadata } from "next";
import { VegasDecisionPage } from "../components/VegasDecisionPage";

export const metadata: Metadata = {
  title: "Best Things to Do in Las Vegas Under $100 | Save On The Strip",
  description: "Build a Vegas day or night under $100 without filling it with throwaway attractions.",
  alternates: { canonical: "https://saveonthestrip.com/under-100" },
};

export default function Page() {
  return <VegasDecisionPage eyebrow="Vegas under $100" title="Spend less without making Vegas feel cheap." lead="Use the budget on one thing that matters, then fill the gaps with free or low-friction Vegas." verdict="Start with one paid anchor. Do not spend $20 five different times on things you barely wanted." sections={[
    { title: "Best budget pattern", body: "Choose one show, attraction, meal, or experience you actually want. Surround it with Bellagio, Fremont, people-watching, hotel exploration, or another free reset.", links: [{ href: "/free-things", label: "Find free Vegas" }, { href: "/shows", label: "Compare shows" }] },
    { title: "Avoid fake savings", body: "A cheap ticket is not a deal if the location, fees, transportation, or time cost makes the experience worse." },
    { title: "Save the splurge for later", body: "If the trip already has one premium night, keep the next block simple. Vegas does not need to be expensive every hour.", links: [{ href: "/worth-it", label: "Use the worth-it filter" }] },
  ]} />;
}
