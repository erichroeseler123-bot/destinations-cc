export type HotelGuide = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  eyebrow: string;
  updatedLabel: string;
  heroSummary: string;
  quickFacts: Array<{
    label: string;
    value: string;
  }>;
  sections: Array<{
    eyebrow: string;
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
};

export const VEGAS_HOTEL_GUIDES: HotelGuide[] = [
  {
    slug: "rio-las-vegas-renovation-update",
    title: "Rio Las Vegas 2026 Renovation Update: Hyatt Points, New Suites, and What Changed",
    shortTitle: "Rio renovation guide",
    description:
      "A customer-first Rio Las Vegas update covering the renovated Ipanema Tower, Hyatt points, refreshed dining, and why Rio is back in the Vegas value conversation.",
    eyebrow: "Hotel update",
    updatedLabel: "Updated March 2026",
    heroSummary:
      "Rio is one of the clearest Vegas comeback stories right now. The easiest headline is simple: the resort is now part of Destination by Hyatt, the Ipanema Tower has more than 1,500 remodeled suites, and the property feels much more usable for value-focused Vegas stays than its old reputation suggests.",
    quickFacts: [
      {
        label: "Current status",
        value: "Phase-one renovation work is visible and the renovated Ipanema suites are already in the market.",
      },
      {
        label: "Loyalty angle",
        value: "Rio is part of Destination by Hyatt, so Hyatt members can earn and redeem World of Hyatt points here.",
      },
      {
        label: "Best reason to care",
        value: "It gives you large suite-style rooms off the Strip without feeling like the old worn Rio people still remember.",
      },
    ],
    sections: [
      {
        eyebrow: "Quick answer",
        title: "Why Rio matters again",
        paragraphs: [
          "The main reason people are searching Rio again is not nostalgia. It is because the property is visibly being rebuilt into a better-value Las Vegas stay, and travelers now have a loyalty-program reason to care thanks to the Hyatt connection.",
          "For a lot of Vegas visitors, the useful question is not whether Rio is fully finished. It is whether there are now enough renovated rooms, enough refreshed public spaces, and enough food options to make it a smart value pick. The answer is yes if you want bigger rooms, easier parking, and a break from center-Strip pricing.",
        ],
        bullets: [
          "More than 1,500 remodeled suites in the Ipanema Tower.",
          "Destination by Hyatt positioning makes the property more relevant for points-minded travelers.",
          "Refreshed casino floor, food hall, and newer dining names give the property more life than the old Rio reputation suggests.",
        ],
      },
      {
        eyebrow: "What looks strongest",
        title: "The renovated rooms and value math are the real story",
        paragraphs: [
          "The room side is the biggest shift. The Ipanema Tower is the piece most worth targeting because that is where the renovation story turns into something a traveler can actually feel instead of just read about in a construction note.",
          "Rio also makes more sense now for people who want a roomier base and are comfortable being off the Strip by a short ride instead of right in the middle of the pedestrian chaos.",
        ],
        bullets: [
          "Look for renovated Ipanema inventory first instead of treating all Rio rooms as equal.",
          "Use Hyatt points and Hyatt status logic as part of the comparison, not just cash rate.",
          "Rio works best for value-first travelers, car users, and people who do not need to sleep inside center-Strip foot traffic.",
        ],
      },
      {
        eyebrow: "Dining and casino",
        title: "What feels new on property",
        paragraphs: [
          "The refreshed food and casino story is important because it helps separate current Rio from the old reputation. The property is now highlighting Canteen Food Hall, The Kitchen Table, and High Steaks Vegas, along with an updated gaming floor.",
          "That matters because a cheap room is a lot less useful if the rest of the property still feels dead. Rio is not pretending to be Bellagio. It is trying to be much more usable value.",
        ],
        bullets: [
          "Canteen Food Hall is the easiest on-property value lane.",
          "High Steaks Vegas is the most obvious name-brand dining signal.",
          "The refreshed casino floor is part of the broader comeback pitch, not a side detail.",
        ],
      },
      {
        eyebrow: "Who should book it",
        title: "Best fit for your Vegas trip",
        paragraphs: [
          "Rio is strongest when you want more room, lower pressure, and a better price story than the center Strip often gives you. It is weaker if your entire plan depends on walking in and out of Bellagio, Caesars, or Cosmopolitan all day.",
          "If you care most about Hyatt points, suite size, parking ease, or being slightly outside the Strip churn, Rio belongs back on the shortlist.",
        ],
      },
    ],
    faq: [
      {
        question: "Can you use Hyatt points at Rio Las Vegas in 2026?",
        answer:
          "Yes. Rio is part of Destination by Hyatt, so Hyatt members can earn and redeem World of Hyatt points there.",
      },
      {
        question: "Which rooms should you target at Rio right now?",
        answer:
          "Target the renovated Ipanema Tower inventory first, because that is where the most visible room refresh has already landed.",
      },
      {
        question: "Is Rio a good value stay in Las Vegas now?",
        answer:
          "For travelers who want suite-style rooms, easier parking, and off-Strip value, Rio is much more competitive than its older reputation suggests.",
      },
    ],
  },
  {
    slug: "hard-rock-las-vegas-construction-update",
    title: "Hard Rock Las Vegas Construction Update: What Replaced the Mirage and When It Reopens",
    shortTitle: "Hard Rock construction guide",
    description:
      "A practical Hard Rock Las Vegas construction guide covering the former Mirage site, the Guitar Hotel build, and what travelers should expect before the target 2027 opening.",
    eyebrow: "Construction update",
    updatedLabel: "Updated March 2026",
    heroSummary:
      "The Mirage is no longer a stay-now option. The site is an active Hard Rock construction zone, and the useful customer answer is this: if you are planning a Vegas trip before the target 2027 reopening, book nearby and treat Hard Rock as a future project, not a hotel you can use right now.",
    quickFacts: [
      {
        label: "Current status",
        value: "The former Mirage site is under active redevelopment into Hard Rock Hotel & Casino Las Vegas and Guitar Hotel Las Vegas.",
      },
      {
        label: "Opening target",
        value: "The clearest public target remains the second half of 2027.",
      },
      {
        label: "What changed",
        value: "The Volcano is gone and the property is being rebuilt around the Hard Rock / Guitar Hotel identity.",
      },
    ],
    sections: [
      {
        eyebrow: "Quick answer",
        title: "What travelers need to know now",
        paragraphs: [
          "People keep searching this because they want to know if Mirage is somehow still bookable, whether the Volcano is still there, or whether Hard Rock is close enough to opening to plan around. The short answer is no, no, and not yet.",
          "If your trip is happening before the target 2027 opening window, use this page as a planning guide, not a booking guide. Stay nearby if you want that part of the Strip and treat the project as a skyline update rather than a current hotel option.",
        ],
        bullets: [
          "Do not plan on staying at the property before it officially reopens.",
          "The Mirage identity is gone as a live hotel stay option.",
          "Treasure Island and the Venetian side of the Strip are the easiest nearby fallbacks.",
        ],
      },
      {
        eyebrow: "What is official",
        title: "The part of the story you can plan around",
        paragraphs: [
          "The safest public baseline is that Hard Rock is transforming the former Mirage into a Hard Rock Hotel & Casino Las Vegas anchored by the Guitar Hotel, with a target opening in the second half of 2027.",
          "That is the part customers should use for decision-making. It means the site is future-facing, not usable lodging for near-term trips.",
        ],
      },
      {
        eyebrow: "What people are watching",
        title: "The Guitar Hotel build and the former Mirage footprint",
        paragraphs: [
          "Construction-watch coverage keeps focusing on the Guitar Hotel rise, the new theater footprint, and the visual transformation of the old Mirage massing. Those details make the project exciting, but exact floor counts and glass progress move constantly and are better treated as reported snapshots, not permanent facts.",
          "The durable customer takeaway is that the former Mirage footprint is being radically remade, and the old Volcano-era visual identity is over.",
        ],
        bullets: [
          "The Guitar Hotel is the signature visual change people care about most.",
          "The former Mirage shell is being remade rather than lightly refreshed.",
          "Construction-view interest is high, but near-term booking utility is zero until reopening gets much closer.",
        ],
      },
      {
        eyebrow: "Best nearby move",
        title: "How to stay near the site without waiting for it",
        paragraphs: [
          "If you want to stay on that end of the Strip now, the smart move is to book nearby instead of forcing the Hard Rock question too early. Treasure Island is the easiest practical mention because it keeps you in the area without pretending the project is ready.",
          "That makes this page useful as a planning shortcut: use it to understand the transition, then move on to a live hotel option for the actual trip.",
        ],
      },
    ],
    faq: [
      {
        question: "Is the Mirage still open in Las Vegas?",
        answer:
          "No. The former Mirage site is now part of the Hard Rock redevelopment and is not a live hotel option for current trips.",
      },
      {
        question: "When is Hard Rock Las Vegas supposed to open?",
        answer:
          "The clearest public target remains the second half of 2027, though construction timelines can always move.",
      },
      {
        question: "What happened to the Mirage Volcano?",
        answer:
          "It is gone. The site is being rebuilt around the Hard Rock and Guitar Hotel project.",
      },
    ],
  },
];

export function getVegasHotelGuides() {
  return VEGAS_HOTEL_GUIDES;
}

export function getVegasHotelGuide(slug: string) {
  return VEGAS_HOTEL_GUIDES.find((guide) => guide.slug === slug) || null;
}
