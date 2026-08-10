import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "New Orleans Tours With Transportation | Compare Pickup & Riding Options",
  description: "Compare New Orleans tours where transportation, pickup or riding format matters, including city sightseeing, swamp tours and longer regional excursions.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="Transportation matters"
    title="New Orleans tours when you do not want to figure out every ride yourself"
    intro="Transportation can be the deciding factor between two otherwise similar tours. Some experiences are riding-focused, some offer pickup options, and others require you to confirm transportation directly with the operator. Start by comparing the format, then verify the current details in checkout."
    decisionTitle="Check transportation before you check out"
    decisionPoints={[
      "A riding-focused city tour can simplify sightseeing when your group does not want a walking-heavy day.",
      "For swamp and plantation outings, verify current pickup availability, pickup zones and return timing before purchasing.",
      "Do not assume hotel pickup applies everywhere simply because transportation is offered on a particular departure.",
      "For combination tours, transportation can reduce the coordination burden of fitting multiple experiences into one day."
    ]}
    productSlugs={["city-tour-of-new-orleans", "covered-tour-boat", "oak-alley-or-laura-plantation-tour", "covered-boat-plantation-combo"]}
    relatedLinks={[
      { href: "/best-swamp-tour-with-transportation", label: "Swamp tours with transportation" },
      { href: "/compare/swamp-tour-with-vs-without-transportation", label: "Swamp transportation comparison" },
      { href: "/help-me-choose", label: "Help me choose" }
    ]}
  />;
}
