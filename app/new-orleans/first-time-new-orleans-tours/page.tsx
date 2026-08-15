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
    faq={[
      { question: "What tour should a first-time visitor do first in New Orleans?", answer: "A city overview is usually the strongest first move when you want context for neighborhoods, history and landmarks before exploring on your own. If your main priority is the Mississippi or the wetlands, use that priority instead of forcing a city tour into the plan." },
      { question: "Can I do two major New Orleans tours in one day?", answer: "Sometimes, but only when the departure times, travel time and return windows actually fit. A city experience plus an evening river cruise can be easier to combine than two out-of-city excursions." },
      { question: "Should a first-time visitor choose a swamp tour or a plantation tour?", answer: "Choose the swamp when the wetlands and boat experience are the draw. Choose a plantation visit when historical interpretation is the stronger priority and you are comfortable giving more of the day to an out-of-city trip." },
    ]}
  />;
}
