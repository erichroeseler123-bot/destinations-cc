import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "Best New Orleans Swamp Tours With Transportation | Compare Options",
  description: "Compare New Orleans swamp tour formats and transportation details, including covered boats, airboats and swamp-plus-plantation combinations.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="Swamp tours with transportation"
    title="Compare New Orleans swamp tours when transportation matters"
    intro="A swamp tour is not just a boat choice. For many visitors, pickup, travel time, boat format and the total length of the outing matter just as much. Use this page to compare the participating options before checking live operator details."
    decisionTitle="Start with the ride you actually want"
    decisionPoints={[
      "Choose a covered boat if your group prefers a calmer, shaded format.",
      "Choose an airboat if your group wants a faster, open-air experience.",
      "If transportation is essential, verify the current pickup option and pickup zone during checkout before purchasing.",
      "For a longer day, compare a swamp-and-plantation combination instead of booking two separate outings."
    ]}
    productSlugs={["covered-tour-boat", "ragin-cajun-airboat-options", "covered-boat-plantation-combo", "swamp-boat-oak-alley-combo"]}
    relatedLinks={[
      { href: "/compare/covered-swamp-boat-vs-airboat", label: "Covered boat vs. airboat" },
      { href: "/compare/swamp-tour-with-vs-without-transportation", label: "Compare transportation formats" },
      { href: "/guides/how-long-does-a-swamp-tour-take", label: "How long does a swamp tour take?" }
    ]}
  />;
}
