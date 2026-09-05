import IntentTourPage from "../../components/IntentTourPage";

export const metadata = {
  title: "Best New Orleans Swamp Tours: Compare Boat Types & Transportation",
  description: "Compare New Orleans swamp tours by covered boat or airboat, transportation, pace and group fit before checking live times and prices.",
  alternates: { canonical: "/guides/best-new-orleans-swamp-tour" },
};

export default function BestNewOrleansSwampTourGuide() {
  return (
    <IntentTourPage
      eyebrow="Best New Orleans swamp tours"
      title="The best New Orleans swamp tour depends on your group"
      intro="There is no single boat that is best for everyone. A covered boat is usually the easier fit for families and mixed-age groups; an airboat is the stronger choice when speed and an open-air ride are the priority. Compare the ride, transportation and total time before you book."
      decisionTitle="Choose the tour format first"
      decisionPoints={[
        "Best for families and mixed ages: start with a calmer covered tour boat with shade.",
        "Best for adventure: compare the available airboat formats for a faster, louder, open-air ride.",
        "Best without a rental car: confirm the current transportation or pickup option during checkout.",
        "Best for a full sightseeing day: consider a swamp-and-plantation combination instead of arranging two separate trips.",
        "Wildlife is never guaranteed. Season, temperature and conditions affect what you may see.",
      ]}
      productSlugs={[
        "covered-tour-boat",
        "ragin-cajun-airboat-options",
        "covered-boat-plantation-combo",
        "swamp-boat-oak-alley-combo",
      ]}
      relatedLinks={[
        { href: "/swamp-tours", label: "Browse all swamp tour formats" },
        { href: "/guides/best-swamp-tour-with-transportation", label: "Swamp tours with transportation" },
        { href: "/compare/covered-swamp-boat-vs-airboat", label: "Covered boat vs airboat" },
        { href: "/guides/how-long-does-a-swamp-tour-take", label: "How long does a swamp tour take?" },
      ]}
      faq={[
        {
          question: "Which New Orleans swamp tour is best for families?",
          answer: "A covered boat is usually the most comfortable starting point for families and mixed-age groups because the ride is calmer and shaded. Confirm child eligibility and current operator rules before booking.",
        },
        {
          question: "Should I choose an airboat or a covered swamp boat?",
          answer: "Choose an airboat for speed and an exposed, higher-energy ride. Choose a covered boat for shade, a calmer pace and easier conversation or photography.",
        },
        {
          question: "Do New Orleans swamp tours include transportation?",
          answer: "Some departures offer transportation and others may require self-driving. Check the selected option, pickup zone and total trip duration during booking.",
        },
      ]}
    />
  );
}
