import type { Metadata } from "next";
import DecisionComparison from "../DecisionComparison";

export const metadata: Metadata = {
  title: "Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS",
  description: "Compare the Steamboat NATCHEZ and Riverboat CITY of NEW ORLEANS by cruise length, jazz, narration, meal options and vessel experience.",
  alternates: { canonical: "/compare/natchez-vs-city-of-new-orleans-riverboat" },
};

export default function NatchezVsCityPage() {
  return (
    <DecisionComparison
      eyebrow="Mississippi River cruise guide"
      title="Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS: What's the Difference?"
      intro="These are sister vessels operated by the New Orleans Steamboat Company, but they are not the same cruise product. NATCHEZ is the classic steamboat experience used for many jazz cruises, while CITY of NEW ORLEANS is a newer four-deck riverboat with daily 75-minute sightseeing cruises plus selected jazz, dinner and brunch sailings."
      verdict="Pick NATCHEZ when the classic steamboat identity and a two-hour jazz-cruise format are part of what you want. Pick CITY of NEW ORLEANS when you want the shorter 75-minute sightseeing option or one of its specifically scheduled jazz, dinner or Saturday brunch cruises. Always book the exact named vessel/product shown for your date."
      left={{
        heading: "Steamboat NATCHEZ",
        href: "/tours/daytime-jazz-cruise",
        cta: "View NATCHEZ cruises",
      }}
      right={{
        heading: "CITY of NEW ORLEANS",
        href: "/tours/city-of-new-orleans-riverboat-cruise",
        cta: "View CITY cruises",
      }}
      rows={[
        { label: "Vessel identity", left: "Historic-style Steamboat NATCHEZ", right: "Riverboat CITY of NEW ORLEANS, sister vessel to NATCHEZ" },
        { label: "Core sightseeing format", left: "Daytime and evening jazz-cruise products are commonly listed as 2-hour cruises", right: "Daily 75-minute sightseeing cruise is a core published product" },
        { label: "Live jazz", left: "Yes on published daytime and evening jazz cruises", right: "Available on selected evening and Saturday cruise products; the daily 75-minute sightseeing cruise emphasizes Captain's narration" },
        { label: "Narration", left: "Sightseeing/jazz products include river views and operator interpretation depending on sailing", right: "75-minute sightseeing cruise specifically advertises live Captain's narration" },
        { label: "Meal options", left: "Lunch and dinner upgrades/products are published", right: "Dinner and Saturday brunch products are published in addition to sightseeing" },
        { label: "Published sightseeing length", left: "Many NATCHEZ jazz cruise products are listed at 2 hours", right: "75 minutes for the daily sightseeing cruise" },
        { label: "Departure area", left: "400 Toulouse St. riverfront area", right: "400 Toulouse St. riverfront area" },
        { label: "Best reason to choose it", left: "You specifically want the NATCHEZ steamboat identity and jazz-cruise experience", right: "You want a shorter sightseeing cruise or a CITY-specific scheduled cruise" },
      ]}
      bestFit={{
        left: [
          "The classic Steamboat NATCHEZ is part of the experience you are choosing",
          "You want a published daytime or evening jazz-cruise format",
          "A roughly two-hour river cruise fits your schedule",
        ],
        right: [
          "You want the shortest current sightseeing option: 75 minutes",
          "You value live Captain's narration on the sightseeing sailing",
          "Your date or preferred dinner/brunch sailing is specifically aboard CITY of NEW ORLEANS",
        ],
      }}
      cautions={[
        "Do not assume a generic 'riverboat cruise' means NATCHEZ; confirm the named vessel in the booking product.",
        "Cruise schedules, vessel assignments and meal products can vary by date, so the live checkout is the final authority.",
        "The CITY sightseeing cruise and CITY jazz/dinner/brunch products have different durations; do not treat them as one identical itinerary.",
        "NATCHEZ products also vary between sightseeing-only and meal-inclusive options.",
      ]}
      sources={[
        { label: "New Orleans Steamboat Company: CITY of NEW ORLEANS", href: "https://www.steamboatnatchez.com/riverboat-city-of-new-orleans.html" },
        { label: "New Orleans Steamboat Company cruise listings", href: "https://www.steamboatnatchez.com/" },
        { label: "Gray Line New Orleans riverboat listings", href: "https://www.graylineneworleans.com/" },
      ]}
      verifiedDate="August 9, 2026"
    />
  );
}
