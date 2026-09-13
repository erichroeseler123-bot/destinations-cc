import type { Metadata } from "next";
import DecisionComparison from "../DecisionComparison";

export const metadata: Metadata = {
  title: "Small vs Large Airboat Tours in New Orleans: What Changes?",
  description: "Compare Gray Line New Orleans small and large airboat tours by capacity, price, duration, age rules, transportation and ride format before you book.",
  alternates: { canonical: "/compare/small-vs-large-airboat" },
};

export default function SmallVsLargeAirboatPage() {
  return (
    <DecisionComparison
      eyebrow="Airboat decision guide"
      title="Small vs Large Airboat Tours in New Orleans: What Actually Changes?"
      intro="Both Gray Line airboat options use the same 3-hour-45-minute transported-tour format and advertise speeds up to 40 mph. The biggest published differences are boat capacity and current price, which can meaningfully change how intimate the ride feels."
      verdict="Choose the small airboat if a smaller passenger group matters enough to justify the higher fare. Choose the large airboat if you want the same published duration, transportation, minimum age and high-speed format at a lower current price."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Compare", href: "/compare" },
        { label: "Small vs Large Airboat", href: "/compare/small-vs-large-airboat" },
      ]}
      topCards={{
        left: {
          heading: "Small Airboat Adventure",
          badge: "6–12 Passengers",
          operator: "Gray Line New Orleans",
          duration: "3h 45m total (transport included)",
          transportation: "Round-trip pickup from 400 Toulouse St included",
          historicalFocus: "Fast bayou cruising & close-up marsh access",
          walkingMobility: "Ages 5+; not wheelchair/stroller accessible",
          priceContext: "Listed at $119 per passenger",
          href: "/tours/small-airboat-swamp-adventure",
          ctaText: "Book Small Airboat",
        },
        right: {
          heading: "Large Airboat Adventure",
          badge: "15–27 Passengers",
          operator: "Gray Line New Orleans",
          duration: "3h 45m total (transport included)",
          transportation: "Round-trip pickup from 400 Toulouse St included",
          historicalFocus: "High-speed airboat thrill at lower fare",
          walkingMobility: "Ages 5+; not wheelchair/stroller accessible",
          priceContext: "Listed at $90 per passenger",
          href: "/tours/large-airboat-swamp-adventure",
          ctaText: "Book Large Airboat",
        },
      }}
      topSummaryRows={[
        { label: "Boat Capacity", left: "6–12 passengers", right: "15–27 passengers" },
        { label: "Current Listed Fare", left: "$119 per passenger", right: "$90 per passenger" },
        { label: "Total Duration", left: "3h 45m (shuttle included)", right: "3h 45m (shuttle included)" },
        { label: "Minimum Age", left: "5 years old", right: "5 years old" },
      ]}
      left={{
        heading: "Small Airboat",
        href: "/tours/small-airboat-swamp-adventure",
        cta: "View small airboat",
      }}
      right={{
        heading: "Large Airboat",
        href: "/tours/large-airboat-swamp-adventure",
        cta: "View large airboat",
      }}
      rows={[
        { label: "Published capacity", left: "6-12 passengers", right: "15-27 passengers" },
        { label: "Current listed price", left: "$119 per adult or child", right: "$90 per adult or child" },
        { label: "Minimum age", left: "5+", right: "5+" },
        { label: "Total listed duration", left: "3 hours 45 minutes", right: "3 hours 45 minutes" },
        { label: "Transportation", left: "Round-trip transportation included", right: "Round-trip transportation included" },
        { label: "Meeting point", left: "400 Toulouse St., New Orleans", right: "400 Toulouse St., New Orleans" },
        { label: "Speed / format", left: "High-speed airboat; operator advertises speeds up to 40 mph", right: "High-speed airboat; operator advertises speeds up to 40 mph" },
        { label: "Weather exposure", left: "Open-air; guests may get wet", right: "Open-air; guests may get wet" },
        { label: "Mobility / health cautions", left: "Not wheelchair or stroller accessible; not recommended for pregnancy or certain neck, back or heart conditions", right: "Same published cautions" },
      ]}
      bestFit={{
        left: [
          "You care about a smaller passenger group",
          "You are willing to pay more for the smaller-capacity format",
          "You want the more intimate of the two published Gray Line airboat options",
        ],
        right: [
          "Price matters more than having the smallest group",
          "You are comfortable with a 15-27 passenger airboat",
          "You want the same published duration, transportation and minimum age at a lower current fare",
        ],
      }}
      cautions={[
        "Small does not mean private: the operator lists 6-12 passengers.",
        "The large boat carries 15-27 passengers.",
        "Both tours are open-air, loud, high-speed rides and may be shortened, postponed or replaced with a covered-boat tour in inclement weather.",
        "Current prices can change; confirm the FareHarbor checkout before purchasing.",
        "Neither published option is wheelchair or stroller accessible, and both list health-related cautions.",
      ]}
      sources={[
        { label: "Gray Line: Small Airboat Swamp Adventure", href: "https://www.graylineneworleans.com/swamp-tours/small-airboat-swamp-adventure-tour/" },
        { label: "Gray Line: Large Airboat Swamp Adventure", href: "https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/" },
      ]}
      verifiedDate="August 9, 2026"
      faq={[
        {
          question: "Is the small airboat in New Orleans worth the extra cost?",
          answer: "If having an intimate group of 6 to 12 passengers matters to you, the small airboat gives everyone easier sightlines and quicker captain interaction. Both boats travel at the same speeds (up to 40 mph) and cover similar bayou waterways, so choose the large airboat if saving approximately $29 per ticket is preferred.",
        },
        {
          question: "How many passengers are on a small airboat vs a large airboat?",
          answer: "Small airboats hold between 6 and 12 passengers. Large airboats hold between 15 and 27 passengers.",
        },
        {
          question: "Can kids ride airboats in New Orleans?",
          answer: "The published minimum age for both Gray Line small and large airboat adventures is 5 years old. Children under 5 are not permitted on airboats due to noise and safety rules; families with toddlers or babies should choose a covered tour boat instead.",
        },
        {
          question: "Is round-trip transportation included for airboat tours?",
          answer: "Yes, both published Gray Line airboat tours include round-trip motorcoach transportation from 400 Toulouse Street in the French Quarter to the swamp launch site, taking approximately 3 hours and 45 minutes total.",
        },
      ]}
    />
  );
}
