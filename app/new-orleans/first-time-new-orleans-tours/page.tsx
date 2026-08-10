import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "Best New Orleans Tours for First-Time Visitors | Compare Options",
  description: "First trip to New Orleans? Compare city tours, river cruises, swamp tours and plantation excursions based on how much time you have and what you want to understand first.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="First trip to New Orleans"
    title="Best New Orleans tours for first-time visitors"
    intro="On a first visit, the biggest mistake is trying to do everything. Start with one experience that gives you context, then add a second experience that shows you a different side of the city or region."
    decisionTitle="A simple first-visit formula"
    decisionPoints={[
      "Start with a city overview if you want neighborhoods, history and landmarks in one introduction.",
      "Add a river cruise if you want an easy Mississippi River experience with a different perspective on the city.",
      "Choose a swamp tour when seeing Louisiana beyond the city matters more than fitting in another urban attraction.",
      "Choose a plantation excursion only if you have enough time for a longer historic-site outing outside New Orleans."
    ]}
    productSlugs={["city-tour-of-new-orleans", "daytime-jazz-cruise", "covered-tour-boat", "oak-alley-or-laura-plantation-tour"]}
    relatedLinks={[
      { href: "/tours-for/first-time-visitors", label: "First-time visitor guide" },
      { href: "/help-me-choose", label: "Help me choose" },
      { href: "/things-to-do-in-new-orleans-today", label: "Already here today?" }
    ]}
  />;
}
