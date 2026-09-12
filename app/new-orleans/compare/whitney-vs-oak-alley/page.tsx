import type { Metadata } from "next";
import DecisionComparison from "../DecisionComparison";

export const metadata: Metadata = {
  title: "Whitney Plantation vs Oak Alley: Which Tour Fits You? | Welcome to New Orleans Tours",
  description: "Whitney Plantation vs Oak Alley comparison: Compare duration (5h 25m), included New Orleans transportation, slavery history vs estate grounds, walking, accessibility, and booking options.",
  alternates: { canonical: "/compare/whitney-vs-oak-alley" },
  openGraph: {
    title: "Whitney Plantation vs Oak Alley: Which Tour Fits You? | Welcome to New Orleans Tours",
    description: "Compare Whitney Plantation vs Oak Alley Plantation tours from New Orleans: duration, included transportation, slavery history, accessibility, and booking choices.",
    url: "/compare/whitney-vs-oak-alley",
    type: "article",
  },
};

export default function WhitneyVsOakAlleyPage() {
  return (
    <DecisionComparison
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Compare", href: "/compare" },
        { label: "Whitney vs Oak Alley", href: "/compare/whitney-vs-oak-alley" },
      ]}
      eyebrow="Welcome to New Orleans Tours · Comparison Guide"
      title="Whitney Plantation vs Oak Alley: Which Tour Should You Book?"
      intro="Both excursions depart from central New Orleans (400 Toulouse St) with round-trip coach transportation included and take approximately 5 hours 25 minutes total. However, the experience and historical focus are completely different."
      verdict="Choose Whitney Plantation if your priority is Louisiana's only museum dedicated exclusively to the history of slavery, featuring first-person enslaved narratives, memorial artwork, and historic outbuildings on a self-paced audio tour. Choose Oak Alley Plantation if you want a broader historic-estate visit featuring the iconic 300-year-old oak allee, a guided Greek Revival Big House tour, reconstructed cabins, sugarcane exhibits, and on-site dining."
      topCards={{
        left: {
          heading: "Whitney Plantation Tour",
          badge: "Slavery Museum Focus",
          operator: "Gray Line New Orleans",
          duration: "5 hours 25 minutes total (door-to-door)",
          transportation: "Round-trip coach included (departs 400 Toulouse St)",
          historicalFocus: "First-person narratives, memorial art, restored outbuildings, and slavery education",
          walkingMobility: "Self-paced audio tour; uneven gravel on grounds; museum & restrooms accessible",
          href: "/tours/whitney-plantation-tour",
          ctaText: "Book Whitney Tour →",
        },
        right: {
          heading: "Oak Alley Plantation Tour",
          badge: "Iconic Grounds & Big House",
          operator: "Gray Line New Orleans",
          duration: "5 hours 25 minutes total (door-to-door)",
          transportation: "Round-trip coach included (departs 400 Toulouse St)",
          historicalFocus: "Historic plantation landscape, Big House, slavery exhibits, sugarcane history & gardens",
          walkingMobility: "Guided Big House tour; mostly paved pathways; 22 stairs to 2nd floor (video alternative)",
          href: "/tours/oak-alley-plantation-tour-grey-line",
          ctaText: "Book Oak Alley Tour →",
        },
      }}
      topSummaryRows={[
        {
          label: "Duration",
          left: "5 hours 25 minutes total",
          right: "5 hours 25 minutes total",
        },
        {
          label: "Transportation",
          left: "Round-trip coach included from 400 Toulouse St",
          right: "Round-trip coach included from 400 Toulouse St",
        },
        {
          label: "Historical Focus",
          left: "Exclusively centered on the history of slavery, first-person narratives & memorials",
          right: "Broader historic estate, Greek Revival Big House, 300-year oaks & slavery exhibits",
        },
        {
          label: "Walking & Mobility",
          left: "Uneven gravel grounds; self-paced audio; museum is wheelchair accessible",
          right: "Paved pathways; 22 stairs to Big House second floor (video alternative available)",
        },
        {
          label: "Booking Choices",
          left: "Verified live Gray Line inventory via Welcome to New Orleans Tours",
          right: "Verified live Gray Line inventory via Welcome to New Orleans Tours",
        },
      ]}
      left={{ heading: "Whitney Plantation", href: "/tours/whitney-plantation-tour", cta: "Book Whitney Tour" }}
      right={{ heading: "Oak Alley", href: "/tours/oak-alley-plantation-tour-grey-line", cta: "Book Oak Alley Tour" }}
      rows={[
        { label: "Published duration", left: "5 hours 25 minutes", right: "5 hours 25 minutes" },
        { label: "Transportation", left: "Round-trip coach from 400 Toulouse St included", right: "Round-trip coach from 400 Toulouse St included" },
        { label: "Primary focus", left: "Slavery history, first-person narratives, memorial art, restored buildings and museum exhibits", right: "Historic plantation landscape, Big House, slavery exhibit, reconstructed cabins, sugarcane history, gardens and blacksmithing" },
        { label: "Tour format", left: "Self-paced audio tour", right: "Guided Big House visit plus self-paced grounds and exhibits" },
        { label: "Walking", left: "Grounds include uneven gravel paths", right: "Walking is integral; paved pathways are available throughout much of the property" },
        { label: "Mobility note", left: "Grounds, gift shop, restrooms and museum are accessible; some historic structures cannot be entered by wheelchair users", right: "Most exhibits are accessible; the second floor of the Big House requires 22 stairs, with a video alternative available" },
        { label: "Food on site", left: "Food and drinks are not included", right: "Restaurant, café and bar are available on site" },
        { label: "Best fit", left: "Visitors who want the strongest slavery-centered historical interpretation", right: "Visitors who want a broader historic-estate experience with architecture, grounds and multiple exhibits" },
      ]}
      bestFit={{
        left: ["You want slavery history to be the central subject, not a side exhibit.", "You prefer a self-paced museum-style experience.", "First-person narratives, memorials and restored outbuildings matter most to you."],
        right: ["You want to see the famous oak allee and Greek Revival Big House.", "You like a mix of guided interpretation and time to explore exhibits on your own.", "You want gardens, sugarcane history, reconstructed cabins and additional property exhibits in one visit."],
      }}
      cautions={[
        "Both tours require a significant time commitment outside central New Orleans (approx. 5.5 hours total).",
        "Whitney's gravel paths can matter for travelers with mobility limitations.",
        "Oak Alley's second-floor Big House area requires stairs, though a video alternative is provided for guests who cannot climb them.",
        "Schedules, policies and accessibility details can change; confirm the live operator details before checkout.",
      ]}
      faq={[
        { question: "Is Whitney Plantation better than Oak Alley for learning about slavery?", answer: "Whitney is the stronger fit when slavery history, first-person narratives and memorial interpretation are your main priority. Oak Alley includes slavery interpretation too, but the overall visit also emphasizes the Big House, grounds and broader estate history." },
        { question: "Which plantation is better for architecture and scenery?", answer: "Oak Alley is the stronger fit if the oak-lined approach, Greek Revival Big House, gardens and historic-estate setting are central to what you want from the visit." },
        { question: "Can I visit Whitney and Oak Alley in the same short New Orleans stay?", answer: "Possibly, but each is a substantial out-of-city time commitment. If your trip is short, pick the property that best matches your historical interest rather than sacrificing most of two days to transportation and repeated plantation outings." },
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
