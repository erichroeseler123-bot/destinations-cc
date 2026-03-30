export const dynamicParams = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import aliases from "@/data/city-aliases.json";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";
import { getCityIntents, type IntentItem, titleCase } from "@/src/data/city-intents";
import { getCityManifest } from "@/lib/dcc/manifests/cityExpansion";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

type Params = { city: string };

const DAY_TRIP_OVERRIDES: Record<string, IntentItem[]> = {
  atlanta: [
    {
      title: "Stone Mountain Park and summit day",
      description:
        "Best when the trip needs an easy Atlanta-area reset with mountain views, park time, and a cleaner contrast than another in-town block.",
      query: "stone mountain day trip from atlanta",
      badge: "Most popular",
    },
    {
      title: "Savannah historic district escape",
      description:
        "A longer heritage-first lane when the goal is a full Georgia contrast with squares, waterfront walking, and a decisive break from metro pace.",
      query: "savannah day trip from atlanta",
      badge: "Full-day",
    },
    {
      title: "North Georgia mountains and winery route",
      description:
        "The strongest scenic reset if the day should lean into foothills, tasting rooms, and cooler mountain air instead of city sightseeing.",
      query: "north georgia wine country day trip from atlanta",
      badge: "Scenic",
    },
    {
      title: "Lake Lanier boating and beach day",
      description:
        "Good when the trip needs a water-first summer lane with marinas, shoreline time, and less logistics than a longer road-day.",
      query: "lake lanier day trip from atlanta",
      badge: "Waterfront",
    },
  ],
  boston: [
    {
      title: "Salem history day trip",
      description:
        "Best when you want a full witch-trials and harbor-history pivot instead of repeating another downtown Boston block.",
      query: "salem day trip from boston",
      badge: "Most popular",
    },
    {
      title: "Cambridge and Harvard Square escape",
      description:
        "A lighter half-day contrast for bookstores, campus walks, and neighborhood meals without committing to a long transfer.",
      query: "cambridge harvard square tour from boston",
      badge: "Easy half-day",
    },
    {
      title: "Cape Cod coastal day",
      description:
        "The cleanest beach-and-harbor contrast if the trip needs salt air, seafood, and a full break from the city grid.",
      query: "cape cod day trip from boston",
      badge: "Coastal",
    },
    {
      title: "Newport mansions and shoreline route",
      description:
        "Good when you want a longer architecture-and-ocean lane that feels distinct from Boston’s history core.",
      query: "newport rhode island day trip from boston",
      badge: "Full-day",
    },
  ],
  chicago: [
    {
      title: "Indiana Dunes shoreline and trail day",
      description:
        "Best when the trip needs a real lakefront nature contrast with dunes, beaches, and a full break from the downtown Chicago grid.",
      query: "indiana dunes day trip from chicago",
      badge: "Most popular",
    },
    {
      title: "Milwaukee lakefront and brewery escape",
      description:
        "A clean second-city pivot when you want waterfront movement, beer stops, and a day that feels distinct from central Chicago neighborhoods.",
      query: "milwaukee day trip from chicago",
      badge: "Urban contrast",
    },
    {
      title: "Starved Rock canyon and waterfall route",
      description:
        "The strongest nature-first lane when the goal is hiking, sandstone canyons, and a proper all-day reset beyond the city skyline.",
      query: "starved rock day trip from chicago",
      badge: "Nature",
    },
    {
      title: "Oak Park architecture and Frank Lloyd Wright day",
      description:
        "Good when you want a shorter design-and-neighborhood escape with strong architecture payoff and less transfer friction than a longer road-day.",
      query: "oak park frank lloyd wright tour from chicago",
      badge: "Easy half-day",
    },
  ],
  honolulu: [
    {
      title: "Pearl Harbor and USS Arizona block",
      description:
        "Best when the day needs a dedicated memorial-and-history anchor instead of squeezing Pearl Harbor between Waikiki errands.",
      query: "pearl harbor tour from honolulu",
      badge: "Most popular",
    },
    {
      title: "North Shore surf towns and beaches",
      description:
        "The cleanest contrast when you want Oahu to feel bigger than Waikiki and trade resort density for surf-town rhythm.",
      query: "north shore day trip from honolulu",
      badge: "Coastal",
    },
    {
      title: "Circle-island scenic route",
      description:
        "Good when the goal is one full Oahu sweep with lookouts, shoreline shifts, and fewer self-driving decisions.",
      query: "oahu circle island tour from honolulu",
      badge: "Full-island",
    },
    {
      title: "East-side ocean and lookout escape",
      description:
        "A lighter route for Hanauma-side water, windward viewpoints, and a calmer half-day beyond central Honolulu.",
      query: "east oahu scenic tour from honolulu",
      badge: "Easy half-day",
    },
  ],
  tampa: [
    {
      title: "Clearwater Beach and Gulf sunset day",
      description:
        "Best when the trip needs a real beach payoff and a cleaner west-coast contrast than another downtown Tampa block.",
      query: "clearwater beach day trip from tampa",
      badge: "Most popular",
    },
    {
      title: "St. Pete waterfront and museum escape",
      description:
        "A strong art-and-waterfront lane if the day should feel lighter, more walkable, and less attraction-heavy than Tampa proper.",
      query: "st petersburg day trip from tampa",
      badge: "Culture",
    },
    {
      title: "Busch Gardens commitment day",
      description:
        "Treat this as the whole day, not an add-on. It works best when thrill rides are the point and downtown is off the table.",
      query: "busch gardens tampa tickets and transport",
      badge: "Attraction-first",
    },
    {
      title: "Weeki Wachee springs and wildlife route",
      description:
        "The cleanest nature contrast when the trip needs springs, paddling, or old-Florida weirdness beyond the bayfront grid.",
      query: "weeki wachee day trip from tampa",
      badge: "Nature",
    },
  ],
  seattle: [
    {
      title: "Olympic National Park coast and rainforest day",
      description:
        "Best when the trip needs a full Pacific Northwest contrast with shoreline drama, mossy trails, and a reason to leave the city grid behind.",
      query: "olympic national park day trip from seattle",
      badge: "Most popular",
    },
    {
      title: "Mount Rainier scenic and hiking route",
      description:
        "The strongest mountain day when the goal is iconic Washington scenery, alpine viewpoints, and a real all-day commitment.",
      query: "mount rainier day tour from seattle",
      badge: "Mountain",
    },
    {
      title: "San Juan Islands ferry and whale-watching escape",
      description:
        "A high-value island lane when you want ferry movement, marine wildlife, and a day that feels decisively different from downtown Seattle.",
      query: "san juan islands day trip from seattle",
      badge: "Island",
    },
    {
      title: "Leavenworth Bavarian village day",
      description:
        "Good when the trip needs a longer small-town contrast with mountain backdrop, food stops, and a cleaner one-shot itinerary.",
      query: "leavenworth day trip from seattle",
      badge: "Full-day",
    },
  ],
  "san-francisco": [
    {
      title: "Golden Gate and Sausalito escape",
      description:
        "Best when the day needs a classic bay-and-bridge contrast with lookout stops, waterfront walking, and a cleaner break from the downtown grid.",
      query: "sausalito day trip from san francisco",
      badge: "Most popular",
    },
    {
      title: "Alcatraz and San Francisco Bay day",
      description:
        "A strong history-and-water lane when the trip should revolve around one iconic island anchor instead of scattered city stops.",
      query: "alcatraz and bay cruise from san francisco",
      badge: "History",
    },
    {
      title: "Napa Valley wine-country route",
      description:
        "The cleanest full-day contrast if the plan should lean into tasting rooms, vineyard scenery, and a decisively different pace than the city core.",
      query: "napa valley day trip from san francisco",
      badge: "Wine country",
    },
    {
      title: "Muir Woods redwoods and coast reset",
      description:
        "Good when the trip needs giant trees, cooler air, and a nature-first lane without committing to a much longer Northern California road-day.",
      query: "muir woods day trip from san francisco",
      badge: "Nature",
    },
  ],
  "san-diego": [
    {
      title: "La Jolla Cove and coastal wildlife day",
      description:
        "Best when the trip needs a clean ocean reset with coves, seals, and a stronger coastal payoff than staying in the downtown grid.",
      query: "la jolla day trip from san diego",
      badge: "Most popular",
    },
    {
      title: "Balboa Park museums and garden escape",
      description:
        "A strong culture-first lane when the day should stay easy, walkable, and packed with museums instead of longer-distance driving.",
      query: "balboa park museum day from san diego",
      badge: "Culture",
    },
    {
      title: "Coronado Island and Hotel del day",
      description:
        "Good when the trip needs a lighter bay-and-beach contrast with ferry or bridge movement, resort scenery, and an easy half-day shape.",
      query: "coronado island day trip from san diego",
      badge: "Easy half-day",
    },
    {
      title: "Torrey Pines hiking and glider views",
      description:
        "The cleanest cliffside nature lane if you want coastal hiking, ocean overlooks, and a more active outdoor block near the city.",
      query: "torrey pines day trip from san diego",
      badge: "Nature",
    },
  ],
  phoenix: [
    {
      title: "Sedona red rocks and canyon views",
      description:
        "Best when the trip needs a signature Arizona contrast with big scenery, easier hiking choices, and a full break from the metro heat.",
      query: "sedona day trip from phoenix",
      badge: "Most popular",
    },
    {
      title: "Grand Canyon South Rim commitment day",
      description:
        "Treat this as the entire day. It works when the canyon is the point, not when you are trying to squeeze it around city plans.",
      query: "grand canyon south rim day trip from phoenix",
      badge: "Bucket-list",
    },
    {
      title: "Apache Trail lakes and desert drive",
      description:
        "The cleanest scenic-drive lane if you want desert cliffs, water contrast, and an old-school Arizona road-day feel.",
      query: "apache trail scenic tour from phoenix",
      badge: "Scenic",
    },
    {
      title: "Jerome mining town and Verde Valley escape",
      description:
        "A strong history-and-hillside route when you want a weirder, more local-feeling Arizona day beyond the resort-and-desert defaults.",
      query: "jerome day trip from phoenix",
      badge: "History",
    },
  ],
  denver: [
    {
      title: "Boulder Flatirons and Chautauqua hiking",
      description:
        "Best when the day needs a foothills reset with iconic Front Range views, shorter trail options, and an easy break from downtown Denver blocks.",
      query: "boulder flatirons day trip from denver",
      badge: "Most popular",
    },
    {
      title: "Rocky Mountain National Park and Trail Ridge Road",
      description:
        "The strongest all-day mountain commitment when alpine scenery, wildlife pulls, and high-elevation viewpoints are the real point of the trip.",
      query: "rocky mountain national park day trip from denver",
      badge: "Mountain",
    },
    {
      title: "Golden breweries and foothills day",
      description:
        "A cleaner half-day or light full-day pivot when the trip should stay close, lean local, and mix beer stops with foothills scenery.",
      query: "golden colorado day trip from denver",
      badge: "Easy half-day",
    },
    {
      title: "Estes Park and Rocky Mountain gateway",
      description:
        "Good when you want a mountain-town lane with easier pacing than a full park deep-dive but more payoff than staying in the metro.",
      query: "estes park day trip from denver",
      badge: "Scenic",
    },
  ],
  "las-vegas": [
    {
      title: "Hoover Dam and Boulder City route",
      description:
        "Best when the day needs an easy engineering-and-desert contrast with a short drive, overlook stops, and a cleaner break from the Strip grid.",
      query: "hoover dam day trip from las vegas",
      badge: "Most popular",
    },
    {
      title: "Valley of Fire red-rock escape",
      description:
        "The strongest scenic reset if you want dramatic sandstone, shorter hikes, and a full daylight payoff without committing to the Grand Canyon.",
      query: "valley of fire day trip from las vegas",
      badge: "Scenic",
    },
    {
      title: "Red Rock Canyon and scenic loop day",
      description:
        "A clean half-day or light full-day lane when the goal is desert views, easier trail choices, and less transfer time than farther park routes.",
      query: "red rock canyon day trip from las vegas",
      badge: "Easy half-day",
    },
    {
      title: "Mount Charleston mountain reset",
      description:
        "Good when the trip needs altitude, cooler air, and a surprising mountain contrast that feels nothing like the resort corridor.",
      query: "mount charleston day trip from las vegas",
      badge: "Mountain",
    },
  ],
  miami: [
    {
      title: "Everglades airboat and wildlife day",
      description:
        "Best when the trip needs a real south-Florida contrast with wetlands, wildlife, and less beach-and-brunch repetition.",
      query: "everglades day trip from miami",
      badge: "Most popular",
    },
    {
      title: "Key Biscayne coastal reset",
      description:
        "A cleaner half-day coastal lane when the goal is beaches, lighthouse views, and a calmer water-first alternative to central Miami.",
      query: "key biscayne day trip from miami",
      badge: "Easy half-day",
    },
    {
      title: "Vizcaya and Coconut Grove escape",
      description:
        "Good when you want gardens, bayfront calm, and a more elegant architecture-and-neighborhood lane than another downtown block.",
      query: "vizcaya coconut grove tour from miami",
      badge: "Culture",
    },
    {
      title: "Biscayne Bay boat and waterfront day",
      description:
        "The strongest on-water option when the trip should revolve around skyline views, islands, and a simpler boat-first itinerary.",
      query: "biscayne bay boat tour from miami",
      badge: "Waterfront",
    },
  ],
  nashville: [
    {
      title: "Jack Daniel's Distillery and Lynchburg escape",
      description:
        "Best when the day needs a Tennessee-whiskey anchor with one clear destination instead of another in-town music-and-food block.",
      query: "jack daniels distillery day trip from nashville",
      badge: "Most popular",
    },
    {
      title: "Franklin historic town and Civil War route",
      description:
        "A clean history-first lane when the trip should stay close, slower-paced, and rooted in downtown streets, battlefields, and local food stops.",
      query: "franklin tennessee day trip from nashville",
      badge: "History",
    },
    {
      title: "Percy Warner Park hiking and nature day",
      description:
        "The easiest outdoor reset when the day needs woods, trails, and a break from Broadway energy without committing to a long drive.",
      query: "percy warner park day from nashville",
      badge: "Easy half-day",
    },
    {
      title: "Lynchburg whiskey and backroads trail",
      description:
        "Good when the trip should lean scenic and distillery-focused, with a slower Tennessee backroads feel beyond the city core.",
      query: "lynchburg whiskey trail from nashville",
      badge: "Scenic",
    },
  ],
  "new-orleans": [
    {
      title: "Cajun country and Lafayette bayou escape",
      description:
        "Best when the trip needs a deeper south-Louisiana contrast with bayou rhythm, Cajun food, and less French Quarter density.",
      query: "lafayette cajun country day trip from new orleans",
      badge: "Most popular",
    },
    {
      title: "Baton Rouge capitol and river history route",
      description:
        "A strong state-history lane when the day should revolve around one clean river-city pivot instead of stacking more neighborhood wandering in New Orleans.",
      query: "baton rouge day trip from new orleans",
      badge: "History",
    },
    {
      title: "Honey Island Swamp extension day",
      description:
        "The clearest wildlife-and-wetlands contrast if the trip needs a full bayou block rather than squeezing swamp time into a partial excursion.",
      query: "honey island swamp day trip from new orleans",
      badge: "Nature",
    },
    {
      title: "River Road plantation drive",
      description:
        "Good when the day needs a history-first lane with river scenery, estate stops, and a structure that feels different from downtown sightseeing.",
      query: "river road plantation tour from new orleans",
      badge: "Full-day",
    },
  ],
  orlando: [
    {
      title: "Kennedy Space Center and rocket history day",
      description:
        "Best when the trip needs a true Florida-space-coast contrast with one major anchor instead of another theme-park-style block.",
      query: "kennedy space center day trip from orlando",
      badge: "Most popular",
    },
    {
      title: "Cocoa Beach and Atlantic surf escape",
      description:
        "A clean coast-first reset when the day should trade ride queues for ocean air, beach time, and an easier family rhythm.",
      query: "cocoa beach day trip from orlando",
      badge: "Coastal",
    },
    {
      title: "Winter Park boat and museum day",
      description:
        "Good when the trip needs a lighter local contrast with scenic canals, walkable streets, and a more polished half-day pace.",
      query: "winter park boat tour from orlando",
      badge: "Easy half-day",
    },
    {
      title: "Mount Dora lakeside and antique route",
      description:
        "The best small-town lane if you want a calmer central Florida day with local shops, waterfront air, and less pressure than the theme-core.",
      query: "mount dora day trip from orlando",
      badge: "Small-town",
    },
    {
      title: "Universal rides commitment day",
      description:
        "Treat this as the full-day adrenaline lane when the plan is coasters, queues, and one decisive park commitment instead of splitting the day across smaller stops.",
      query: "universal studios and islands of adventure tickets from orlando",
      badge: "Attraction-first",
    },
  ],
  "salt-lake-city": [
    {
      title: "Park City mountain-town escape",
      description:
        "Best when the trip needs Main Street energy, alpine scenery, and a cleaner mountain contrast than another downtown Salt Lake block.",
      query: "park city day trip from salt lake city",
      badge: "Most popular",
    },
    {
      title: "Great Salt Lake and Antelope Island wildlife day",
      description:
        "The strongest open-space contrast if you want shoreline weirdness, bison, and a landscape that feels nothing like the city grid.",
      query: "antelope island day trip from salt lake city",
      badge: "Nature",
    },
    {
      title: "Provo Canyon and Bridal Veil Falls route",
      description:
        "A clean canyon-and-waterfall lane when the goal is a lighter scenic drive with easier walking and less full-day commitment.",
      query: "provo canyon bridal veil falls day trip from salt lake city",
      badge: "Easy half-day",
    },
    {
      title: "Ogden historic and mountain-edge reset",
      description:
        "Good when you want a smaller city pivot with rail-town character, nearby hiking, and less pressure than Park City.",
      query: "ogden day trip from salt lake city",
      badge: "History",
    },
  ],
  austin: [
    {
      title: "Hill Country wineries and Fredericksburg day",
      description:
        "Best when the trip needs a full wine-country contrast with tasting rooms, small-town stops, and a longer road-day payoff.",
      query: "fredericksburg wine tour from austin",
      badge: "Most popular",
    },
    {
      title: "San Antonio River Walk escape",
      description:
        "A clean second-city lane when the day should mix history, food, and waterfront walking instead of repeating another Austin block.",
      query: "san antonio day trip from austin",
      badge: "Urban contrast",
    },
    {
      title: "Enchanted Rock hiking and granite dome day",
      description:
        "The strongest nature-first option if the day should revolve around one iconic Texas hike and open Hill Country scenery.",
      query: "enchanted rock day trip from austin",
      badge: "Nature",
    },
    {
      title: "Lockhart BBQ trail and Texas-food reset",
      description:
        "Good when the trip should stay easier and food-first, with old-Texas character and a tighter drive than the farther Hill Country loops.",
      query: "lockhart bbq day trip from austin",
      badge: "Food",
    },
  ],
  "washington-dc": [
    {
      title: "Annapolis and Chesapeake Bay sailing day",
      description:
        "Best when the trip needs a waterfront reset and colonial-history contrast instead of another museum-heavy DC block.",
      query: "annapolis day trip from washington dc",
      badge: "Most popular",
    },
    {
      title: "Gettysburg battlefield and history route",
      description:
        "The strongest full-history lane when the day should revolve around one major Civil War site instead of scattered memorial stops.",
      query: "gettysburg day trip from washington dc",
      badge: "History",
    },
    {
      title: "Shenandoah and Skyline Drive escape",
      description:
        "A high-value contrast when the trip needs mountains, overlooks, and breathing room far outside the monument grid.",
      query: "shenandoah national park day trip from washington dc",
      badge: "Scenic",
    },
    {
      title: "Baltimore harbor and museum pivot",
      description:
        "Useful when you want a second city with waterfront movement, food, and museums without committing to a longer road-day.",
      query: "baltimore day trip from washington dc",
      badge: "Urban contrast",
    },
  ],
};

function getDayTripLanes(cityKey: string): IntentItem[] | null {
  const override = DAY_TRIP_OVERRIDES[cityKey];
  if (override?.length) return override;
  return getCityIntents(cityKey);
}

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityKey = resolveCanonicalCityKey(city);
  const cityName = titleCase(cityKey);
  return {
    title: `${cityName} Day Trips | Destination Command Center`,
    description: `Plan the best day trips from ${cityName} with cleaner timing, escape routes, and high-intent starting points.`,
    alternates: { canonical: `/${cityKey}/day-trips` },
    openGraph: {
      title: `${cityName} Day Trips`,
      description: `Plan the best day trips from ${cityName} with cleaner timing, escape routes, and high-intent starting points.`,
      url: `https://destinationcommandcenter.com/${cityKey}/day-trips`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cityName} Day Trips`,
      description: `Plan the best day trips from ${cityName} with cleaner timing, escape routes, and high-intent starting points.`,
    },
  };
}

export default async function CityDayTripsPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const cityKey = resolveCanonicalCityKey(city);

  const items = getDayTripLanes(cityKey);
  if (!items) notFound();

  const cityName = titleCase(cityKey);
  const manifest = getCityManifest(cityKey);
  const dayTripsCategory = manifest?.tourCategories?.find((item) => item.slug === "day-trips");
  const heroImage = manifest?.heroImage || manifest?.hero?.image?.src || null;
  const heroAlt =
    manifest?.heroImageAlt || manifest?.hero?.image?.alt || `${cityName} day trips hero image`;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": `https://destinationcommandcenter.com/${cityKey}/day-trips`,
              url: `https://destinationcommandcenter.com/${cityKey}/day-trips`,
              name: `${cityName} Day Trips`,
              description: `Plan the best day trips from ${cityName} with cleaner timing, escape routes, and high-intent starting points.`,
            },
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: cityName, item: `/${cityKey}` },
              { name: "Day Trips", item: `/${cityKey}/day-trips` },
            ]),
          ],
        }}
      />
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_24%),linear-gradient(180deg,rgba(18,18,22,0.92),rgba(9,9,11,0.96))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
          {heroImage ? (
            <>
              <div className="absolute inset-0">
                <img
                  src={heroImage}
                  alt={heroAlt}
                  className="h-full w-full object-cover opacity-30"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.34),rgba(9,9,11,0.88))]" />
            </>
          ) : null}
          <div className="relative">
            <div className="text-xs tracking-[0.35em] uppercase text-zinc-400">
              Destination Command Center • {cityName}
            </div>

            <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[0.95] bg-gradient-to-r from-white via-cyan-100 to-emerald-100 bg-clip-text text-transparent">
              {cityName} Day Trips
            </h1>

            <p className="mt-4 max-w-3xl text-zinc-200">
              {dayTripsCategory?.description ||
                `Use this page to shape the best day trips from ${cityName} without burying the trip in generic search results or loose planning.`}
            </p>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Start with the right escape lane first, then click through to live search results for the version that actually fits your timing, distance, and energy.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href={`/${cityKey}`}>
                City hub
              </Link>
              <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href={`/${cityKey}/attractions`}>
                Attractions
              </Link>
              <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href={`/${cityKey}/tours`}>
                Tours
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Best day-trip lanes</p>
            <h2 className="text-2xl font-bold">Start with the right escape route</h2>
            <p className="text-sm text-zinc-400">
              These are meant to be practical launch points, not filler. Pick the lane that matches how far you actually want to go.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it, idx) => (
            <Link
              key={`${cityKey}-daytrips-${idx}-${it.query}`}
              href={`/tours?city=${encodeURIComponent(cityKey)}&q=${encodeURIComponent(it.query)}`}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] hover:border-cyan-400/30 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{it.title}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {it.badge ? (
                      <span className="mr-2 inline-flex rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-200">
                        {it.badge}
                      </span>
                    ) : null}
                    <span className="text-zinc-300">Intent:</span>{" "}
                    <span className="text-zinc-400">{it.query}</span>
                  </div>
                </div>
                <div className="text-cyan-300 font-bold opacity-70 group-hover:opacity-100 transition">→</div>
              </div>

              <p className="mt-3 text-zinc-300 leading-relaxed">{it.description}</p>

              <div className="mt-4 text-xs uppercase tracking-[0.25em] text-zinc-500">
                Browse matches
              </div>
            </Link>
          ))}
          </div>
        </section>

        <div className="mt-10 border-t border-white/10 pt-6">
          <Link className="text-zinc-300 hover:text-cyan-200 transition" href={`/${cityKey}`}>
            ← Back to {cityName}
          </Link>
        </div>
      </div>
    </main>
  );
}
