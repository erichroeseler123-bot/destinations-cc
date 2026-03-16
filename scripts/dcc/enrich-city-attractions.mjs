import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const rolloutName = process.argv[2] || "us-top-tourism";
const ENRICH_LIMIT_PER_CITY = 6;
const TRACKED_TYPES = [
  "landmark",
  "district",
  "park",
  "museum",
  "waterfront",
  "historic-site",
  "market",
  "venue",
  "nature-area",
  "theme-park",
  "garden",
];
const TYPE_ALIASES = {
  "historic-district": "district",
  "attraction-district": "district",
  "shopping-district": "district",
  "historic-route": "historic-site",
  "historic-market": "market",
  pier: "waterfront",
  beach: "waterfront",
  coastline: "waterfront",
  stadium: "venue",
  attraction: "landmark",
  "museum-cluster": "museum",
  "day-trip": "nature-area",
  zoo: "park",
};
const TYPE_TEMPLATES = {
  landmark: {
    summary: (entry, cityName) =>
      `${entry.name} is one of the better-known landmarks in ${cityName} and usually works best as part of a broader sightseeing block instead of a standalone stop.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} as part of a broader sightseeing block instead of making it the only stop in that part of the day.`,
      `Pair ${entry.name} with one nearby walk, museum, or neighborhood stop for a more complete visit.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} sightseeing tours`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} sightseeing tour`,
        description: `A simple starting point for visitors who want to see ${entry.name} in a broader city context.`,
      },
    ],
    planningTips: (entry) => [
      `Landmark stops usually work better when they are tied to a broader city route instead of treated as a one-stop plan.`,
    ],
  },
  district: {
    summary: (entry, cityName) =>
      `${entry.name} is a useful district to understand early if you want a clearer feel for how visitors actually spend time in ${cityName}.`,
    thingsToDo: (entry) => [
      `Walk ${entry.name} with one clear purpose, such as food, music, shopping, or evening atmosphere.`,
      `Treat ${entry.name} as a time block rather than a quick pass-through if it is one of the main reasons for the trip.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} neighborhood tours`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} neighborhood tour`,
        description: `Helpful when ${entry.name} is better experienced as part of a larger district walk or evening plan.`,
      },
    ],
    planningTips: () => [
      `Districts usually feel stronger when you decide whether the point is food, shopping, nightlife, or a general walk before you arrive.`,
    ],
  },
  park: {
    summary: (entry, cityName) =>
      `${entry.name} gives visitors a practical outdoor break from denser city blocks and usually fits best into a slower part of the day in ${cityName}.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} for a slower outdoor block, especially if the rest of the day is built around denser city stops.`,
      `Pair ${entry.name} with one nearby indoor attraction, meal, or sightseeing route instead of overloading the day.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} outdoor experiences`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} outdoor tour`,
        description: `A safer starting point for visitors planning around scenery, fresh air, or a slower pace.`,
      },
    ],
    planningTips: () => [
      `Outdoor stops tend to be easier to pace when you keep the rest of the day light and avoid too many cross-city jumps.`,
    ],
  },
  museum: {
    summary: (entry, cityName) =>
      `${entry.name} is a useful museum stop in ${cityName} for visitors who want more structure, context, or indoor time built into the trip.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} as an anchor for a more structured indoor block, especially on hotter, colder, or wetter days.`,
      `Pair ${entry.name} with one nearby neighborhood, food, or walking stop instead of stacking too many museums at once.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} museum experiences`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} museum tour`,
        description: `Useful when visitors want more context than a quick self-guided pass-through.`,
      },
    ],
    planningTips: () => [
      `Museum stops usually add the most value when you pair them with one nearby walk, meal, or neighborhood block instead of stacking too much indoor time.`,
    ],
  },
  waterfront: {
    summary: (entry, cityName) =>
      `${entry.name} is one of the more useful waterfront areas in ${cityName} for visitors planning around walking, views, and a lighter sightseeing pace.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} for a walkable waterfront block with time for views, food, or an easier sightseeing pace.`,
      `Pair ${entry.name} with one nearby district or attraction instead of treating the waterfront as the whole day.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} waterfront tours`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} waterfront tour`,
        description: `Helpful when the waterfront fits naturally into a sightseeing or walking-focused city plan.`,
      },
    ],
    planningTips: () => [
      `Waterfront areas usually work best as part of a slower sightseeing window instead of a tightly scheduled day.`,
    ],
  },
  "historic-site": {
    summary: (entry, cityName) =>
      `${entry.name} is one of the more recognizable historic sites in ${cityName} and usually adds the most value when visitors want stronger context, not just a quick pass-through.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} as part of a more history-focused block instead of treating it as a standalone stop.`,
      `Pair ${entry.name} with a guided walk, museum, or nearby landmark if you want a fuller sense of place.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} history tours`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} history tour`,
        description: `A useful starting point for visitors who want more context around ${entry.name}.`,
      },
    ],
    planningTips: () => [
      `Historic sites usually feel more useful when they are part of a broader city story instead of a quick photo stop.`,
    ],
  },
  market: {
    summary: (entry, cityName) =>
      `${entry.name} is a practical market stop in ${cityName} for visitors who want food, browsing, and a more casual neighborhood block built into the day.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} as part of a slower food, shopping, or neighborhood block instead of rushing through it.`,
      `Pair ${entry.name} with one nearby district walk or meal instead of overpacking the rest of the day.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} market tours`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} market tour`,
        description: `Helpful when visitors want a more structured way to pair the market with local food or neighborhood context.`,
      },
    ],
    planningTips: () => [
      `Markets usually work best when you leave room to browse and eat instead of forcing them into a tightly timed schedule.`,
    ],
  },
  venue: {
    summary: (entry, cityName) =>
      `${entry.name} is a useful venue anchor in ${cityName} for visitors building a trip around live events, architecture, or a specific night out.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} as the anchor for a focused event or evening plan instead of trying to force too many other stops around it.`,
      `Pair ${entry.name} with one nearby meal, district walk, or pre-show block if timing allows.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} event experiences`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} events`,
        description: `A starting point for visitors planning around shows, venue visits, or a broader night out.`,
      },
    ],
    planningTips: () => [
      `Venue stops usually work best when the rest of the day is planned around show timing, transit, and post-event pacing.`,
    ],
  },
  "nature-area": {
    summary: (entry, cityName) =>
      `${entry.name} is a useful nature-focused stop near ${cityName} for visitors who want scenery, fresh air, and a break from denser urban pacing.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} as a slower scenic or outdoor block instead of trying to stack too many urban stops around it.`,
      `Pair ${entry.name} with one other nearby attraction or a dedicated half-day plan rather than forcing multiple long jumps.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} outdoor experiences`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} outdoor tour`,
        description: `Helpful when visitors want structure around scenery, hiking, or a more nature-forward day.`,
      },
    ],
    planningTips: () => [
      `Nature stops usually feel better when you leave margin for weather, travel time, and a slower overall pace.`,
    ],
  },
  "theme-park": {
    summary: (entry, cityName) =>
      `${entry.name} is one of the bigger all-day attractions in ${cityName} and usually works best when visitors treat it as a dedicated block, not a quick add-on.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} as a dedicated day or major half-day instead of trying to sandwich it between unrelated city stops.`,
      `Keep the rest of the itinerary light if ${entry.name} is one of the main reasons for the trip.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} park tickets and tours`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} tickets tours`,
        description: `A practical starting point for visitors comparing admission, transport, or bundled experiences.`,
      },
    ],
    planningTips: () => [
      `Large attraction parks usually work best when you decide early whether the day is focused on rides, families, or a broader resort-area plan.`,
    ],
  },
  garden: {
    summary: (entry, cityName) =>
      `${entry.name} is a calmer garden stop in ${cityName} for visitors looking to add a quieter outdoor block to a busier trip.`,
    thingsToDo: (entry) => [
      `Use ${entry.name} for a slower walkable block, especially if the rest of the trip is more urban or schedule-heavy.`,
      `Pair ${entry.name} with one nearby museum, neighborhood, or meal instead of overloading the rest of the day.`,
    ],
    intents: (entry, cityQuery) => [
      {
        label: `${entry.name} garden experiences`,
        query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} garden tour`,
        description: `Helpful when visitors want a more structured outdoor visit or a quieter sightseeing option.`,
      },
    ],
    planningTips: () => [
      `Garden stops usually work best as part of a lighter daytime schedule instead of a rushed cross-city route.`,
    ],
  },
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function titleCaseCityName(name) {
  return name.replace(/\s+DC$/, " DC");
}

function chooseTopTargets(attractions) {
  return [...attractions]
    .sort((a, b) => {
      if (Boolean(b.featured) !== Boolean(a.featured)) return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      return (b.priority || 0) - (a.priority || 0);
    })
    .slice(0, ENRICH_LIMIT_PER_CITY);
}

function getEntryType(entry) {
  const rawType = entry.type || "";
  const normalizedType = TYPE_ALIASES[rawType] || rawType;
  return TRACKED_TYPES.includes(normalizedType) ? normalizedType : "general";
}

function getTypeTemplate(entry) {
  const type = getEntryType(entry);
  return TYPE_TEMPLATES[type] || null;
}

function dedupeStrings(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function dedupeIntentObjects(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.label || !item?.query) return false;
    const key = `${item.label}::${item.query}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSummary(entry, cityName) {
  const categories = Array.isArray(entry.categories) ? entry.categories : [];
  const template = getTypeTemplate(entry);
  if (template?.summary) return template.summary(entry, cityName);

  if (categories.includes("history")) return `${entry.name} is one of the more recognizable history-focused stops in ${cityName} for visitors building a first trip around the city's core landmarks.`;
  if (categories.includes("food")) return `${entry.name} is a useful ${cityName} stop for visitors planning around food, neighborhood time, and a more walkable day in the city.`;
  if (categories.includes("music")) return `${entry.name} is a strong ${cityName} stop for visitors planning around live music, nightlife, or a more culture-forward trip.`;
  if (categories.includes("outdoor") || entry.type === "park") return `${entry.name} gives visitors a practical outdoor counterweight to busier city blocks and works well as part of a broader ${cityName} day plan.`;
  return `${entry.name} is one of the more recognizable visitor stops in ${cityName} and works best when paired with a broader city plan instead of treated as an isolated stop.`;
}

function buildThingsToDo(entry) {
  const categories = Array.isArray(entry.categories) ? entry.categories : [];
  const type = getEntryType(entry);
  const template = getTypeTemplate(entry);
  const items = template?.thingsToDo ? [...template.thingsToDo(entry)] : [];

  if (categories.includes("history")) items.push(`Use ${entry.name} as a stop for a more history-focused city walk or half-day plan.`);
  if (categories.includes("food")) items.push(`Pair ${entry.name} with a meal, tasting stop, or nearby food-focused block instead of treating it as a standalone stop.`);
  if (categories.includes("music")) items.push(`Use ${entry.name} as part of a music-first evening or culture-focused route through the city.`);
  if (categories.includes("nightlife")) items.push(`Treat ${entry.name} as an evening block if nightlife is a major part of the trip.`);
  if (categories.includes("outdoor") || entry.type === "park") items.push(`Use ${entry.name} as a slower outdoor break between denser city attractions or tours.`);
  if (categories.includes("family")) items.push(`This area works well for visitors trying to keep a mixed-age itinerary simple.`);
  if (categories.includes("sightseeing") || categories.includes("landmark")) items.push(`Plan time for a short sightseeing loop and nearby photo stops instead of only passing through.`);

  if (!items.length) items.push(`Use ${entry.name} as one clear stop within a broader city day instead of overbuilding your itinerary around it.`);
  return dedupeStrings(items).slice(0, 3);
}

function buildExperienceIntents(entry, citySlug, cityName) {
  const categories = Array.isArray(entry.categories) ? entry.categories : [];
  const type = getEntryType(entry);
  const cityQuery = citySlug.replace(/-/g, " ");
  const template = getTypeTemplate(entry);
  const intents = template?.intents ? [...template.intents(entry, cityQuery, cityName)] : [];

  if (categories.includes("history")) {
    intents.push({
      label: `${entry.name} history tours`,
      query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} history tour`,
      description: `A simple starting point for visitors who want more context around ${entry.name}.`,
    });
  }
  if (categories.includes("food")) {
    intents.push({
      label: `${entry.name} food experiences`,
      query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} food tour`,
      description: `Helpful when ${entry.name} fits naturally into a food-first city plan.`,
    });
  }
  if (categories.includes("music")) {
    intents.push({
      label: `${entry.name} music experiences`,
      query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} music tour`,
      description: `Useful when you want a more structured music or nightlife plan around ${entry.name}.`,
    });
  }
  if (categories.includes("outdoor") || entry.type === "park") {
    intents.push({
      label: `${entry.name} outdoor experiences`,
      query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} outdoor tour`,
      description: `A safer starting point for visitors planning around scenery or time outside the city core.`,
    });
  }

  intents.push({
    label: `${entry.name} guided experiences`,
    query: `${cityQuery} ${entry.slug.replace(/-/g, " ")} tours`,
    description: `A general search path for tours and guided experiences connected to ${entry.name} in ${cityName}.`,
  });

  return dedupeIntentObjects(intents).slice(0, 3);
}

function buildPlanningTips(entry) {
  const categories = Array.isArray(entry.categories) ? entry.categories : [];
  const type = getEntryType(entry);
  const template = getTypeTemplate(entry);
  const tips = [
    `Plan ${entry.name} as part of a wider neighborhood or city block instead of making it the only stop in that part of the day.`,
  ];

  if (template?.planningTips) tips.push(...template.planningTips(entry));

  if (categories.includes("nightlife") || categories.includes("music")) {
    tips.push(`If ${entry.name} matters most after dark, keep the rest of the day lighter so the evening does not feel rushed.`);
  }
  if (categories.includes("outdoor") || entry.type === "park") {
    tips.push(`Outdoor stops usually work best when you pair them with one or two nearby indoor attractions instead of stacking too many transit-heavy moves.`);
  }
  if (categories.includes("history")) {
    tips.push(`A guided walk or city tour often gives ${entry.name} more value than a quick standalone pass-through.`);
  }

  return dedupeStrings(tips).slice(0, 3);
}

function buildRelatedAttractions(entry, allAttractions, citySlug) {
  return allAttractions
    .filter((item) => item.slug !== entry.slug)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 3)
    .map((item) => ({
      label: item.name,
      href: `/${citySlug}/${item.slug}`,
    }));
}

function buildNearbyAreas(entry, allAttractions) {
  return allAttractions
    .filter((item) => item.slug !== entry.slug)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 2)
    .map((item) => item.name);
}

const rolloutPath = path.join(ROOT, "data", "cities", `${rolloutName}.json`);
const rollout = readJson(rolloutPath);

if (!Array.isArray(rollout)) {
  console.error(`Rollout manifest not found or invalid: ${rolloutPath}`);
  process.exit(1);
}

let enrichedRecords = 0;
let preservedRecords = 0;
const enrichedByType = {};
const preservedByType = {};

for (const type of [...TRACKED_TYPES, "general"]) {
  enrichedByType[type] = 0;
  preservedByType[type] = 0;
}

for (const cityEntry of rollout) {
  const attractionsPath = path.join(ROOT, "data", "attractions", `${cityEntry.slug}.json`);
  const manifest = readJson(attractionsPath);
  if (!manifest || !Array.isArray(manifest.attractions) || manifest.attractions.length === 0) continue;

  const cityName = titleCaseCityName(cityEntry.name);
  const targets = chooseTopTargets(manifest.attractions);
  const targetSlugs = new Set(targets.map((item) => item.slug));
  let changed = false;

  manifest.attractions = manifest.attractions.map((entry) => {
    if (!targetSlugs.has(entry.slug)) return entry;

    let entryChanged = false;
    const next = { ...entry };

    if (!next.summary) {
      next.summary = buildSummary(next, cityName);
      entryChanged = true;
    }
    if (!Array.isArray(next.thingsToDo) || next.thingsToDo.length === 0) {
      next.thingsToDo = buildThingsToDo(next);
      entryChanged = true;
    }
    if (!Array.isArray(next.experienceIntents) || next.experienceIntents.length === 0) {
      next.experienceIntents = buildExperienceIntents(next, cityEntry.slug, cityName);
      entryChanged = true;
    }
    if (!Array.isArray(next.nearbyAreas) || next.nearbyAreas.length === 0) {
      next.nearbyAreas = buildNearbyAreas(next, manifest.attractions);
      entryChanged = true;
    }
    if (!Array.isArray(next.planningTips) || next.planningTips.length === 0) {
      next.planningTips = buildPlanningTips(next);
      entryChanged = true;
    }
    if (!Array.isArray(next.relatedAttractions) || next.relatedAttractions.length === 0) {
      next.relatedAttractions = buildRelatedAttractions(next, manifest.attractions, cityEntry.slug);
      entryChanged = true;
    }

    if (entryChanged) {
      enrichedRecords += 1;
      enrichedByType[getEntryType(next)] += 1;
      changed = true;
      return next;
    }

    preservedRecords += 1;
    preservedByType[getEntryType(entry)] += 1;
    return entry;
  });

  if (changed) writeJson(attractionsPath, manifest);
}

console.log(`Rollout: ${rolloutName}`);
console.log(`Enriched attraction records: ${enrichedRecords}`);
console.log(`Preserved richer records: ${preservedRecords}`);
console.log("Attraction enrichment summary by type:");
for (const type of [...TRACKED_TYPES, "general"]) {
  const enriched = enrichedByType[type];
  const preserved = preservedByType[type];
  if (enriched > 0 || preserved > 0) {
    console.log(`- ${type}: enriched ${enriched}, preserved ${preserved}`);
  }
}
