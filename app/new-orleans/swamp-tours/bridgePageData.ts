import type { DccPageIntent } from "@/lib/dcc/pageIntents";
import type { WarmTransferContext, WarmTransferSourcePage, WarmTransferSubtype } from "@/src/data/routing/nodes/warmTransfers";

export type SwampBridgePage = {
  slug: "airboat-vs-boat" | "best-time" | "with-kids" | "worth-it" | "transportation" | "types";
  path: WarmTransferSourcePage;
  title: string;
  description: string;
  eyebrow: string;
  heroSubhead: string;
  question: string;
  shortAnswer: readonly string[];
  decisionFrame: string;
  sections: readonly {
    title: string;
    body: string;
    bullets?: readonly string[];
  }[];
  decisionBlockTitle: string;
  decisionBlockBody: string;
  subtype: WarmTransferSubtype;
  context: WarmTransferContext;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryHref: string;
  pageIntent: DccPageIntent;
  keywords: readonly string[];
  relatedLinks: readonly { href: string; label: string }[];
};

export const SWAMP_BRIDGE_PAGES: Record<SwampBridgePage["slug"], SwampBridgePage> = {
  "airboat-vs-boat": {
    slug: "airboat-vs-boat",
    path: "/new-orleans/swamp-tours/airboat-vs-boat",
    title: "Airboat vs Swamp Boat Tours: Which One Should You Choose?",
    description: "Compare airboat versus swamp boat tours from New Orleans, understand the real tradeoffs fast, then move into the WTS decision surface when you are ready to choose.",
    eyebrow: "DCC bridge page",
    heroSubhead:
      "If you’re planning a swamp tour from New Orleans, this is the first real decision: fast and loud, or slow and scenic. Here’s how to pick.",
    question: "Should you choose an airboat or a swamp boat tour?",
    shortAnswer: [
      "If you want speed, excitement, and a more intense ride, choose an airboat.",
      "If you want a quieter, more relaxed experience with better chances to hear the guide and settle into the scenery, choose a swamp boat.",
    ],
    decisionFrame:
      "This page exists to answer the question quickly and build trust. Once you know whether you lean thrill-first or calm-first, move into WTS to narrow the actual best-fit tour.",
    sections: [
      {
        title: "Airboat: what it’s actually like",
        body: "Airboats feel fast, loud, exposed, and dramatic. They cover distance quickly, but the ride itself becomes the main event, which changes the whole mood of the tour.",
        bullets: [
          "Very fast and usually much louder than a calmer swamp boat",
          "More wind, spray, and thrill-first energy",
          "Better if the group wants excitement over calm observation",
          "Weaker if you mainly want a quiet ride and easier wildlife listening",
        ],
      },
      {
        title: "Swamp boat: what it’s actually like",
        body: "Swamp boats usually feel slower, steadier, and quieter. They are better when the goal is a scenic outing with easier photography, easier conversation, and a calmer guide experience.",
        bullets: [
          "Slower and more relaxed",
          "Better for hearing the guide and spotting details in the landscape",
          "Usually easier for photography and mixed-age groups",
          "Best when comfort and immersion matter more than adrenaline",
        ],
      },
      {
        title: "Real tradeoffs",
        body: "This is where most generic pages get lazy. The real choice is not ‘good versus bad.’ It is noise versus quiet, speed versus immersion, and excitement versus comfort.",
        bullets: [
          "Noise versus silence",
          "Speed versus immersion",
          "Excitement versus comfort",
        ],
      },
      {
        title: "What most people don’t realize",
        body: "Wildlife is not guaranteed either way, weather affects both formats, and pickup or transfer friction often matters almost as much as boat type for city visitors.",
        bullets: [
          "Wildlife is variable no matter what you book",
          "Weather and exposure can amplify the wrong ride choice",
          "Pickup and transport can matter as much as boat type on short trips",
        ],
      },
    ],
    decisionBlockTitle: "Still deciding? We can narrow this down for you in about 30 seconds.",
    decisionBlockBody:
      "Use WTS to turn this airboat-versus-boat question into a best-fit shortlist instead of starting over from broad research.",
    subtype: "airboat-vs-boat",
    context: "first-time",
    primaryLabel: "Compare real tour options ->",
    secondaryLabel: "Back to swamp tours hub",
    secondaryHref: "/new-orleans/swamp-tours",
    pageIntent: "understand",
    keywords: ["airboat vs swamp boat", "airboat vs boat swamp tour", "new orleans airboat vs boat"],
    relatedLinks: [
      { href: "/new-orleans/swamp-tours/best-time", label: "Best time to go" },
      { href: "/new-orleans/swamp-tours/with-kids", label: "With kids" },
      { href: "/new-orleans/swamp-tours/worth-it", label: "Worth it" },
    ],
  },
  "best-time": {
    slug: "best-time",
    path: "/new-orleans/swamp-tours/best-time",
    title: "Best Time for a New Orleans Swamp Tour",
    description: "Learn the real timing tradeoffs for New Orleans swamp tours, then move into WTS to narrow the right fit for your trip.",
    eyebrow: "DCC bridge page",
    heroSubhead:
      "The best time is not just a season headline. It is when the tour fits your trip, your energy, and your tolerance for heat, weather, and travel friction.",
    question: "When is the best time to take a swamp tour from New Orleans?",
    shortAnswer: [
      "Cooler months are usually the easiest physical fit for most travelers.",
      "But the real answer is trip-fit: the right day, enough time, and a tour format that matches your energy and schedule.",
    ],
    decisionFrame:
      "DCC answers the timing question fast. WTS then uses that context to narrow the best-fit shortlist rather than leaving you in generic season research.",
    sections: [
      { title: "Cooler weather is easier", body: "Lower heat and less physical friction make the default comfort-first lanes stronger for most first-timers." },
      { title: "Summer can still work", body: "It just punishes bad planning faster. Heat, bugs, and exposure matter more when the format is already intense." },
      { title: "Trip shape matters more than internet folklore", body: "A well-placed tour on the right day is usually better than chasing a perfect month with a bad itinerary fit." },
      { title: "What most people miss", body: "The wrong departure time, weak pickup fit, or overloaded day can matter more than small seasonal differences." },
    ],
    decisionBlockTitle: "Ready to narrow the best-fit timing lane?",
    decisionBlockBody: "Send this timing question into WTS and let /plan surface the safer shortlist first.",
    subtype: "best-time",
    context: "short-trip",
    primaryLabel: "Compare best-fit timing options ->",
    secondaryLabel: "Browse all New Orleans tours",
    secondaryHref: "/new-orleans/tours",
    pageIntent: "understand",
    keywords: ["best time swamp tours new orleans", "when to do swamp tour new orleans", "swamp tour weather new orleans"],
    relatedLinks: [
      { href: "/new-orleans/swamp-tours/transportation", label: "Transportation" },
      { href: "/new-orleans/swamp-tours/worth-it", label: "Worth it" },
      { href: "/new-orleans/swamp-tours/types", label: "Types" },
    ],
  },
  "with-kids": {
    slug: "with-kids",
    path: "/new-orleans/swamp-tours/with-kids",
    title: "Swamp Tours with Kids: What Actually Works?",
    description: "Understand whether a New Orleans swamp tour fits your family, then move into WTS to narrow family-fit options quickly.",
    eyebrow: "DCC bridge page",
    heroSubhead:
      "For families, the right swamp tour is usually about comfort, pacing, and lower friction, not the loudest ride in the market.",
    question: "Are swamp tours good with kids?",
    shortAnswer: [
      "Yes, if you choose for pace, duration, and logistics rather than hype.",
      "Most families do better with calmer, steadier tours than with the most intense thrill-first format.",
    ],
    decisionFrame:
      "DCC frames the family decision. WTS then narrows the shortlist so you can stop guessing which tours actually fit mixed-age groups.",
    sections: [
      { title: "Family fit is usually comfort fit", body: "Lower noise, easier pacing, and manageable duration matter more than extreme excitement for most groups with kids." },
      { title: "Transport matters too", body: "No-car logistics and pickup friction can wear families down before the tour even starts." },
      { title: "The wrong intensity can ruin the day", body: "Even a well-reviewed tour can be wrong if the ride style clashes with your group’s tolerance." },
      { title: "What most people don’t realize", body: "Family success often comes from reducing friction, not from chasing the biggest headline experience." },
    ],
    decisionBlockTitle: "Need the family-fit answer fast?",
    decisionBlockBody: "Open WTS and let /plan narrow the shortlist around calmer, easier, family-sensitive options.",
    subtype: "with-kids",
    context: "kids",
    primaryLabel: "Find the right family-fit tour ->",
    secondaryLabel: "Back to New Orleans authority",
    secondaryHref: "/new-orleans",
    pageIntent: "understand",
    keywords: ["swamp tours with kids new orleans", "family swamp tour new orleans", "best swamp tour for families new orleans"],
    relatedLinks: [
      { href: "/new-orleans/swamp-tours/airboat-vs-boat", label: "Airboat vs boat" },
      { href: "/new-orleans/swamp-tours/transportation", label: "Transportation" },
      { href: "/new-orleans/swamp-tours/worth-it", label: "Worth it" },
    ],
  },
  "worth-it": {
    slug: "worth-it",
    path: "/new-orleans/swamp-tours/worth-it",
    title: "Are Swamp Tours Worth It from New Orleans?",
    description: "Answer the skeptical version of the swamp-tour question fast, then route interested visitors into WTS to choose the right fit.",
    eyebrow: "DCC bridge page",
    heroSubhead:
      "If the swamp belongs in your trip, the next question is not whether it exists. It is which format is worth your time, energy, and logistics.",
    question: "Are swamp tours worth it in New Orleans?",
    shortAnswer: [
      "Usually yes, if you want one real outdoor Louisiana contrast to the city.",
      "They are weaker fits on very short trips or when transport friction already makes the day feel overloaded.",
    ],
    decisionFrame:
      "This page is for skeptical traffic. Once the answer becomes yes, the right next step is to narrow the actual fit on WTS instead of staying in abstract doubt.",
    sections: [
      { title: "Why they are worth it", body: "They give you scenery, pace, and atmosphere the city itself does not, which is exactly why they can become a strong contrast block." },
      { title: "Why they are not always worth it", body: "Compressed trips, weak logistics, and the wrong tour format can turn the swamp into a drag instead of a highlight." },
      { title: "What the generic sites miss", body: "The yes-or-no answer matters less than whether the format, timing, and transfer setup actually fit your trip." },
      { title: "What to do next", body: "If the answer is yes in principle, move into WTS and pressure-test the shortlist." },
    ],
    decisionBlockTitle: "Think it might be worth it? Narrow the fit now.",
    decisionBlockBody: "Use WTS /plan to see whether the best-fit options actually justify the time and hassle for your trip.",
    subtype: "worth-it",
    context: "mixed-group",
    primaryLabel: "Find the right swamp tour for you ->",
    secondaryLabel: "Back to swamp tours hub",
    secondaryHref: "/new-orleans/swamp-tours",
    pageIntent: "understand",
    keywords: ["are swamp tours worth it new orleans", "is swamp tour worth it new orleans", "should i do a swamp tour new orleans"],
    relatedLinks: [
      { href: "/new-orleans/swamp-tours/best-time", label: "Best time" },
      { href: "/new-orleans/swamp-tours/with-kids", label: "With kids" },
      { href: "/new-orleans/swamp-tours/transportation", label: "Transportation" },
    ],
  },
  transportation: {
    slug: "transportation",
    path: "/new-orleans/swamp-tours/transportation",
    title: "How Transportation Changes a Swamp Tour from New Orleans",
    description: "Understand pickup and transfer tradeoffs before you choose a swamp tour from New Orleans, then route into WTS with transport-sensitive context.",
    eyebrow: "DCC bridge page",
    heroSubhead:
      "For city visitors without a car, transport reality can matter as much as the tour itself. This is often the real deciding factor.",
    question: "How much does transportation matter for a swamp tour from New Orleans?",
    shortAnswer: [
      "A lot. Pickup ease and transfer friction can matter more than small differences between operators.",
      "On short trips, a cleaner transport setup often creates the better overall tour choice.",
    ],
    decisionFrame:
      "DCC should frame the logistics problem clearly. WTS should then narrow the shortlist around pickup and no-car fit instead of sending users back into generic research.",
    sections: [
      { title: "Pickup can outweigh brand differences", body: "A slightly less flashy tour with cleaner logistics can still be the better total experience for city visitors." },
      { title: "Short trips punish friction", body: "The tighter the itinerary, the more bad transport reshapes the whole value equation." },
      { title: "No-car visitors need a different lane", body: "They should narrow based on simplicity and departure ease first, not as an afterthought." },
      { title: "What most people miss", body: "Transport often changes whether the swamp fits the day at all, not just which operator looks best on paper." },
    ],
    decisionBlockTitle: "Need the pickup-aware answer fast?",
    decisionBlockBody: "Send the transport question into WTS and let /plan surface the pickup-sensitive shortlist first.",
    subtype: "transportation",
    context: "no-car",
    primaryLabel: "Compare pickup-friendly options ->",
    secondaryLabel: "Browse all New Orleans tours",
    secondaryHref: "/new-orleans/tours",
    pageIntent: "understand",
    keywords: ["swamp tours from new orleans", "swamp tour transportation new orleans", "pickup swamp tours new orleans"],
    relatedLinks: [
      { href: "/new-orleans/swamp-tours/best-time", label: "Best time" },
      { href: "/new-orleans/swamp-tours/with-kids", label: "With kids" },
      { href: "/new-orleans/swamp-tours/types", label: "Types" },
    ],
  },
  types: {
    slug: "types",
    path: "/new-orleans/swamp-tours/types",
    title: "Types of Swamp Tours: How to Pick the Right Lane",
    description: "Collapse the swamp-tour market into useful decision lanes, then route into WTS to choose the best fit.",
    eyebrow: "DCC bridge page",
    heroSubhead:
      "You do not need a giant provider list. You need to understand the few real lanes that shape what kind of swamp tour will actually fit your group.",
    question: "What types of swamp tours are there from New Orleans?",
    shortAnswer: [
      "The useful split is not endless operators. It is ride style, comfort level, family fit, and pickup friction.",
      "Choose the lane first, then narrow the shortlist on WTS.",
    ],
    decisionFrame:
      "This page reduces option overload. It is a router, not the final chooser. Once the lane is clear, WTS should take over.",
    sections: [
      { title: "Thrill-first types", body: "Best for speed, noise, and ride intensity." },
      { title: "Comfort-first types", body: "Best for broader group fit, steadier pacing, and lower physical friction." },
      { title: "Family-fit types", body: "Best when mixed-age comfort and manageable duration shape the whole decision." },
      { title: "Pickup-sensitive types", body: "Best when city-side transport simplicity matters as much as the ride itself." },
    ],
    decisionBlockTitle: "Want the right lane without the overwhelm?",
    decisionBlockBody: "Open WTS /plan and narrow the shortlist by lane instead of trying to compare everything at once.",
    subtype: "types",
    context: "first-time",
    primaryLabel: "Choose your lane on WTS ->",
    secondaryLabel: "Back to swamp tours hub",
    secondaryHref: "/new-orleans/swamp-tours",
    pageIntent: "understand",
    keywords: ["types of swamp tours new orleans", "best type of swamp tour new orleans", "new orleans swamp tour options"],
    relatedLinks: [
      { href: "/new-orleans/swamp-tours/airboat-vs-boat", label: "Airboat vs boat" },
      { href: "/new-orleans/swamp-tours/with-kids", label: "With kids" },
      { href: "/new-orleans/swamp-tours/transportation", label: "Transportation" },
    ],
  },
};
