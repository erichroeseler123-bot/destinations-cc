import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "Things to Do in New Orleans After a Cruise | Tour Options",
  description: "Compare New Orleans tours for a post-cruise day, from city sightseeing and river cruises to swamp and plantation excursions when you have more time.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="After your cruise"
    title="Things to do in New Orleans after a cruise"
    intro="A post-cruise stay gives you more freedom than embarkation day because you are not working backward from a ship departure. Use the time you have left in New Orleans to choose one city experience or, with a full day, a longer Louisiana excursion."
    decisionTitle="Match the tour to your departure day"
    decisionPoints={[
      "If you fly home later the same day, protect time for luggage, airport transportation and check-in.",
      "With an overnight stay, city sightseeing, river cruises and evening tours are easier to combine.",
      "With a full extra day, swamp, plantation or combination outings become more realistic choices.",
      "Check live operator schedules before building the rest of your post-cruise day around a tour."
    ]}
    productSlugs={["city-tour-of-new-orleans", "daytime-jazz-cruise", "covered-tour-boat", "oak-alley-or-laura-plantation-tour"]}
    relatedLinks={[
      { href: "/best-swamp-tour-with-transportation", label: "Compare swamp tours" },
      { href: "/first-time-new-orleans-tours", label: "First time in New Orleans" },
      { href: "/help-me-choose", label: "Help me choose" }
    ]}
    faq={[
      { question: "What should I do in New Orleans after getting off a cruise?", answer: "If you only have the hours before a flight, choose a city-based experience with a predictable end time. If you are staying overnight or have a full extra day, river, swamp and plantation options become much easier to plan around." },
      { question: "Can I do a swamp tour after a cruise and still catch a flight?", answer: "Only when your flight is late enough to leave a large buffer for the full tour, return traffic, luggage and airport check-in. Do not judge the fit by boat time alone; use the full door-to-door commitment." },
      { question: "Where should I put my luggage after a New Orleans cruise?", answer: "Luggage arrangements depend on your hotel, transportation provider or storage service. Resolve that before booking a timed tour so bag handling does not become the reason you miss a departure or flight." },
    ]}
  />;
}
