export type TourDecisionCopy = {
  bestFit: string[];
  notIdealFor: string[];
  childrenConsiderations: string[];
};

/**
 * Decision guidance for products whose raw operator inventory does not carry
 * useful "who is this for?" copy. These statements are deliberately framed
 * from verified format/logistics rather than marketing claims. Live checkout
 * remains controlling for age, accessibility, schedule, and policy details.
 */
export const TOUR_DECISION_COPY: Record<string, TourDecisionCopy> = {
  "evening-jazz-cruise": {
    bestFit: [
      "Visitors who want a classic New Orleans evening with live jazz and river views",
      "Couples, families, and groups who prefer a seated sightseeing experience over a walking-heavy evening",
      "Travelers who want the choice between sightseeing-only and dinner variants",
    ],
    notIdealFor: [
      "Visitors looking for a fast-paced or highly active nightlife experience",
      "Anyone who needs a very short activity window; boarding and the selected cruise or dinner variant require a larger time block",
    ],
    childrenConsiderations: [
      "A river cruise can be easier for mixed-age groups than a walking tour, but verify current child pricing, seating, and stroller/accessibility details in checkout.",
    ],
  },
  "daytime-jazz-cruise": {
    bestFit: [
      "First-time visitors who want river views, live jazz, and historical narration in one daytime activity",
      "Families or mixed-age groups looking for a lower-walking sightseeing option",
      "Travelers who want the option to add lunch rather than commit to an evening cruise",
    ],
    notIdealFor: [
      "Visitors who want a highly active or neighborhood-focused experience",
      "Travelers with a tight schedule who cannot allow extra time for boarding or a meal seating",
    ],
    childrenConsiderations: [
      "The seated cruise format can work well for mixed ages; verify current child pricing, meal seating, stroller, and accessibility details during checkout.",
    ],
  },
  "sunday-jazz-brunch-cruise": {
    bestFit: [
      "Sunday visitors who want to combine a New Orleans brunch tradition with a Mississippi River cruise",
      "Groups choosing between a sightseeing-only cruise and a longer brunch experience",
      "Travelers who prefer a relaxed seated activity with live jazz",
    ],
    notIdealFor: [
      "Visitors who are not in New Orleans on Sunday",
      "Travelers with a tight morning schedule; the brunch variant is longer than the sightseeing-only cruise and both require boarding time",
    ],
    childrenConsiderations: [
      "Mixed-age groups may find the seated cruise format convenient; verify current child pricing, brunch seating, and accessibility details in checkout.",
    ],
  },
  "oak-alley-plantation-tour-grey-line": {
    bestFit: [
      "Visitors specifically interested in Oak Alley Plantation and its historic site",
      "Travelers prepared for a roughly half-day excursion outside New Orleans",
      "Visitors comfortable with a mix of transportation, walking, and indoor/outdoor touring",
    ],
    notIdealFor: [
      "Visitors with only a few hours available in the city",
      "Travelers who cannot manage significant walking or stairs without first confirming accessibility; second-floor Big House access requires stairs",
    ],
    childrenConsiderations: [
      "This is a longer historical outing rather than a short attraction stop. Consider children’s interest and stamina, and verify current child and accessibility policies in checkout.",
    ],
  },
  "whitney-plantation-tour": {
    bestFit: [
      "Visitors whose primary interest is the history and experiences of enslaved people in Louisiana",
      "Travelers who prefer a self-paced historical visit rather than a decorative or architecture-first plantation experience",
      "Visitors prepared for a roughly half-day excursion with transportation from New Orleans",
    ],
    notIdealFor: [
      "Visitors looking mainly for mansion architecture, gardens, or a light sightseeing stop",
      "Travelers who cannot comfortably navigate uneven gravel paths without confirming accessibility arrangements first",
    ],
    childrenConsiderations: [
      "The subject matter centers on slavery and can be emotionally serious. Families should consider age and readiness, and verify current child and accessibility policies before booking.",
    ],
  },
  "swamp-bayou-tour": {
    bestFit: [
      "Families and mixed-age groups wanting a calmer swamp experience than an airboat",
      "Visitors who prefer a covered boat and a transportation-inclusive outing from New Orleans",
      "Travelers interested in bayou scenery and wildlife without the speed and noise of an airboat",
    ],
    notIdealFor: [
      "Visitors specifically looking for a high-speed thrill ride",
      "Travelers who want a very short activity; transportation makes this a multi-hour outing",
    ],
    childrenConsiderations: [
      "The covered-boat format is generally a calmer choice for mixed-age groups than an airboat. Verify current child, stroller, and accessibility policies in checkout.",
    ],
  },
  "small-airboat-swamp-adventure": {
    bestFit: [
      "Visitors who want a faster, louder, open-air swamp experience",
      "Travelers who prefer a smaller-airboat format over the larger-vessel option",
      "Groups comfortable with outdoor exposure and a more active ride",
    ],
    notIdealFor: [
      "Visitors sensitive to loud noise, wind, or open-air exposure",
      "Groups seeking the calmest or most sheltered swamp format",
    ],
    childrenConsiderations: [
      "Airboats are loud and open-air. Verify current age minimums, child eligibility, hearing-protection guidance, and accessibility requirements in checkout.",
    ],
  },
  "large-airboat-swamp-adventure": {
    bestFit: [
      "Visitors who want the speed and open-air feel of an airboat in a larger-vessel format",
      "Groups looking for an adventurous swamp outing with transportation included",
      "Travelers comfortable with a loud, exposed outdoor ride",
    ],
    notIdealFor: [
      "Visitors who want a quiet or covered swamp experience",
      "Travelers sensitive to loud noise, wind, or outdoor exposure",
    ],
    childrenConsiderations: [
      "Airboats are loud and open-air. Verify current age minimums, child eligibility, hearing-protection guidance, and accessibility requirements in checkout.",
    ],
  },
  "swamp-boat-oak-alley-combo": {
    bestFit: [
      "Visitors who want both a swamp experience and Oak Alley Plantation without arranging two separate day trips",
      "Travelers prepared to devote most of a day to transportation, boating, and a historic-site visit",
      "Groups that value variety more than a deep single-topic tour",
    ],
    notIdealFor: [
      "Visitors with less than a full day available",
      "Travelers who want an in-depth plantation visit or an extended swamp experience rather than a combination itinerary",
    ],
    childrenConsiderations: [
      "This is a long combination day with multiple segments. Consider children’s stamina and verify current age, accessibility, and transportation policies before booking.",
    ],
  },
  "swamp-boat-whitney-combo": {
    bestFit: [
      "Visitors who want a Louisiana swamp experience and Whitney Plantation in one full-day outing",
      "Travelers interested in both natural scenery and the history of enslaved people in Louisiana",
      "Groups prepared for a long day with transportation, boating, and walking",
    ],
    notIdealFor: [
      "Visitors with less than a full day available",
      "Travelers who want a deep, unhurried Whitney visit rather than a combination itinerary",
    ],
    childrenConsiderations: [
      "The day is long and Whitney’s subject matter is serious. Consider children’s stamina and readiness, and verify current age/accessibility policies before booking.",
    ],
  },
  "cocktail-walking-tour": {
    bestFit: [
      "Adults interested in New Orleans cocktail history and a social French Quarter walking experience",
      "Visitors who want nightlife context rather than a bar-only evening",
      "Travelers comfortable walking between multiple stops",
    ],
    notIdealFor: [
      "Visitors who do not drink alcohol or are looking for a family-oriented activity",
      "Travelers who need a seated or minimal-walking experience",
    ],
    childrenConsiderations: [
      "This is an alcohol-focused experience. Verify the operator’s current minimum-age and ID requirements before booking.",
    ],
  },
  "craft-cocktail-walking-tour": {
    bestFit: [
      "Adults interested in craft cocktails, local bar culture, and French Quarter history",
      "Visitors who want a small-group walking experience with cocktail stops",
      "Travelers comfortable spending about two hours on foot between indoor and outdoor stops",
    ],
    notIdealFor: [
      "Visitors seeking a family activity or a non-alcohol-focused tour",
      "Travelers who need a minimal-walking or fully seated experience",
    ],
    childrenConsiderations: [
      "This is an alcohol-focused walking tour. Verify the operator’s current minimum-age and ID requirements before booking.",
    ],
  },
  "ghosts-spirits-walking-tour": {
    bestFit: [
      "Visitors who want an evening French Quarter walk built around ghost stories and darker local history",
      "Groups comfortable walking outdoors for roughly two hours",
      "Travelers looking for atmosphere and storytelling rather than a transportation-based tour",
    ],
    notIdealFor: [
      "Visitors who need a seated or low-walking experience",
      "Travelers who dislike spooky themes or nighttime street walking",
    ],
    childrenConsiderations: [
      "Families should consider whether the ghost-story content and evening walking format fit their children. Verify current age and accessibility guidance in checkout.",
    ],
  },
  "city-cemetery-garden-district-tour": {
    bestFit: [
      "First-time visitors who want a broad city overview plus a Garden District walk",
      "Travelers who like a mix of motorcoach sightseeing and getting out to explore on foot",
      "Visitors who want more neighborhood context than a ride-only city tour",
    ],
    notIdealFor: [
      "Visitors who want to avoid walking entirely",
      "Travelers who have difficulty with uneven sidewalks without first confirming accessibility options",
    ],
    childrenConsiderations: [
      "The mix of coach time and walking can suit some mixed-age groups; consider children’s interest in history and verify current child/accessibility policies in checkout.",
    ],
  },
  "city-of-new-orleans-riverboat-cruise": {
    bestFit: [
      "Visitors who want a shorter Mississippi River cruise that fits into a tighter sightseeing day",
      "Families and mixed-age groups looking for a mostly seated sightseeing activity",
      "Travelers who want river views and live Captain’s narration without committing to a meal cruise",
    ],
    notIdealFor: [
      "Visitors specifically seeking the longer live-jazz NATCHEZ experience or a meal cruise",
      "Travelers who need step-free access to every deck; the operator notes the top deck is accessible by stairs only",
    ],
    childrenConsiderations: [
      "The shorter cruise can be easier to fit around family schedules. Verify current child pricing, stroller, and accessibility details in checkout.",
    ],
  },
};
