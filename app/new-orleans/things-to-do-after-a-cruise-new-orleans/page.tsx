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
  />;
}
