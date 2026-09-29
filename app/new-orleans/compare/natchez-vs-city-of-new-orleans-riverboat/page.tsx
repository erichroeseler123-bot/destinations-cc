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
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Compare", href: "/compare" },
        { label: "NATCHEZ vs Riverboat CITY", href: "/compare/natchez-vs-city-of-new-orleans-riverboat" },
      ]}
      topSummaryHeading="Key Comparison: Steamboat NATCHEZ vs Riverboat CITY of NEW ORLEANS"
      topCards={{
        left: {
          heading: "Steamboat NATCHEZ Jazz Cruise",
          badge: "Classic Steamboat & Jazz",
          operator: "New Orleans Steamboat Company",
          duration: "2-hour Mississippi River cruise",
          transportation: "Departs Toulouse St Wharf (400 Toulouse St, French Quarter)",
          historicalFocus: "Live Duke Heitger Steamboat Stompers Jazz band & historic steam sternwheeler",
          walkingMobility: "Boarding ramps accommodate standard wheelchairs to main deck and dining rooms; top hurricane deck access is by marine stairs only",
          priceContext: "$44.00 flat rate per adult (daytime sightseeing ticket); optional Creole lunch buffet upgrade available ($58 evening jazz / $105 dinner cruise also available)",
          ticketType: "Sightseeing-only adult cruise ticket (dining upgrades optional)",
          inclusions: "2-hour Mississippi River cruise, live Duke Heitger jazz trio, steam calliope concert",
          meetingPoint: "400 Toulouse St (behind Jax Brewery, French Quarter)",
          cancellationPolicy: "Non-refundable once booked per operator passenger contract terms",
          href: "/tours/daytime-jazz-cruise",
          ctaText: "Book NATCHEZ Daytime Cruise ($44)",
        },
        right: {
          heading: "Riverboat CITY of NEW ORLEANS",
          badge: "75-Min River Cruise",
          operator: "New Orleans Steamboat Company",
          duration: "75 minutes (daily daytime sightseeing; 2h for dinner/brunch)",
          transportation: "Departs Toulouse St Wharf (400 Toulouse St, French Quarter)",
          historicalFocus: "Live Captain's narration & modern 4-deck skyline viewing",
          walkingMobility: "Boarding ramp; 4 climate-controlled decks with elevator access between decks",
          priceContext: "$25.75 flat rate per adult ($12.75 child ages 6–12, free ages 2–5; 75-minute daytime sightseeing)",
          ticketType: "Sightseeing-only 75-minute excursion ticket",
          inclusions: "75-minute Mississippi River cruise, live Captain narration, panoramic skyline views",
          meetingPoint: "400 Toulouse St (behind Jax Brewery, French Quarter)",
          cancellationPolicy: "Non-refundable once booked per operator passenger contract terms",
          href: "/tours/city-of-new-orleans-riverboat-cruise",
          ctaText: "Book Riverboat CITY Cruise ($25.75)",
        },
      }}
      topSummaryRows={[
        { label: "Cruise Duration", left: "2 hours", right: "75 minutes (sightseeing)" },
        { label: "Pricing Format", left: "$44.00 flat rate adult (sightseeing; $58 evening)", right: "$25.75 flat rate adult ($12.75 child 6–12, free under 6)" },
        { label: "Live Jazz Music", left: "Yes (Steamboat Stompers Jazz trio on all cruises)", right: "Captain narration on 75-min cruise (live jazz on dinner/brunch)" },
        { label: "Vessel Type", left: "Authentic steam-powered sternwheeler", right: "Modern 4-deck paddlewheel excursion vessel (with elevator)" },
        { label: "Boarding Location", left: "Toulouse St. Wharf (400 Toulouse St)", right: "Toulouse St. Wharf (400 Toulouse St)" },
        { label: "Cancellation Policy", left: "Strictly non-refundable once booked per operator terms", right: "Strictly non-refundable once booked per operator terms" },
      ]}
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
      faq={[
        {
          question: "What is the difference between Steamboat NATCHEZ and Riverboat CITY of NEW ORLEANS?",
          answer: "Steamboat NATCHEZ is the authentic historic-style sternwheeler best known for its 2-hour daytime and evening live jazz cruises. Riverboat CITY of NEW ORLEANS is its modern four-deck sister vessel offering convenient 75-minute sightseeing cruises with live Captain's narration, as well as selected evening dinner and weekend brunch cruises.",
        },
        {
          question: "Which riverboat has live jazz in New Orleans?",
          answer: "Steamboat NATCHEZ features live jazz from the Duke Heitger Steamboat Stompers on both daytime and evening jazz cruises. Riverboat CITY of NEW ORLEANS features live jazz on its evening dinner and Saturday brunch sailings, while its daily 75-minute daytime sightseeing cruise focuses on Captain's narration.",
        },
        {
          question: "Where do the riverboats depart from in New Orleans?",
          answer: "Both Steamboat NATCHEZ and Riverboat CITY of NEW ORLEANS depart from the Toulouse Street Wharf at 400 Toulouse Street, directly behind Jax Brewery in the French Quarter.",
        },
        {
          question: "Can I take a riverboat cruise without booking a meal?",
          answer: "Yes, both vessels offer sightseeing-only cruise tickets without a meal, as well as upgraded meal-inclusive options with Creole dining.",
        },
      ]}
    />
  );
}
