import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "New Orleans Tours for Families | Compare Family-Friendly Formats",
  description: "Compare New Orleans tour formats for families, from city sightseeing and covered swamp boats to river cruises and longer day trips.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="New Orleans with family"
    title="New Orleans tours for families who want an easier day"
    intro="The right family tour usually comes down to pace, time available, riding versus walking, weather exposure and the ages in your group. These participating options give you a useful starting point without pretending every tour fits every family."
    decisionTitle="Pick the format before the attraction"
    decisionPoints={[
      "A riding-focused city overview can be easier for groups that want context without spending the whole outing on foot.",
      "A covered swamp boat is often a calmer option for groups prioritizing shade and a lower-intensity format.",
      "For younger travelers, verify age rules and child eligibility directly in the operator checkout.",
      "Long plantation or combination outings are better for families comfortable committing most of a day."
    ]}
    productSlugs={["city-tour-of-new-orleans", "covered-tour-boat", "daytime-jazz-cruise", "oak-alley-or-laura-plantation-tour"]}
    relatedLinks={[
      { href: "/help-me-choose", label: "Help me choose for my group" },
      { href: "/things-to-do-in-new-orleans-today", label: "Things to do today" },
      { href: "/tours", label: "Browse all tours" }
    ]}
  />;
}
