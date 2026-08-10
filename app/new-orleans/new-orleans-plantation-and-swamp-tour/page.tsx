import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "New Orleans Plantation and Swamp Tours | Compare Combo Options",
  description: "Compare New Orleans plantation and swamp combination tours, including covered-boat and Oak Alley or Laura Plantation options with operator-confirmed logistics.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="Plantation + swamp"
    title="Want a plantation and swamp tour in the same day?"
    intro="Combination tours can make sense when you want to see more of Louisiana beyond New Orleans without coordinating two separate operators. The tradeoff is a longer day, so compare total duration, transportation and the historic-site option before booking."
    decisionTitle="Make sure the full-day format fits"
    decisionPoints={[
      "Expect a substantially longer outing than a standalone city or river tour.",
      "Compare covered-boat and other swamp formats based on comfort and intensity, not just price.",
      "The available plantation site and historical program should be confirmed in the operator's current booking details.",
      "Review pickup, return timing and live availability before making dinner or evening plans around the tour."
    ]}
    productSlugs={["covered-boat-plantation-combo", "swamp-boat-oak-alley-combo", "oak-alley-or-laura-plantation-tour", "covered-tour-boat"]}
    relatedLinks={[
      { href: "/best-swamp-tour-with-transportation", label: "Compare swamp transportation" },
      { href: "/plantation-tours", label: "Plantation tours" },
      { href: "/tours#combo-tours", label: "All combo tours" }
    ]}
  />;
}
