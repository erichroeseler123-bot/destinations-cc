import { buildCruisePayload } from "@/lib/dcc/internal/cruisePayload";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { getCityIntents } from "@/src/data/city-intents";
import type { DccDiagnostics } from "@/lib/dcc/diagnostics";
import { slugify } from "@/lib/dcc/slug";

export type PlaceActionInventory = {
  place_slug: string;
  counts: {
    cruises: number;
    tours: number;
    events: number;
    transport: number;
  };
  extended_counts: {
    attractions: number;
    food: number;
    lodging: number;
    outdoors: number;
  };
  diagnostics: {
    cruises: DccDiagnostics;
    tours: DccDiagnostics;
    events: DccDiagnostics;
    transport: DccDiagnostics;
  };
};

function emptyDiagnostics(source: string, reason: string): DccDiagnostics {
  return {
    source,
    cache_status: "miss",
    stale: false,
    last_updated: null,
    stale_after: null,
    fallback_reason: reason,
  };
}

function looksLikeEvent(input: string): boolean {
  return /(show|concert|festival|event|ticket|theater|theatre|performance)/i.test(input);
}

function looksLikeTransport(input: string): boolean {
  return /(transport|shuttle|transfer|ferry|bus|train|airport|pickup|dropoff)/i.test(input);
}

function looksLikeAttraction(input: string): boolean {
  return /(attraction|museum|landmark|viewpoint|aquarium|zoo|theme park|gallery)/i.test(input);
}

function looksLikeFood(input: string): boolean {
  return /(food|restaurant|bar|brewery|dining|wine|coffee|cafe)/i.test(input);
}

function looksLikeLodging(input: string): boolean {
  return /(hotel|lodging|resort|hostel|stay|accommodation|inn)/i.test(input);
}

function looksLikeOutdoors(input: string): boolean {
  return /(hike|trail|outdoor|park|beach|mountain|camp|wildlife|glacier|ski)/i.test(input);
}

function countIntentMatches(
  placeSlug: string
): {
  events: number;
  transport: number;
  attractions: number;
  food: number;
  lodging: number;
  outdoors: number;
  diagnostics: { events: DccDiagnostics; transport: DccDiagnostics };
} {
  const intents = getCityIntents(placeSlug) || [];
  let events = 0;
  let transport = 0;
  let attractions = 0;
  let food = 0;
  let lodging = 0;
  let outdoors = 0;
  for (const it of intents) {
    const text = `${it.title} ${it.query} ${it.description}`;
    if (looksLikeEvent(text)) events += 1;
    if (looksLikeTransport(text)) transport += 1;
    if (looksLikeAttraction(text)) attractions += 1;
    if (looksLikeFood(text)) food += 1;
    if (looksLikeLodging(text)) lodging += 1;
    if (looksLikeOutdoors(text)) outdoors += 1;
  }
  const now = new Date().toISOString();
  const diagnosticsBase: DccDiagnostics = {
    source: "city_intents",
    cache_status: intents.length > 0 ? "fresh" : "miss",
    stale: false,
    last_updated: now,
    stale_after: null,
    fallback_reason: intents.length > 0 ? null : "no_city_intents",
  };
  return {
    events,
    transport,
    attractions,
    food,
    lodging,
    outdoors,
    diagnostics: {
      events: diagnosticsBase,
      transport: diagnosticsBase,
    },
  };
}

export async function buildPlaceActionInventory(input: {
  slug: string;
  name: string;
  hub?: string;
  citySlug?: string;
}): Promise<PlaceActionInventory> {
  const placeSlug = slugify(input.slug);

  const toursAction = await getViatorActionForPlace({
    slug: placeSlug,
    name: input.name,
    hub: input.hub,
    citySlug: input.citySlug,
  });

  let cruisesCount = 0;
  let cruiseDiagnostics: DccDiagnostics = emptyDiagnostics("cruise_registry", "no_matching_cruises");
  try {
    const bySlug = await buildCruisePayload({
      type: "destination",
      value: placeSlug,
      sortMode: "departure",
    });
    cruisesCount = bySlug.summary?.total_results || bySlug.cruises.length;
    cruiseDiagnostics = bySlug.diagnostics;
  } catch {
    cruiseDiagnostics = emptyDiagnostics("cruise_registry", "cruise_payload_error");
  }

  const intentCounts = countIntentMatches(placeSlug);

  return {
    place_slug: placeSlug,
    counts: {
      cruises: cruisesCount,
      tours: toursAction.products.length,
      events: intentCounts.events,
      transport: intentCounts.transport,
    },
    extended_counts: {
      attractions: intentCounts.attractions,
      food: intentCounts.food,
      lodging: intentCounts.lodging,
      outdoors: intentCounts.outdoors,
    },
    diagnostics: {
      cruises: cruiseDiagnostics,
      tours: {
        source: toursAction.source,
        cache_status: toursAction.cache_status,
        stale: toursAction.stale,
        last_updated: toursAction.last_updated,
        stale_after: toursAction.stale_after,
        fallback_reason: toursAction.fallback_reason,
      },
      events: intentCounts.diagnostics.events,
      transport: intentCounts.diagnostics.transport,
    },
  };
}
