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
    />
  );
}
