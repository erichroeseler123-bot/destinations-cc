export type DistrictIntent = "lively" | "local" | "calm" | "nightlife" | "family" | "waterfront" | "events";

type DistrictState = {
  slug: string;
  name: string;
  label: string;
  signalCount: number;
  eventCount: number;
  vibe_tags?: string[];
};

const TAGS: Record<DistrictIntent, string[]> = {
  lively: ["nightlife", "events", "sports", "music", "shows", "entertainment", "restaurants", "bars", "rides", "attractions"],
  local: ["local", "arts", "galleries", "food", "breweries", "historic", "walking", "culture"],
  calm: ["scenic", "outdoors", "hiking", "lake", "beach", "waterfront", "resorts", "walking"],
  nightlife: ["nightlife", "bars", "music", "breweries", "entertainment", "restaurants"],
  family: ["family", "attractions", "theme-parks", "theme-park", "waterparks", "rides", "shows", "aquarium"],
  waterfront: ["waterfront", "water", "beach", "lake", "cruise", "aquarium"],
  events: ["events", "sports", "music", "shows", "theater", "convention", "entertainment"],
};

const LABELS: Record<DistrictIntent, string> = {
  lively: "Lively now",
  local: "Local",
  calm: "Calm",
  nightlife: "Nightlife",
  family: "Family",
  waterfront: "Waterfront",
  events: "Events",
};

function rank(intent: DistrictIntent, district: DistrictState) {
  const tags = (district.vibe_tags || []).map((tag) => tag.toLowerCase());
  const tagMatches = TAGS[intent].filter((tag) => tags.includes(tag));
  const liveActivity = district.signalCount + district.eventCount;
  let points = tagMatches.length * 4;
  const reasons: string[] = [];

  if (tagMatches.length) reasons.push(tagMatches.slice(0, 3).join(" • "));

  if (intent === "lively") {
    points += district.eventCount * 3 + district.signalCount;
    if (district.eventCount) reasons.push(`${district.eventCount} live event${district.eventCount === 1 ? "" : "s"}`);
  } else if (intent === "events") {
    points += district.eventCount * 5;
    if (district.eventCount) reasons.push(`${district.eventCount} current event${district.eventCount === 1 ? "" : "s"}`);
  } else if (intent === "calm") {
    points += liveActivity === 0 ? 5 : Math.max(0, 3 - liveActivity);
    if (liveActivity === 0) reasons.push("no mapped live disruption");
  } else if (intent === "nightlife") {
    points += district.eventCount * 2;
    if (district.eventCount) reasons.push("live activity nearby");
  } else if (intent === "family") {
    if (district.label.includes("TRAFFIC") || district.label.includes("DISRUPTION")) points -= 3;
  } else if (intent === "waterfront") {
    if (district.label.includes("WATER CONDITIONS")) reasons.push("current water signal");
  } else if (intent === "local") {
    if (!tags.includes("tourism")) points += 2;
  }

  return { points, reasons };
}

export function deriveDistrictIntents(districts: DistrictState[]) {
  const intents = (Object.keys(LABELS) as DistrictIntent[]).map((intent) => {
    const matches = districts
      .map((district) => ({ district, ...rank(intent, district) }))
      .filter((item) => item.points > 0)
      .sort((a, b) => b.points - a.points || (b.district.eventCount + b.district.signalCount) - (a.district.eventCount + a.district.signalCount))
      .slice(0, 5)
      .map(({ district, reasons }) => ({
        slug: district.slug,
        name: district.name,
        liveLabel: district.label,
        reasons,
        eventCount: district.eventCount,
        signalCount: district.signalCount,
      }));

    return { intent, label: LABELS[intent], matches };
  });

  return {
    ephemeral: true,
    method: "Durable district tags plus current geolocated live activity; no synthetic buzz score is exposed.",
    intents,
  };
}
