import type { Metadata } from "next";
import DecisionComparison from "../DecisionComparison";

export const metadata: Metadata = {
  title: "Whitney Plantation vs Oak Alley: Which New Orleans Tour Fits You?",
  description: "Compare Whitney Plantation and Oak Alley from New Orleans by history focus, tour format, walking, accessibility, duration and overall fit before you book.",
  alternates: { canonical: "/compare/whitney-vs-oak-alley" },
  openGraph: {
    title: "Whitney Plantation vs Oak Alley: Which Tour Fits You?",
    description: "A practical side-by-side comparison of Whitney Plantation and Oak Alley tours from New Orleans.",
    url: "/compare/whitney-vs-oak-alley",
    type: "article",
  },
};

export default function WhitneyVsOakAlleyPage() {
  return (
    <DecisionComparison
      eyebrow="New Orleans tour comparison"
      title="Whitney Plantation vs Oak Alley: which one should you visit?"
      intro="Both tours leave New Orleans for a roughly five-and-a-half-hour plantation visit, but the experiences are meaningfully different. Whitney is centered on the history of slavery through a self-paced audio experience, memorials and first-person narratives. Oak Alley combines slavery interpretation with a guided Big House visit, reconstructed cabins, sugarcane exhibits, gardens and the famous oak allee."
      verdict="Choose Whitney if your priority is a slavery-focused museum experience built around the lives and testimony of enslaved people. Choose Oak Alley if you want a broader historic-property visit with a guided Big House component, grounds, exhibits and the iconic oak-lined approach."
      left={{
        heading: "Whitney Plantation",
        href: "/tours/whitney-plantation-tour",
        cta: "View Whitney tour",
      }}
      right={{
        heading: "Oak Alley",
        href: "/tours/oak-alley-plantation-tour-grey-line",
        cta: "View Oak Alley tour",
      }}
      rows={[
        { label: "Published duration", left: "5 hours 25 minutes", right: "5 hours 25 minutes" },
        { label: "Transportation", left: "Round-trip transportation from New Orleans is included", right: "Round-trip transportation from New Orleans is included" },
        { label: "Primary focus", left: "Slavery history, first-person narratives, memorial art, restored buildings and museum exhibits", right: "Historic plantation landscape, Big House, slavery exhibit, reconstructed cabins, sugarcane history, gardens and blacksmithing" },
        { label: "Tour format", left: "Self-paced audio tour", right: "Guided Big House visit plus self-paced grounds and exhibits" },
        { label: "Walking", left: "Grounds include uneven gravel paths", right: "Walking is integral; paved pathways are available throughout much of the property" },
        { label: "Mobility note", left: "Grounds, gift shop, restrooms and museum are accessible; some historic structures cannot be entered by wheelchair users", right: "Most exhibits are accessible; the second floor of the Big House requires 22 stairs, with a video alternative available" },
        { label: "Food on site", left: "Food and drinks are not included", right: "Restaurant, café and bar are available on site" },
        { label: "Best fit", left: "Visitors who want the strongest slavery-centered historical interpretation", right: "Visitors who want a broader historic-estate experience with architecture, grounds and multiple exhibits" },
      ]}
      bestFit={{
        left: [
          "You want slavery history to be the central subject, not a side exhibit.",
          "You prefer a self-paced museum-style experience.",
          "First-person narratives, memorials and restored outbuildings matter most to you.",
        ],
        right: [
          "You want to see the famous oak allee and Greek Revival Big House.",
          "You like a mix of guided interpretation and time to explore exhibits on your own.",
          "You want gardens, sugarcane history, reconstructed cabins and additional property exhibits in one visit.",
        ],
      }}
      cautions={[
        "Both tours require a significant time commitment outside central New Orleans.",
        "Whitney's gravel paths can matter for travelers with mobility limitations.",
        "Oak Alley's second-floor Big House area requires stairs, though a video alternative is provided for guests who cannot climb them.",
        "Schedules, policies and accessibility details can change; confirm the live operator details before checkout.",
      ]}
      sources={[
        { label: "Gray Line: Whitney Plantation", href: "https://www.graylineneworleans.com/all/swamp-and-bayou-tour/whitney-plantation-tour/" },
        { label: "Gray Line: Oak Alley Plantation", href: "https://www.graylineneworleans.com/plantation-tours/oak-alley-plantation-tour/" },
        { label: "Gray Line: Plantation tours", href: "https://www.graylineneworleans.com/plantation-tours/" },
      ]}
      verifiedDate="August 9, 2026"
    />
  );
}
