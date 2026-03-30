#!/usr/bin/env node

const checks = {
  atlanta: [
    "Best day-trip lanes",
    "Stone Mountain Park and summit day",
    "Savannah historic district escape",
    "North Georgia mountains and winery route",
    "Lake Lanier boating and beach day",
  ],
  boston: [
    "Best day-trip lanes",
    "Salem history day trip",
    "Cambridge and Harvard Square escape",
    "Cape Cod coastal day",
    "Newport mansions and shoreline route",
  ],
  chicago: [
    "Best day-trip lanes",
    "Indiana Dunes shoreline and trail day",
    "Milwaukee lakefront and brewery escape",
    "Starved Rock canyon and waterfall route",
    "Oak Park architecture and Frank Lloyd Wright day",
  ],
  denver: [
    "Best day-trip lanes",
    "Boulder Flatirons and Chautauqua hiking",
    "Rocky Mountain National Park and Trail Ridge Road",
    "Golden breweries and foothills day",
    "Estes Park and Rocky Mountain gateway",
  ],
  honolulu: [
    "Best day-trip lanes",
    "Pearl Harbor and USS Arizona block",
    "North Shore surf towns and beaches",
    "Circle-island scenic route",
    "East-side ocean and lookout escape",
  ],
  "las-vegas": [
    "Best day-trip lanes",
    "Hoover Dam and Boulder City route",
    "Valley of Fire red-rock escape",
    "Red Rock Canyon and scenic loop day",
    "Mount Charleston mountain reset",
  ],
  miami: [
    "Best day-trip lanes",
    "Everglades airboat and wildlife day",
    "Key Biscayne coastal reset",
    "Vizcaya and Coconut Grove escape",
    "Biscayne Bay boat and waterfront day",
  ],
  nashville: [
    "Best day-trip lanes",
    "Jack Daniel's Distillery and Lynchburg escape",
    "Franklin historic town and Civil War route",
    "Percy Warner Park hiking and nature day",
    "Lynchburg whiskey and backroads trail",
  ],
  "new-orleans": [
    "Best day-trip lanes",
    "Cajun country and Lafayette bayou escape",
    "Baton Rouge capitol and river history route",
    "Honey Island Swamp extension day",
    "River Road plantation drive",
  ],
  orlando: [
    "Best day-trip lanes",
    "Kennedy Space Center and rocket history day",
    "Cocoa Beach and Atlantic surf escape",
    "Winter Park boat and museum day",
    "Mount Dora lakeside and antique route",
  ],
  phoenix: [
    "Best day-trip lanes",
    "Sedona red rocks and canyon views",
    "Grand Canyon South Rim commitment day",
    "Apache Trail lakes and desert drive",
    "Jerome mining town and Verde Valley escape",
  ],
  "salt-lake-city": [
    "Best day-trip lanes",
    "Park City mountain-town escape",
    "Great Salt Lake and Antelope Island wildlife day",
    "Provo Canyon and Bridal Veil Falls route",
    "Ogden historic and mountain-edge reset",
  ],
  "san-diego": [
    "Best day-trip lanes",
    "La Jolla Cove and coastal wildlife day",
    "Balboa Park museums and garden escape",
    "Coronado Island and Hotel del day",
    "Torrey Pines hiking and glider views",
  ],
  "san-francisco": [
    "Best day-trip lanes",
    "Golden Gate and Sausalito escape",
    "Alcatraz and San Francisco Bay day",
    "Napa Valley wine-country route",
    "Muir Woods redwoods and coast reset",
  ],
  seattle: [
    "Best day-trip lanes",
    "Olympic National Park coast and rainforest day",
    "Mount Rainier scenic and hiking route",
    "San Juan Islands ferry and whale-watching escape",
    "Leavenworth Bavarian village day",
  ],
  tampa: [
    "Best day-trip lanes",
    "Clearwater Beach and Gulf sunset day",
    "St. Pete waterfront and museum escape",
    "Busch Gardens commitment day",
    "Weeki Wachee springs and wildlife route",
  ],
  austin: [
    "Best day-trip lanes",
    "Hill Country wineries and Fredericksburg day",
    "San Antonio River Walk escape",
    "Enchanted Rock hiking and granite dome day",
    "Lockhart BBQ trail and Texas-food reset",
  ],
  "washington-dc": [
    "Best day-trip lanes",
    "Annapolis and Chesapeake Bay sailing day",
    "Gettysburg battlefield and history route",
    "Shenandoah and Skyline Drive escape",
    "Baltimore harbor and museum pivot",
  ],
};

const baseUrl = process.argv[2] || "https://www.destinationcommandcenter.com";
const cities = process.argv.slice(3);
const targets = cities.length ? cities : Object.keys(checks);

let failures = 0;

for (const city of targets) {
  const expected = checks[city];
  if (!expected) {
    console.error(`SKIP ${city}: no check definition`);
    continue;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/${city}/day-trips`;
  const response = await fetch(url);
  const html = await response.text();

  if (!response.ok) {
    console.error(`FAIL ${city}: HTTP ${response.status} ${url}`);
    failures += 1;
    continue;
  }

  const missing = expected.filter((snippet) => !html.includes(snippet));
  const hasHero =
    html.includes("upload.wikimedia.org") ||
    html.includes("/images/authority/cities/") ||
    html.includes("<img");

  if (missing.length || !hasHero) {
    console.error(
      `FAIL ${city}: ${[
        !hasHero ? "hero-missing" : null,
        ...missing.map((item) => `missing:${item}`),
      ]
        .filter(Boolean)
        .join(", ")}`
    );
    failures += 1;
    continue;
  }

  console.log(`PASS ${city}: lanes + hero present`);
}

if (failures) process.exit(1);
