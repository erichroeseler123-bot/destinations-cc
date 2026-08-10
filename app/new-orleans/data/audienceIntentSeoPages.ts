import type { IntentSeoLandingConfig } from "../components/IntentSeoLanding";

export type AudienceIntentSeoPage = {
  slug: string;
  title: string;
  description: string;
  config: IntentSeoLandingConfig;
};

export const AUDIENCE_INTENT_SEO_PAGES: AudienceIntentSeoPage[] = [
  {
    slug: "new-orleans-tours-for-couples",
    title: "New Orleans Tours for Couples | River, Cocktails & More",
    description: "Compare New Orleans tour ideas for couples including jazz cruises, cocktail walks and relaxed daytime experiences, then confirm current schedules and availability.",
    config: {
      eyebrow: "Couples planning",
      title: "New Orleans tours for couples who want an experience together",
      intro: "For couples, the best tour is usually the one that fits the mood you want for the trip: a river experience, cocktails and storytelling, a relaxed daytime plan or a broad city introduction. Start with the atmosphere, then confirm the operator's current schedule, age rules and availability.",
      decisionTitle: "Pick the mood before the tour",
      decisionPoints: [
        "Choose an evening jazz cruise when you want the experience itself to anchor the night.",
        "Choose a cocktail walking tour when drinks, local stories and a walking format fit the evening you want.",
        "Choose a daytime river cruise when you want a shared activity while keeping dinner and nightlife flexible afterward.",
        "Choose a city tour when you want to understand New Orleans together before deciding what neighborhoods or experiences to explore next."
      ],
      productSlugs: ["evening-jazz-cruise", "craft-cocktail-walking-tour", "daytime-jazz-cruise", "city-tour-of-new-orleans"],
      productHeading: "Couples-oriented options to compare",
      productIntro: "These options create different kinds of shared experiences. Confirm exact departure times, meal or drink inclusions, age requirements and live availability during booking.",
      relatedLinks: [
        { href: "/guides/daytime-vs-evening-jazz-cruise-new-orleans", label: "Daytime vs evening jazz cruise" },
        { href: "/guides/new-orleans-tours-tonight", label: "Tours tonight" },
        { href: "/guides/new-orleans-afternoon-tours", label: "Afternoon tour options" }
      ]
    }
  },
  {
    slug: "new-orleans-bachelorette-party-tours",
    title: "New Orleans Bachelorette Party Tours | Compare Group-Friendly Ideas",
    description: "Compare New Orleans bachelorette tour ideas including cocktails, ghosts, jazz cruises and swamp adventures, then confirm current group policies and availability.",
    config: {
      eyebrow: "Bachelorette planning",
      title: "New Orleans tour ideas for a bachelorette group",
      intro: "A bachelorette trip can go in very different directions: cocktails and nightlife, a haunted-history walk, a river evening or an adventurous swamp outing. Use the group's preferred energy level to narrow the list, then confirm capacity, age rules, timing and any group-booking requirements with the operator.",
      decisionTitle: "Choose the group's energy level",
      decisionPoints: [
        "A cocktail walking tour can fit groups that want drinks and storytelling in the same experience; verify age and participation rules before booking.",
        "A ghost and spirits tour can work when the group wants an evening activity centered on New Orleans stories and atmosphere.",
        "An evening jazz cruise can provide a more structured night with sightseeing and optional meal formats depending on the selected booking option.",
        "An airboat or swamp experience is a different choice for groups that want an outdoor adventure away from the nightlife focus."
      ],
      productSlugs: ["craft-cocktail-walking-tour", "ghosts-spirits-walking-tour", "evening-jazz-cruise", "ragin-cajun-airboat-options"],
      productHeading: "Bachelorette-trip options to check",
      productIntro: "These are starting points, not promises of private or exclusive group space. Confirm group-size limits, age requirements, departure times, transportation and live availability directly in booking.",
      relatedLinks: [
        { href: "/guides/new-orleans-tours-tonight", label: "Tours tonight" },
        { href: "/guides/new-orleans-tours-with-transportation", label: "Tours where transportation matters" },
        { href: "/swamp-tours", label: "Compare swamp tours" }
      ]
    }
  },
  {
    slug: "new-orleans-tours-for-solo-travelers",
    title: "New Orleans Tours for Solo Travelers | Easy Ways to Join In",
    description: "Compare New Orleans tour options for solo travelers including city sightseeing, river cruises, cocktail walks and ghost tours, then check current booking rules.",
    config: {
      eyebrow: "Solo travel",
      title: "New Orleans tours that can work well for solo travelers",
      intro: "Joining a scheduled tour can be one of the simplest ways to give a solo day structure without planning every stop yourself. The best fit depends on whether you want broad city context, a river experience, an evening walk or a social food-and-drink format. Confirm current booking minimums and availability before assuming a single traveler can join a specific departure.",
      decisionTitle: "Choose how social or structured you want the experience",
      decisionPoints: [
        "A city tour gives a solo first-time visitor broad context without needing to build a neighborhood route from scratch.",
        "A daytime jazz cruise gives the day a defined activity while leaving the rest of the schedule flexible.",
        "A cocktail or ghost walking tour can add a scheduled evening activity when you do not want to plan nightlife entirely on your own.",
        "Some departures may have minimum participation rules or date-specific availability, so check the operator's live booking details before committing the rest of your day."
      ],
      productSlugs: ["city-tour-of-new-orleans", "daytime-jazz-cruise", "craft-cocktail-walking-tour", "ghosts-spirits-walking-tour"],
      productHeading: "Solo-friendly formats to check",
      productIntro: "These scheduled formats are useful places to start. Confirm whether the selected departure accepts one traveler, plus exact timing, age rules and current availability during booking.",
      relatedLinks: [
        { href: "/guides/first-time-new-orleans-tours", label: "First-time visitor tours" },
        { href: "/guides/things-to-do-in-new-orleans-today", label: "Things to do today" },
        { href: "/guides/new-orleans-tours-near-french-quarter", label: "Tours near the French Quarter" }
      ]
    }
  }
];

export function getAudienceIntentSeoPage(slug: string): AudienceIntentSeoPage | undefined {
  return AUDIENCE_INTENT_SEO_PAGES.find((page) => page.slug === slug);
}
