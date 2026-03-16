import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const rolloutName = process.argv[2] || "us-top-tourism";

const defaultCategories = [
  {
    slug: "walking-tours",
    title: "Walking Tours",
    description: "Guided city walks that help visitors get oriented quickly.",
  },
  {
    slug: "food-tours",
    title: "Food Tours",
    description: "Tastings and neighborhood food experiences that add local context to a trip.",
  },
  {
    slug: "sightseeing-tours",
    title: "Sightseeing Tours",
    description: "Broad city tours for visitors who want a stronger first look at the main highlights.",
  },
  {
    slug: "day-trips",
    title: "Day Trips",
    description: "Useful half-day and full-day escapes that pair well with a city stay.",
  },
  {
    slug: "private-tours",
    title: "Private Tours",
    description: "More tailored guided experiences for travelers who want flexibility or a slower pace.",
  },
  {
    slug: "night-tours",
    title: "Night Tours",
    description: "Evening experiences built around nightlife, views, or after-dark city energy.",
  },
  {
    slug: "history-tours",
    title: "History Tours",
    description: "Guided experiences that add cultural and historical context to major sights.",
  },
  {
    slug: "family-activities",
    title: "Family Activities",
    description: "Low-friction experiences that work well for mixed-age travel groups.",
  },
];

const cityExtras = {
  "new-orleans": [
    {
      slug: "ghost-tours",
      title: "Ghost Tours",
      description: "Evening ghost walks and haunted-history experiences that fit the city naturally.",
    },
    {
      slug: "swamp-tours",
      title: "Swamp Tours",
      description: "Bayou, marsh, and airboat experiences that pair city culture with Louisiana landscapes.",
    },
    {
      slug: "jazz-tours",
      title: "Jazz Tours",
      description: "Music-focused experiences that help visitors plan around the city's sound and venues.",
    },
  ],
  "las-vegas": [
    {
      slug: "helicopter-tours",
      title: "Helicopter Tours",
      description: "Flights over the Strip, nearby canyons, and high-impact desert scenery.",
    },
    {
      slug: "grand-canyon-tours",
      title: "Grand Canyon Tours",
      description: "Day-trip experiences from Vegas to the canyon by air, coach, or private tour.",
    },
    {
      slug: "nightlife-tours",
      title: "Nightlife Tours",
      description: "After-dark experiences for visitors planning a more structured Vegas night.",
    },
  ],
  honolulu: [
    {
      slug: "snorkeling-tours",
      title: "Snorkeling Tours",
      description: "Water-focused experiences that work well for first-time Hawaii trips.",
    },
    {
      slug: "surf-lessons",
      title: "Surf Lessons",
      description: "Beginner-friendly lessons and classic Honolulu beach experiences.",
    },
    {
      slug: "island-tours",
      title: "Island Tours",
      description: "Circle-island and scenic day tours that help visitors cover more ground.",
    },
  ],
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonIfMissing(filePath, data) {
  if (fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return true;
}

function titleCaseCityName(name) {
  return name.replace(/\s+DC$/, " DC");
}

function buildCityManifest(entry) {
  const cityName = titleCaseCityName(entry.name);
  return {
    slug: entry.slug,
    name: cityName,
    metadata: {
      title: `${cityName} Tours, Things to Do, and Attractions | Destination Command Center`,
      description: `Discover ${cityName} tours, things to do, attractions, food, neighborhoods, and trip ideas. Browse guided experiences and plan around the city's most useful travel highlights.`,
      keywords: [
        `${entry.slug.replace(/-/g, " ")} tours`,
        `things to do in ${entry.slug.replace(/-/g, " ")}`,
        `${entry.slug.replace(/-/g, " ")} attractions`,
        `${entry.slug.replace(/-/g, " ")} sightseeing`,
      ],
    },
    hero: {
      eyebrow: `${cityName} travel guide`,
      title: `${cityName} tours, things to do, and local travel planning`,
      summary: `Browse guided experiences, top attractions, neighborhood ideas, and practical planning paths for a stronger ${cityName} trip.`,
      trustLine: `Find tours, attractions, neighborhoods, and trip ideas in ${cityName}.`,
      primaryCtaLabel: "Browse Tours",
      primaryCtaHref: `/${entry.slug}/tours`,
      secondaryCtaLabel: "Explore Things to Do",
      secondaryCtaHref: `/${entry.slug}/things-to-do`,
    },
    tourCategories: [
      ...defaultCategories.slice(0, 4).map((category) => ({
        slug: category.slug,
        title: category.title,
        description: category.description,
      })),
      ...(cityExtras[entry.slug] || []).slice(0, 4),
    ],
    topAttractions: [],
    featuredTours: {
      title: `Popular ${cityName} experiences`,
      description: `Guided experiences and bookable activities that help visitors plan around ${cityName}'s most useful highlights.`,
      fallbackQueries: [
        `${entry.slug.replace(/-/g, " ")} walking tour`,
        `${entry.slug.replace(/-/g, " ")} food tour`,
        `${entry.slug.replace(/-/g, " ")} sightseeing tour`,
      ],
    },
    planningLinks: [
      {
        title: `Things to do in ${cityName}`,
        description: `A broader planning surface for attractions, neighborhoods, and trip ideas.`,
        href: `/${entry.slug}/things-to-do`,
      },
      {
        title: `${cityName} tours`,
        description: `A cleaner starting point for guided experiences, day trips, and visitor favorites.`,
        href: `/${entry.slug}/tours`,
      },
      {
        title: `${cityName} food guide`,
        description: `Restaurants, food neighborhoods, and tasting-focused experiences.`,
        href: `/${entry.slug}/food`,
      },
      {
        title: `${cityName} day trips`,
        description: `Half-day and full-day options that fit naturally with a city stay.`,
        href: `/${entry.slug}/day-trips`,
      },
    ],
    faq: [
      {
        q: `What are the best tours in ${cityName} for first-time visitors?`,
        a: `Many first-time visitors start with a broad sightseeing experience, one neighborhood or food-focused tour, and a single attraction or day trip that fits the pace of the city.`,
      },
      {
        q: `How many days should you spend in ${cityName}?`,
        a: `A strong first visit is usually 2 to 4 days, depending on how many major attractions, neighborhoods, and guided experiences you want to fit into one trip.`,
      },
    ],
  };
}

function buildAttractionsManifest(entry) {
  return {
    citySlug: entry.slug,
    cityName: titleCaseCityName(entry.name),
    attractions: [],
  };
}

function buildCategoriesManifest(entry) {
  return {
    citySlug: entry.slug,
    cityName: titleCaseCityName(entry.name),
    categories: [...defaultCategories, ...(cityExtras[entry.slug] || [])].map((category) => ({
      slug: category.slug,
      title: category.title,
      description: category.description,
      intro: `${category.title} are one of the more useful ways to add structure and local context to a ${titleCaseCityName(entry.name)} trip.`,
      bullets: [
        "Useful for first-time visitors who want a clearer starting point.",
        "Works well when you want a guided option instead of piecing the day together yourself.",
      ],
      intents: [
        {
          label: category.title,
          query: `${entry.slug.replace(/-/g, " ")} ${category.slug.replace(/-/g, " ")}`,
          description: `A straightforward starting query for ${category.title.toLowerCase()} in ${titleCaseCityName(entry.name)}.`,
        },
      ],
    })),
  };
}

const rolloutPath = path.join(ROOT, "data", "cities", `${rolloutName}.json`);
const rolloutEntries = readJson(rolloutPath);

if (!Array.isArray(rolloutEntries)) {
  console.error(`Rollout manifest not found or invalid: ${rolloutPath}`);
  process.exit(1);
}

const created = [];

for (const entry of rolloutEntries) {
  const cityPath = path.join(ROOT, "data", "cities", `${entry.slug}.json`);
  const attractionsPath = path.join(ROOT, "data", "attractions", `${entry.slug}.json`);
  const categoriesPath = path.join(ROOT, "data", "categories", `${entry.slug}.json`);

  if (writeJsonIfMissing(cityPath, buildCityManifest(entry))) created.push(path.relative(ROOT, cityPath));
  if (writeJsonIfMissing(attractionsPath, buildAttractionsManifest(entry))) created.push(path.relative(ROOT, attractionsPath));
  if (writeJsonIfMissing(categoriesPath, buildCategoriesManifest(entry))) created.push(path.relative(ROOT, categoriesPath));
}

if (created.length === 0) {
  console.log(`No new manifest files created for rollout "${rolloutName}".`);
} else {
  console.log(`Created ${created.length} manifest files for rollout "${rolloutName}":`);
  for (const file of created) console.log(`- ${file}`);
}
