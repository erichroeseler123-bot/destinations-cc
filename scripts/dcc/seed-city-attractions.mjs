import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const rolloutName = process.argv[2] || "us-top-tourism";

const STARTER_ATTRACTIONS = {
  "new-york": [
    { slug: "statue-of-liberty", name: "Statue of Liberty", type: "landmark", categories: ["landmark", "history", "sightseeing"], priority: 100, featured: true },
    { slug: "central-park", name: "Central Park", type: "park", categories: ["park", "family", "outdoor"], priority: 95, featured: true },
    { slug: "times-square", name: "Times Square", type: "district", categories: ["landmark", "nightlife", "sightseeing"], priority: 90, featured: true },
    { slug: "brooklyn-bridge", name: "Brooklyn Bridge", type: "landmark", categories: ["landmark", "walks", "sightseeing"], priority: 85, featured: false },
  ],
  "las-vegas": [
    { slug: "las-vegas-strip", name: "Las Vegas Strip", type: "district", categories: ["nightlife", "sightseeing", "landmark"], priority: 100, featured: true },
    { slug: "fremont-street", name: "Fremont Street Experience", type: "district", categories: ["nightlife", "music", "sightseeing"], priority: 95, featured: true },
    { slug: "sphere-las-vegas", name: "Sphere", type: "venue", categories: ["shows", "landmark", "music"], priority: 90, featured: true },
    { slug: "red-rock-canyon", name: "Red Rock Canyon", type: "park", categories: ["outdoor", "day-trips", "scenic"], priority: 85, featured: false },
  ],
  orlando: [
    { slug: "walt-disney-world", name: "Walt Disney World", type: "theme-park", categories: ["family", "theme-park"], priority: 100, featured: true },
    { slug: "universal-orlando", name: "Universal Orlando Resort", type: "theme-park", categories: ["family", "theme-park"], priority: 95, featured: true },
    { slug: "icon-park", name: "ICON Park", type: "attraction-district", categories: ["family", "sightseeing"], priority: 85, featured: false },
    { slug: "disney-springs", name: "Disney Springs", type: "district", categories: ["shopping", "food", "family"], priority: 80, featured: false },
  ],
  miami: [
    { slug: "south-beach", name: "South Beach", type: "beach", categories: ["beach", "nightlife", "sightseeing"], priority: 100, featured: true },
    { slug: "wynwood", name: "Wynwood", type: "district", categories: ["art", "food", "nightlife"], priority: 95, featured: true },
    { slug: "little-havana", name: "Little Havana", type: "district", categories: ["food", "culture", "music"], priority: 90, featured: true },
    { slug: "vizcaya-museum-gardens", name: "Vizcaya Museum & Gardens", type: "museum", categories: ["history", "culture", "gardens"], priority: 80, featured: false },
  ],
  "los-angeles": [
    { slug: "hollywood-sign", name: "Hollywood Sign", type: "landmark", categories: ["landmark", "sightseeing"], priority: 100, featured: true },
    { slug: "griffith-observatory", name: "Griffith Observatory", type: "landmark", categories: ["landmark", "views", "family"], priority: 95, featured: true },
    { slug: "santa-monica-pier", name: "Santa Monica Pier", type: "pier", categories: ["beach", "family", "sightseeing"], priority: 90, featured: true },
    { slug: "the-getty-center", name: "The Getty Center", type: "museum", categories: ["museum", "culture", "views"], priority: 80, featured: false },
  ],
  "san-francisco": [
    { slug: "golden-gate-bridge", name: "Golden Gate Bridge", type: "landmark", categories: ["landmark", "sightseeing", "views"], priority: 100, featured: true },
    { slug: "alcatraz", name: "Alcatraz Island", type: "historic-site", categories: ["history", "landmark", "tour"], priority: 95, featured: true },
    { slug: "fishermans-wharf", name: "Fisherman's Wharf", type: "district", categories: ["food", "waterfront", "family"], priority: 90, featured: true },
    { slug: "golden-gate-park", name: "Golden Gate Park", type: "park", categories: ["park", "family", "outdoor"], priority: 80, featured: false },
  ],
  "san-diego": [
    { slug: "balboa-park", name: "Balboa Park", type: "park", categories: ["park", "museum", "family"], priority: 100, featured: true },
    { slug: "san-diego-zoo", name: "San Diego Zoo", type: "zoo", categories: ["family", "wildlife"], priority: 95, featured: true },
    { slug: "la-jolla-cove", name: "La Jolla Cove", type: "coastline", categories: ["beach", "outdoor", "wildlife"], priority: 90, featured: true },
    { slug: "old-town-san-diego", name: "Old Town San Diego", type: "historic-district", categories: ["history", "food", "culture"], priority: 80, featured: false },
  ],
  honolulu: [
    { slug: "waikiki", name: "Waikiki", type: "district", categories: ["beach", "shopping", "nightlife"], priority: 100, featured: true },
    { slug: "diamond-head", name: "Diamond Head", type: "landmark", categories: ["outdoor", "hiking", "views"], priority: 95, featured: true },
    { slug: "pearl-harbor", name: "Pearl Harbor", type: "historic-site", categories: ["history", "museum"], priority: 90, featured: true },
    { slug: "hanauma-bay", name: "Hanauma Bay", type: "nature-area", categories: ["snorkeling", "beach", "outdoor"], priority: 85, featured: false },
  ],
  chicago: [
    { slug: "millennium-park", name: "Millennium Park", type: "park", categories: ["park", "landmark", "family"], priority: 100, featured: true },
    { slug: "navy-pier", name: "Navy Pier", type: "waterfront", categories: ["family", "waterfront", "sightseeing"], priority: 95, featured: true },
    { slug: "art-institute-of-chicago", name: "Art Institute of Chicago", type: "museum", categories: ["museum", "culture"], priority: 90, featured: true },
    { slug: "chicago-riverwalk", name: "Chicago Riverwalk", type: "waterfront", categories: ["walks", "food", "sightseeing"], priority: 80, featured: false },
  ],
  "washington-dc": [
    { slug: "national-mall", name: "National Mall", type: "landmark", categories: ["landmark", "history", "sightseeing"], priority: 100, featured: true },
    { slug: "smithsonian-museums", name: "Smithsonian Museums", type: "museum-cluster", categories: ["museum", "history", "family"], priority: 95, featured: true },
    { slug: "georgetown", name: "Georgetown", type: "district", categories: ["shopping", "food", "walks"], priority: 85, featured: false },
    { slug: "capitol-hill", name: "Capitol Hill", type: "district", categories: ["history", "government", "walks"], priority: 80, featured: false },
  ],
  boston: [
    { slug: "freedom-trail", name: "Freedom Trail", type: "historic-route", categories: ["history", "walks", "sightseeing"], priority: 100, featured: true },
    { slug: "faneuil-hall", name: "Faneuil Hall", type: "historic-market", categories: ["history", "food", "shopping"], priority: 95, featured: true },
    { slug: "fenway-park", name: "Fenway Park", type: "stadium", categories: ["sports", "history"], priority: 85, featured: false },
    { slug: "boston-common", name: "Boston Common", type: "park", categories: ["park", "history", "walks"], priority: 80, featured: false },
  ],
  seattle: [
    { slug: "pike-place-market", name: "Pike Place Market", type: "market", categories: ["food", "shopping", "sightseeing"], priority: 100, featured: true },
    { slug: "space-needle", name: "Space Needle", type: "landmark", categories: ["landmark", "views"], priority: 95, featured: true },
    { slug: "chihuly-garden-and-glass", name: "Chihuly Garden and Glass", type: "museum", categories: ["art", "museum"], priority: 85, featured: false },
    { slug: "waterfront-park", name: "Seattle Waterfront", type: "waterfront", categories: ["waterfront", "walks", "sightseeing"], priority: 80, featured: false },
  ],
  austin: [
    { slug: "south-congress", name: "South Congress", type: "district", categories: ["shopping", "food", "nightlife"], priority: 100, featured: true },
    { slug: "zilker-park", name: "Zilker Park", type: "park", categories: ["park", "outdoor", "family"], priority: 95, featured: true },
    { slug: "lady-bird-lake", name: "Lady Bird Lake", type: "waterfront", categories: ["outdoor", "kayaking", "walks"], priority: 90, featured: true },
    { slug: "sixth-street", name: "Sixth Street", type: "district", categories: ["music", "nightlife"], priority: 85, featured: false },
  ],
  nashville: [
    { slug: "broadway", name: "Broadway", type: "district", categories: ["music", "nightlife", "food"], priority: 100, featured: true },
    { slug: "country-music-hall-of-fame", name: "Country Music Hall of Fame", type: "museum", categories: ["music", "museum", "history"], priority: 95, featured: true },
    { slug: "ryman-auditorium", name: "Ryman Auditorium", type: "venue", categories: ["music", "history"], priority: 90, featured: true },
    { slug: "the-gulch", name: "The Gulch", type: "district", categories: ["food", "shopping", "nightlife"], priority: 80, featured: false },
  ],
  "new-orleans": [
    { slug: "french-quarter", name: "French Quarter", type: "historic-district", categories: ["history", "food", "music"], priority: 100, featured: true },
    { slug: "garden-district", name: "Garden District", type: "historic-district", categories: ["history", "walks"], priority: 95, featured: true },
    { slug: "frenchmen-street", name: "Frenchmen Street", type: "district", categories: ["music", "nightlife"], priority: 90, featured: true },
    { slug: "jackson-square", name: "Jackson Square", type: "landmark", categories: ["history", "sightseeing"], priority: 85, featured: false },
  ],
  charleston: [
    { slug: "historic-charleston", name: "Historic Charleston", type: "historic-district", categories: ["history", "walks"], priority: 100, featured: true },
    { slug: "waterfront-park", name: "Waterfront Park", type: "park", categories: ["waterfront", "walks"], priority: 90, featured: true },
    { slug: "charleston-city-market", name: "Charleston City Market", type: "market", categories: ["shopping", "history"], priority: 85, featured: false },
    { slug: "fort-sumter", name: "Fort Sumter", type: "historic-site", categories: ["history", "boat-tours"], priority: 80, featured: false },
  ],
  savannah: [
    { slug: "historic-district", name: "Historic District", type: "historic-district", categories: ["history", "walks"], priority: 100, featured: true },
    { slug: "river-street", name: "River Street", type: "district", categories: ["waterfront", "food", "shopping"], priority: 95, featured: true },
    { slug: "forsyth-park", name: "Forsyth Park", type: "park", categories: ["park", "walks"], priority: 85, featured: false },
    { slug: "bonaventure-cemetery", name: "Bonaventure Cemetery", type: "historic-site", categories: ["history", "ghost-tours"], priority: 80, featured: false },
  ],
  denver: [
    { slug: "red-rocks-amphitheatre", name: "Red Rocks Amphitheatre", type: "venue", categories: ["music", "outdoor"], priority: 100, featured: true },
    { slug: "union-station", name: "Union Station", type: "landmark", categories: ["food", "history", "shopping"], priority: 90, featured: true },
    { slug: "ri-no", name: "RiNo Art District", type: "district", categories: ["art", "food", "nightlife"], priority: 85, featured: false },
    { slug: "meow-wolf-denver", name: "Meow Wolf Denver", type: "attraction", categories: ["art", "family", "nightlife"], priority: 80, featured: false },
  ],
  phoenix: [
    { slug: "desert-botanical-garden", name: "Desert Botanical Garden", type: "garden", categories: ["outdoor", "family"], priority: 100, featured: true },
    { slug: "camelback-mountain", name: "Camelback Mountain", type: "landmark", categories: ["hiking", "outdoor", "views"], priority: 95, featured: true },
    { slug: "old-town-scottsdale", name: "Old Town Scottsdale", type: "district", categories: ["shopping", "food", "nightlife"], priority: 85, featured: false },
    { slug: "papago-park", name: "Papago Park", type: "park", categories: ["outdoor", "hiking"], priority: 80, featured: false },
  ],
  scottsdale: [
    { slug: "old-town-scottsdale", name: "Old Town Scottsdale", type: "district", categories: ["shopping", "food", "nightlife"], priority: 100, featured: true },
    { slug: "taliesin-west", name: "Taliesin West", type: "historic-site", categories: ["architecture", "history"], priority: 90, featured: true },
    { slug: "mcdowell-sonoran-preserve", name: "McDowell Sonoran Preserve", type: "nature-area", categories: ["hiking", "outdoor"], priority: 85, featured: false },
    { slug: "scottsdale-fashion-square", name: "Scottsdale Fashion Square", type: "shopping-district", categories: ["shopping", "luxury"], priority: 80, featured: false },
  ],
  "san-antonio": [
    { slug: "the-alamo", name: "The Alamo", type: "historic-site", categories: ["history", "landmark"], priority: 100, featured: true },
    { slug: "river-walk", name: "San Antonio River Walk", type: "waterfront", categories: ["food", "walks", "sightseeing"], priority: 95, featured: true },
    { slug: "market-square", name: "Market Square", type: "market", categories: ["food", "shopping", "culture"], priority: 85, featured: false },
    { slug: "san-antonio-missions", name: "San Antonio Missions", type: "historic-site", categories: ["history", "culture"], priority: 80, featured: false },
  ],
  tampa: [
    { slug: "ybor-city", name: "Ybor City", type: "historic-district", categories: ["food", "nightlife", "history"], priority: 100, featured: true },
    { slug: "tampa-riverwalk", name: "Tampa Riverwalk", type: "waterfront", categories: ["walks", "waterfront", "family"], priority: 95, featured: true },
    { slug: "busch-gardens-tampa-bay", name: "Busch Gardens Tampa Bay", type: "theme-park", categories: ["family", "theme-park"], priority: 90, featured: true },
    { slug: "sparkman-wharf", name: "Sparkman Wharf", type: "waterfront", categories: ["food", "nightlife"], priority: 80, featured: false },
  ],
  "key-west": [
    { slug: "duval-street", name: "Duval Street", type: "district", categories: ["nightlife", "food", "shopping"], priority: 100, featured: true },
    { slug: "mallory-square", name: "Mallory Square", type: "waterfront", categories: ["sunset", "sightseeing"], priority: 95, featured: true },
    { slug: "ernest-hemingway-home", name: "Ernest Hemingway Home", type: "historic-site", categories: ["history", "culture"], priority: 85, featured: false },
    { slug: "dry-tortugas", name: "Dry Tortugas National Park", type: "park", categories: ["day-trips", "outdoor", "snorkeling"], priority: 80, featured: false },
  ],
  portland: [
    { slug: "powells-city-of-books", name: "Powell's City of Books", type: "landmark", categories: ["shopping", "culture"], priority: 100, featured: true },
    { slug: "washington-park", name: "Washington Park", type: "park", categories: ["park", "family"], priority: 95, featured: true },
    { slug: "pearl-district", name: "Pearl District", type: "district", categories: ["food", "shopping", "walks"], priority: 85, featured: false },
    { slug: "lan-su-chinese-garden", name: "Lan Su Chinese Garden", type: "garden", categories: ["culture", "walks"], priority: 80, featured: false },
  ],
  "salt-lake-city": [
    { slug: "temple-square", name: "Temple Square", type: "landmark", categories: ["history", "culture"], priority: 100, featured: true },
    { slug: "park-city-day-trip", name: "Park City", type: "day-trip", categories: ["day-trips", "outdoor", "ski"], priority: 95, featured: true },
    { slug: "big-cottonwood-canyon", name: "Big Cottonwood Canyon", type: "nature-area", categories: ["outdoor", "hiking", "scenic"], priority: 85, featured: false },
    { slug: "red-butte-garden", name: "Red Butte Garden", type: "garden", categories: ["gardens", "outdoor"], priority: 80, featured: false },
  ],
};

const SECOND_TIER_ATTRACTIONS = {
  "new-york": [
    { slug: "metropolitan-museum-of-art", name: "The Metropolitan Museum of Art", type: "museum", categories: ["museum", "culture", "history"], priority: 78, featured: false },
    { slug: "high-line", name: "The High Line", type: "park", categories: ["walks", "outdoor", "sightseeing"], priority: 76, featured: false },
  ],
  "las-vegas": [
    { slug: "bellagio-fountains", name: "Bellagio Fountains", type: "landmark", categories: ["landmark", "sightseeing", "nightlife"], priority: 78, featured: false },
    { slug: "high-roller", name: "High Roller", type: "landmark", categories: ["views", "sightseeing", "nightlife"], priority: 75, featured: false },
  ],
  orlando: [
    { slug: "sea-world-orlando", name: "SeaWorld Orlando", type: "theme-park", categories: ["family", "theme-park"], priority: 78, featured: false },
    { slug: "kennedy-space-center", name: "Kennedy Space Center", type: "historic-site", categories: ["history", "family", "day-trips"], priority: 74, featured: false },
  ],
  miami: [
    { slug: "bayside-marketplace", name: "Bayside Marketplace", type: "market", categories: ["shopping", "food", "waterfront"], priority: 78, featured: false },
    { slug: "perez-art-museum-miami", name: "Perez Art Museum Miami", type: "museum", categories: ["museum", "culture", "waterfront"], priority: 74, featured: false },
  ],
  "los-angeles": [
    { slug: "venice-beach", name: "Venice Beach", type: "waterfront", categories: ["beach", "walks", "sightseeing"], priority: 78, featured: false },
    { slug: "rodeo-drive", name: "Rodeo Drive", type: "shopping-district", categories: ["shopping", "luxury", "sightseeing"], priority: 74, featured: false },
  ],
  "san-francisco": [
    { slug: "chinatown", name: "Chinatown", type: "district", categories: ["food", "culture", "walks"], priority: 78, featured: false },
    { slug: "lombard-street", name: "Lombard Street", type: "landmark", categories: ["landmark", "views", "sightseeing"], priority: 74, featured: false },
  ],
  "san-diego": [
    { slug: "gaslamp-quarter", name: "Gaslamp Quarter", type: "district", categories: ["nightlife", "food", "walks"], priority: 78, featured: false },
    { slug: "coronado-beach", name: "Coronado Beach", type: "waterfront", categories: ["beach", "family", "sightseeing"], priority: 74, featured: false },
  ],
  honolulu: [
    { slug: "iolani-palace", name: "Iolani Palace", type: "historic-site", categories: ["history", "culture", "sightseeing"], priority: 78, featured: false },
    { slug: "ala-moana-beach-park", name: "Ala Moana Beach Park", type: "waterfront", categories: ["beach", "park", "outdoor"], priority: 74, featured: false },
  ],
  chicago: [
    { slug: "willis-tower", name: "Willis Tower", type: "landmark", categories: ["views", "landmark", "sightseeing"], priority: 78, featured: false },
    { slug: "lincoln-park", name: "Lincoln Park", type: "park", categories: ["park", "walks", "family"], priority: 74, featured: false },
  ],
  "washington-dc": [
    { slug: "white-house", name: "White House", type: "historic-site", categories: ["history", "government", "landmark"], priority: 78, featured: false },
    { slug: "lincoln-memorial", name: "Lincoln Memorial", type: "landmark", categories: ["history", "landmark", "sightseeing"], priority: 74, featured: false },
  ],
  boston: [
    { slug: "north-end", name: "North End", type: "district", categories: ["food", "history", "walks"], priority: 78, featured: false },
    { slug: "museum-of-fine-arts-boston", name: "Museum of Fine Arts, Boston", type: "museum", categories: ["museum", "culture", "history"], priority: 74, featured: false },
  ],
  seattle: [
    { slug: "kerry-park", name: "Kerry Park", type: "park", categories: ["views", "park", "sightseeing"], priority: 78, featured: false },
    { slug: "pioneer-square", name: "Pioneer Square", type: "historic-district", categories: ["history", "walks", "food"], priority: 74, featured: false },
  ],
  austin: [
    { slug: "barton-springs-pool", name: "Barton Springs Pool", type: "park", categories: ["outdoor", "family", "swimming"], priority: 78, featured: false },
    { slug: "rainey-street", name: "Rainey Street", type: "district", categories: ["nightlife", "food", "music"], priority: 74, featured: false },
  ],
  nashville: [
    { slug: "broadway", name: "Broadway", type: "district", categories: ["music", "nightlife", "food"], priority: 78, featured: false },
    { slug: "country-music-hall-of-fame", name: "Country Music Hall of Fame", type: "museum", categories: ["music", "museum", "history"], priority: 74, featured: false },
  ],
  "new-orleans": [
    { slug: "bourbon-street", name: "Bourbon Street", type: "district", categories: ["nightlife", "music", "food"], priority: 78, featured: false },
    { slug: "national-wwii-museum", name: "The National WWII Museum", type: "museum", categories: ["museum", "history", "culture"], priority: 74, featured: false },
  ],
  charleston: [
    { slug: "rainbow-row", name: "Rainbow Row", type: "landmark", categories: ["history", "landmark", "walks"], priority: 78, featured: false },
    { slug: "the-battery", name: "The Battery", type: "waterfront", categories: ["walks", "history", "sightseeing"], priority: 74, featured: false },
  ],
  savannah: [
    { slug: "forsyth-park", name: "Forsyth Park", type: "park", categories: ["park", "walks", "sightseeing"], priority: 78, featured: false },
    { slug: "river-street", name: "River Street", type: "waterfront", categories: ["food", "walks", "shopping"], priority: 74, featured: false },
  ],
  denver: [
    { slug: "denver-art-museum", name: "Denver Art Museum", type: "museum", categories: ["museum", "culture", "family"], priority: 78, featured: false },
    { slug: "larimer-square", name: "Larimer Square", type: "district", categories: ["food", "nightlife", "shopping"], priority: 74, featured: false },
  ],
  phoenix: [
    { slug: "heard-museum", name: "Heard Museum", type: "museum", categories: ["museum", "culture", "history"], priority: 78, featured: false },
    { slug: "south-mountain-park", name: "South Mountain Park", type: "nature-area", categories: ["outdoor", "hiking", "scenic"], priority: 74, featured: false },
  ],
  scottsdale: [
    { slug: "western-spirit-museum", name: "Western Spirit: Scottsdale's Museum of the West", type: "museum", categories: ["museum", "history", "culture"], priority: 78, featured: false },
    { slug: "scottsdale-quarter", name: "Scottsdale Quarter", type: "shopping-district", categories: ["shopping", "food", "walks"], priority: 74, featured: false },
  ],
  "san-antonio": [
    { slug: "pearl-district", name: "Pearl District", type: "district", categories: ["food", "walks", "shopping"], priority: 78, featured: false },
    { slug: "tower-of-the-americas", name: "Tower of the Americas", type: "landmark", categories: ["views", "landmark", "sightseeing"], priority: 74, featured: false },
  ],
  tampa: [
    { slug: "tampa-theatre", name: "Tampa Theatre", type: "historic-site", categories: ["history", "culture", "architecture"], priority: 78, featured: false },
    { slug: "florida-aquarium", name: "The Florida Aquarium", type: "attraction", categories: ["family", "wildlife", "waterfront"], priority: 74, featured: false },
  ],
  "key-west": [
    { slug: "southernmost-point", name: "Southernmost Point", type: "landmark", categories: ["landmark", "sightseeing", "walks"], priority: 78, featured: false },
    { slug: "key-west-butterfly-conservatory", name: "Key West Butterfly and Nature Conservatory", type: "garden", categories: ["family", "nature", "indoor"], priority: 74, featured: false },
  ],
  portland: [
    { slug: "portland-japanese-garden", name: "Portland Japanese Garden", type: "garden", categories: ["gardens", "walks", "culture"], priority: 78, featured: false },
    { slug: "tom-mccall-waterfront-park", name: "Tom McCall Waterfront Park", type: "waterfront", categories: ["walks", "park", "sightseeing"], priority: 74, featured: false },
  ],
  "salt-lake-city": [
    { slug: "utah-state-capitol", name: "Utah State Capitol", type: "landmark", categories: ["history", "landmark", "views"], priority: 78, featured: false },
    { slug: "great-salt-lake", name: "Great Salt Lake", type: "nature-area", categories: ["outdoor", "scenic", "day-trips"], priority: 74, featured: false },
  ],
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

function toLabel(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\bDc\b/g, "DC");
}

function buildStarterAttraction(cityEntry, item) {
  const cityName = titleCaseCityName(cityEntry.name);
  return {
    slug: item.slug,
    name: item.name,
    type: item.type,
    summary: "",
    categories: item.categories || [],
    priority: item.priority,
    featured: Boolean(item.featured),
    heroTitle: `${item.name} guide, things to do, and local tours`,
    heroSummary: `Planning guide for ${item.name} in ${cityName}, with visitor basics and helpful local experiences.`,
    thingsToDo: [],
    visitorInfo: [],
    planningTips: [],
    experienceIntents: [],
    relatedAttractions: [],
    primaryToursHref: `/${cityEntry.slug}/${item.slug}/tours`,
    thingsToDoHref: `/${cityEntry.slug}/things-to-do`,
    schemaType: item.type === "historic-site" || item.type === "landmark" ? "LandmarksOrHistoricalBuildings" : "TouristAttraction",
  };
}

const rolloutPath = path.join(ROOT, "data", "cities", `${rolloutName}.json`);
const rollout = readJson(rolloutPath);

if (!Array.isArray(rollout)) {
  console.error(`Rollout manifest not found or invalid: ${rolloutPath}`);
  process.exit(1);
}

let createdFiles = 0;
let appendedRecords = 0;
let preservedRecords = 0;
let appendedTopAttractions = 0;

for (const cityEntry of rollout) {
  const starter = [
    ...(STARTER_ATTRACTIONS[cityEntry.slug] || []),
    ...(SECOND_TIER_ATTRACTIONS[cityEntry.slug] || []),
  ];
  if (!starter.length) continue;

  const attractionsPath = path.join(ROOT, "data", "attractions", `${cityEntry.slug}.json`);
  const cityPath = path.join(ROOT, "data", "cities", `${cityEntry.slug}.json`);

  const attractionsManifest =
    readJson(attractionsPath) || {
      citySlug: cityEntry.slug,
      cityName: titleCaseCityName(cityEntry.name),
      attractions: [],
    };

  const cityManifest = readJson(cityPath);
  const existingAttractionSlugs = new Set((attractionsManifest.attractions || []).map((item) => item.slug));

  if (!fs.existsSync(attractionsPath)) createdFiles += 1;

  for (const item of starter) {
    if (existingAttractionSlugs.has(item.slug)) {
      preservedRecords += 1;
      continue;
    }
    attractionsManifest.attractions.push(buildStarterAttraction(cityEntry, item));
    existingAttractionSlugs.add(item.slug);
    appendedRecords += 1;
  }

  attractionsManifest.attractions.sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.name.localeCompare(b.name));
  writeJson(attractionsPath, attractionsManifest);

  if (cityManifest && Array.isArray(cityManifest.topAttractions)) {
    const existingTopAttractionSlugs = new Set(cityManifest.topAttractions.map((item) => item.slug));
    for (const item of starter) {
      if (existingTopAttractionSlugs.has(item.slug)) continue;
      cityManifest.topAttractions.push({
        slug: item.slug,
        title: item.name,
        description: "",
      });
      existingTopAttractionSlugs.add(item.slug);
      appendedTopAttractions += 1;
    }
    writeJson(cityPath, cityManifest);
  }
}

console.log(`Rollout: ${rolloutName}`);
console.log(`Created attraction files: ${createdFiles}`);
console.log(`Appended attraction records: ${appendedRecords}`);
console.log(`Preserved existing records: ${preservedRecords}`);
console.log(`Appended city topAttractions entries: ${appendedTopAttractions}`);
