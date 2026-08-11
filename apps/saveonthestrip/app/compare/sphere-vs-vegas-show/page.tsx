import type { Metadata } from "next";
import { VegasDecisionPage } from "../../components/VegasDecisionPage";

export const metadata: Metadata = {
  title: "Sphere vs a Traditional Las Vegas Show | Save On The Strip",
  description: "Compare the Sphere experience with a traditional Las Vegas show before you spend your premium-night budget.",
  alternates: { canonical: "https://saveonthestrip.com/compare/sphere-vs-vegas-show" },
};

export default function Page() {
  return <VegasDecisionPage eyebrow="Vegas comparison" title="Sphere or a traditional Vegas show?" lead="Both can justify a premium-night budget, but they solve different problems." verdict="Choose Sphere for spectacle and venue novelty. Choose a traditional show when the performer, comedy, magic, music, or production itself is the reason you are going." sections={[
    { title: "Pick Sphere when", body: "The building and immersive visual experience are part of the attraction, and you want something that feels uniquely current to Las Vegas.", links: [{ href: "/shows/sphere", label: "See Sphere options" }] },
    { title: "Pick a traditional show when", body: "You care more about the performer or format than the venue. Comedy, magic, residencies, and production shows can deliver a stronger entertainment match." },
    { title: "Budget test", body: "Compare the total ticket cost, seat quality, transportation, and what else you give up that night—not just the cheapest displayed ticket.", links: [{ href: "/shows", label: "Browse Vegas shows" }, { href: "/worth-it", label: "Use the worth-it filter" }] },
  ]} />;
}
