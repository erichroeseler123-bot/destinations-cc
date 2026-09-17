import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "Combined Plantation & Swamp Tours New Orleans | Full-Day Excursions",
  description: "Compare full-day New Orleans combination tours pairing a Louisiana swamp boat cruise with Oak Alley or Whitney Plantation, including round-trip coach transportation.",
};

export default function Page() {
  return <IntentTourPage
    eyebrow="Plantation + Swamp Combos"
    title="Combined Plantation and Swamp Tours in New Orleans"
    intro="Combination tours allow you to experience two iconic Louisiana highlights—a guided bayou swamp boat cruise and a Great River Road plantation visit—in one seamlessly coordinated 7.5 to 8-hour day trip with round-trip transportation included."
    decisionTitle="How Combination Tours Work"
    decisionPoints={[
      "Morning Swamp & Afternoon Plantation: Tours depart downtown New Orleans in the morning for a swamp boat cruise, then continue directly to Oak Alley or Whitney Plantation.",
      "Coordinated Coach Transportation: Eliminates renting a car or driving between separate rural locations 50 miles outside New Orleans.",
      "Vessel Comfort: Features shaded, covered swamp boats suitable for all ages.",
      "Full-Day Schedule: Runs approximately 7.5 to 8 hours door-to-door, returning in the late afternoon."
    ]}
    productSlugs={["swamp-boat-oak-alley-combo", "swamp-boat-whitney-combo", "covered-boat-plantation-combo", "oak-alley-plantation-tour-grey-line", "whitney-plantation-tour"]}
    relatedLinks={[
      { href: "/compare/whitney-vs-oak-alley", label: "Whitney vs Oak Alley comparison" },
      { href: "/plantation-tours", label: "All plantation tours" },
      { href: "/swamp-tours", label: "All swamp tours" },
      { href: "/tours#combo-tours", label: "Browse combination tours" }
    ]}
  />;
}
