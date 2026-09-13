import type { Metadata } from "next";
import DecisionComparison from "../DecisionComparison";

export const metadata: Metadata = {
  title: "Covered Swamp Boat vs Airboat in New Orleans: Which Tour Fits You?",
  description:
    "Compare New Orleans covered swamp boats vs airboats: noise levels, shade, speed, age restrictions, passenger capacity, weather protection, and verified booking options.",
  alternates: { canonical: "/compare/covered-swamp-boat-vs-airboat" },
  openGraph: {
    title: "Covered Swamp Boat vs Airboat in New Orleans: Which Tour Fits You?",
    description:
      "Compare New Orleans covered swamp boats vs airboats: noise, shade, speed, child safety, health restrictions, and live booking options.",
    url: "/compare/covered-swamp-boat-vs-airboat",
    type: "article",
  },
};

export default function CoveredBoatVsAirboatPage() {
  return (
    <DecisionComparison
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Compare", href: "/compare" },
        { label: "Covered Boat vs Airboat", href: "/compare/covered-swamp-boat-vs-airboat" },
      ]}
      eyebrow="Welcome to New Orleans Tours · Swamp Decision Guide"
      title="Covered Swamp Boat vs Airboat: Which Tour Should You Book?"
      intro="The single most important decision when booking a New Orleans swamp tour is the boat format. Covered tour boats provide continuous shade, stability, a calm pace, and conversational narration suitable for all ages. Airboats deliver a fast, loud, exhilarating ride across shallow coastal marsh with hearing protection required. Compare ride dynamics, eligibility restrictions, and travel logistics before you book."
      verdict="Choose a covered swamp boat if you are traveling with children under 5, grandparents, pregnant guests, or visitors with neck or back conditions, or if your priority is relaxed photography and shaded comfort. Choose an airboat if speed, open-air thrills, and deep marsh glides are your priority, and all passengers meet the 5+ age requirement with no health exclusions."
      topCards={{
        left: {
          heading: "Covered Swamp Tour Boat",
          badge: "Calm, Shaded & Family Fit",
          operator: "Ragin Cajun Tours",
          duration: "Approx. 1.5–2 hrs on water (3.5–4 hrs with shuttle)",
          transportation: "Hotel pickup & return shuttle options available; confirmed at checkout",
          historicalFocus: "Bayou ecology, moss-draped cypress scenery, native wildlife, and local Cajun culture",
          walkingMobility: "Easy pontoon boarding; full canopy shade; comfortable bench seating",
          priceContext: "From $35 self-drive / $60 with shuttle (live dates & rates confirmed at checkout)",
          href: "/tours/covered-tour-boat?src=wtonot-detail-covered",
          ctaText: "Check Live Covered Boat Dates →",
        },
        right: {
          heading: "High-Speed Airboat Tour",
          badge: "Fast, Open-Air & Thrilling",
          operator: "Ragin Cajun Tours",
          duration: "Approx. 1 hr 45 min on water (3.5–4 hrs with shuttle)",
          transportation: "Round-trip hotel shuttle available or self-drive to dock",
          historicalFocus: "High-speed marsh glides, shallow bayous, gator sightings, and active thrill ride",
          walkingMobility: "Stadium-style tiered seating; hearing protection provided; not wheelchair accessible",
          priceContext: "Live rates and departure times confirmed at checkout",
          href: "/tours/ragin-cajun-airboat-options?src=wtonot-detail-airboat",
          ctaText: "Check Live Airboat Dates →",
        },
      }}
      topSummaryRows={[
        {
          label: "Ride Style & Speed",
          left: "Gentle, slow cruising; flat bottom ensures stable movement for photography and viewing",
          right: "High-speed glides up to 35–40 mph; thrilling turns and acceleration over shallow marshes",
        },
        {
          label: "Noise & Audio",
          left: "Quiet outboard motor; conversational guide narration without hearing protection",
          right: "Extremely loud aircraft engine; noise-canceling ear protection provided and required",
        },
        {
          label: "Sun & Weather Exposure",
          left: "Full overhead canopy provides reliable shade and shield against sudden Louisiana rain",
          right: "Completely open-air with zero overhead cover; sunscreen, sunglasses, and wind gear advised",
        },
        {
          label: "Age & Health Restrictions",
          left: "All ages welcome including infants and young children; accessible for mixed-generation groups",
          right: "Strict minimum age (5+); prohibited for pregnant guests or anyone with neck/back issues",
        },
        {
          label: "Wildlife Spotting",
          left: "Closer eye-level viewing from stable benches; guides gently maneuver near wildlife",
          right: "Accesses extremely shallow marsh and tidal flats where traditional boats cannot venture",
        },
      ]}
      left={{
        heading: "Covered Tour Boat",
        href: "/tours/covered-tour-boat?src=wtonot-detail-covered",
        cta: "Book Covered Boat",
      }}
      right={{
        heading: "Airboat Tour",
        href: "/tours/ragin-cajun-airboat-options?src=wtonot-detail-airboat",
        cta: "Book Airboat Tour",
      }}
      rows={[
        { label: "Vessel Type", left: "Covered flat-bottom pontoon excursion vessel", right: "Open-cockpit flat-bottom airboat with aircraft propeller" },
        { label: "Shaded Canopy", left: "Yes, full overhead cover", right: "None; full exposure to sun, wind, and spray" },
        { label: "Ear Protection", left: "Not required", right: "Mandatory; noise-canceling headsets provided" },
        { label: "Minimum Age", left: "No minimum age (infants allowed with parent)", right: "Strict minimum age 5 years" },
        { label: "Pregnancy / Back Cautions", left: "Gentle ride; generally comfortable", right: "Strictly prohibited by operators" },
        { label: "Water Time", left: "Approx. 90 to 120 minutes", right: "Approx. 90 to 105 minutes" },
        { label: "Transportation Option", left: "Round-trip hotel shuttle available or self-drive", right: "Round-trip hotel shuttle available or self-drive" },
        { label: "Pickup Window", left: "Confirmed at checkout (morning or afternoon departures)", right: "Confirmed at checkout (morning or afternoon departures)" },
      ]}
      bestFit={{
        left: [
          "You are traveling with infants, young children under 5, or seniors",
          "Someone in your group is pregnant or has neck/back concerns",
          "You want continuous shade during hot, sunny Louisiana days",
          "You want to take photos and chat without wearing loud ear protection",
          "You prefer a calm, informative nature cruise",
        ],
        right: [
          "You want adrenaline, high speed, and an exciting thrill ride",
          "Everyone in your party is at least 5 years old with no physical restrictions",
          "You want to skim across shallow marsh grasses inaccessible to larger boats",
          "You do not mind loud engine noise, wind, and occasional water spray",
        ],
      }}
      cautions={[
        "Airboat operators strictly enforce the 5-year minimum age rule; children under 5 will be turned away with no refund.",
        "Pregnant women and travelers with neck, back, or heart conditions must choose a covered boat.",
        "Wildlife sightings vary by season: alligators are most active from March through October when temperatures exceed 70°F.",
        "Weather can alter routes: operators may adjust departure times in the event of severe thunderstorms.",
        "Hotel pickup windows are established during checkout; confirm the exact departure time in your voucher.",
      ]}
      sources={[
        { label: "Ragin Cajun Swamp Tours Official Guidelines", href: "https://fareharbor.com/embeds/book/ragincajuntours/" },
        { label: "Louisiana Department of Wildlife & Fisheries: Swamp Ecology", href: "https://www.wlf.louisiana.gov/" },
        { label: "Welcome to New Orleans Tours: Swamp Planning Guide", href: "/guides/best-new-orleans-swamp-tour" },
      ]}
      verifiedDate="September 2026"
      faq={[
        {
          question: "Which swamp tour is better for seeing alligators: covered boat or airboat?",
          answer:
            "Both boat types navigate active alligator habitats in Louisiana bayous and marshlands. Alligator activity is determined primarily by water and air temperature rather than boat type. Between March and October when temperatures exceed 70°F, alligators are frequently active around both covered boats and airboats. In cooler winter months, alligators enter brumation and are less active regardless of boat choice.",
        },
        {
          question: "Can kids ride airboats in New Orleans?",
          answer:
            "Commercial airboat operators in New Orleans require children to be at least 5 years of age. For families with children under 5, a covered tour boat is the approved, safe, and comfortable option.",
        },
        {
          question: "Do I get wet on an airboat swamp tour?",
          answer:
            "Yes, spray is possible during high-speed turns and acceleration over open water and marsh. On covered tour boats, guests remain dry under the protective canopy.",
        },
        {
          question: "Do New Orleans swamp tours include transportation from French Quarter hotels?",
          answer:
            "Both covered boat and airboat tours offer optional round-trip transportation with designated pickup points. You can also choose the self-drive option if you have a rental vehicle. Pickup locations and departure times are confirmed at checkout.",
        },
      ]}
    />
  );
}
