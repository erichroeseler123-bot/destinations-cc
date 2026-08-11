import type { Metadata } from "next";
import { VegasDecisionPage } from "../../components/VegasDecisionPage";

export const metadata: Metadata = {
  title: "Grand Canyon vs Hoover Dam From Las Vegas | Save On The Strip",
  description: "Compare a Grand Canyon day trip with Hoover Dam before spending one of your limited Vegas days.",
  alternates: { canonical: "https://saveonthestrip.com/compare/grand-canyon-vs-hoover-dam" },
};

export default function Page() {
  return <VegasDecisionPage eyebrow="Vegas day-trip comparison" title="Grand Canyon or Hoover Dam?" lead="The real tradeoff is scale versus time." verdict="Choose Grand Canyon when the trip needs one unforgettable all-in outing. Choose Hoover Dam when you want a major landmark without sacrificing as much of the Vegas day." sections={[
    { title: "Grand Canyon", body: "Bigger payoff, usually bigger time commitment. Best when the canyon itself is a trip priority and you are comfortable giving it most of a day." },
    { title: "Hoover Dam", body: "Easier to fit around a Vegas stay. Strong choice when you want a substantial off-Strip experience but still want energy left for the evening." },
    { title: "The decision test", body: "Ask whether you would regret missing the Grand Canyon more than you would regret losing a large part of a Vegas day.", links: [{ href: "/tours", label: "Compare Vegas tours" }, { href: "/worth-it", label: "Use the worth-it filter" }] },
  ]} />;
}
