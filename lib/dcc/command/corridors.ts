import { getNodeBySlugInClass } from "@/lib/dcc/registry";
import { RED_ROCKS_CORRIDOR } from "@/lib/dcc/corridors";
import type { CommandStatusLevel } from "@/lib/dcc/command/types";
import type { CommandCorridorDefinition } from "@/lib/dcc/command/scoring";

export type GoldCorridorTemplate = CommandCorridorDefinition & {
  tier: "gold";
  signalSources: {
    shipmentEvents: boolean;
    satelliteHandoffs: boolean;
    livePulse: boolean;
    graphSignals: boolean;
  };
  map: {
    center: { lat: number; lon: number };
    path: Array<[number, number]>;
  };
  timingWindows?: {
    cleanBefore?: string;
    pressureAfter?: string;
    avoidAfter?: string;
  };
  copy: Record<
    CommandStatusLevel,
    {
      pressureLabel: string;
      bestMove: string;
      transportStatus: string;
      recommendation: string;
    }
  >;
};

function resolvePlaceIdMatchers(...entries: Array<{ slug: string; cls: string }>) {
  return entries
    .map((entry) => getNodeBySlugInClass(entry.slug, entry.cls)?.id || null)
    .filter((value): value is string => Boolean(value));
}

const redRocksCommandBinding = RED_ROCKS_CORRIDOR.command;
const redRocksCommandHandoff: CommandCorridorDefinition["handoff"] =
  redRocksCommandBinding?.satelliteId
    ? {
        satelliteId: "partyatredrocks",
        venueSlug: redRocksCommandBinding.venueSlug,
      }
    : undefined;

export const GOLD_CORRIDORS: GoldCorridorTemplate[] = [
  {
    id: redRocksCommandBinding?.corridorId || "denver-red-rocks",
    tier: "gold",
    name: "Denver to Red Rocks",
    from: "Denver",
    to: "Red Rocks",
    placeIdMatchers: resolvePlaceIdMatchers({ slug: "denver-co", cls: "place" }),
    shipmentPlaceMatchers: ["denver", "red-rocks"],
    handoff: redRocksCommandHandoff,
    signalSources: {
      shipmentEvents: true,
      satelliteHandoffs: true,
      livePulse: false,
      graphSignals: true,
    },
    map: {
      center: { lat: 39.6903, lon: -105.2057 },
      path: [
        [39.73915, -104.9847],
        [39.7187, -105.0734],
        [39.6903, -105.2057],
      ],
    },
    timingWindows: {
      cleanBefore: "17:45",
      pressureAfter: "18:10",
      avoidAfter: "18:30",
    },
    fallback: {
      pressureLabel: "Venue arrivals tighten quickly once the show-night push begins.",
      bestMove: "Shuttle departures before 5:45 PM are still the cleanest move into the venue lane.",
      transportStatus: "Dedicated shuttles hold up best once the venue access window compresses.",
      liveSignal: "Execution pressure is building in the Red Rocks transport lane.",
      recommendation: "Use the dedicated shuttle before the main arrival wave instead of chasing last-minute rideshare.",
    },
    copy: {
      normal: {
        pressureLabel: "The corridor is absorbing current demand without meaningful compression.",
        bestMove: "Use this window to commit early while the venue lane is still moving cleanly.",
        transportStatus: "Shuttle and venue approach timing are stable.",
        recommendation: "Book and depart on the earlier side while access remains forgiving.",
      },
      watch: {
        pressureLabel: "Early pressure is starting to cluster, but the lane is still workable.",
        bestMove: "Depart before the 5:45 PM threshold if you want the cleaner arrival window.",
        transportStatus: "Transfer timing is still viable, but late decisions are getting punished.",
        recommendation: "Treat the lane as time-sensitive and add margin instead of optimizing the last minute.",
      },
      busy: {
        pressureLabel: "Arrival compression is building and fallback options are weakening.",
        bestMove: "Shuttle departures before 5:45 PM are clearing better; after 6:10 PM the lane gets harsher fast.",
        transportStatus: "Shuttles are still holding, but rideshare friction and venue approach delay are elevated.",
        recommendation: "Take the dedicated shuttle before the late surge instead of trying to improvise close to doors.",
      },
      critical: {
        pressureLabel: "The lane is fragile and active execution signals show real capacity stress.",
        bestMove: "Do not rely on late arrival. Either move much earlier or switch to the cleaner fallback.",
        transportStatus: "Venue access reliability is weak and the corridor is no longer forgiving.",
        recommendation: "Protect maximum buffer or avoid committing to the corridor during the current pressure cycle.",
      },
    },
  },
  {
    id: "denver-dia",
    tier: "gold",
    name: "Denver to DEN Airport",
    from: "Denver",
    to: "DEN",
    placeIdMatchers: resolvePlaceIdMatchers(
      { slug: "denver-co", cls: "place" },
      { slug: "denver-international-airport", cls: "transport_hub" },
    ),
    shipmentPlaceMatchers: ["denver", "airport", "dia", "den"],
    signalSources: {
      shipmentEvents: true,
      satelliteHandoffs: false,
      livePulse: false,
      graphSignals: true,
    },
    map: {
      center: { lat: 39.798, lon: -104.828 },
      path: [
        [39.73915, -104.9847],
        [39.7806, -104.8782],
        [39.8561, -104.6737],
      ],
    },
    timingWindows: {
      cleanBefore: "15:30",
      pressureAfter: "16:20",
      avoidAfter: "17:00",
    },
    fallback: {
      pressureLabel: "Airport arrival timing degrades faster than the map distance suggests.",
      bestMove: "Stage the airport pickup earlier and avoid turning DEN pickup into a last-minute move.",
      transportStatus: "The airport transfer lane is viable with margin, not with tight timing.",
      liveSignal: "DEN arrival-chain pressure is sensitive to pickup staging and corridor timing.",
      recommendation: "Protect the airport pickup window before the evening arrival wave starts compressing options.",
    },
    copy: {
      normal: {
        pressureLabel: "The airport corridor is moving cleanly and earlier pickup windows are forgiving.",
        bestMove: "Use the cleaner window to stage airport pickup before the evening arrival stack begins.",
        transportStatus: "Airport transfer timing is stable and the lane is absorbing current demand.",
        recommendation: "Lock the airport pickup on the earlier side while the arrival corridor is still flexible.",
      },
      watch: {
        pressureLabel: "The airport corridor is still workable, but timing slack is starting to disappear.",
        bestMove: "Move airport pickup before 3:30 PM if you want the cleaner transfer path into Denver.",
        transportStatus: "Airport transfer reliability is still intact, but late pickup decisions are getting punished.",
        recommendation: "Treat the DEN corridor as reliability-first and stage the pickup earlier instead of optimizing the last minute.",
      },
      busy: {
        pressureLabel: "Arrival compression is building and the airport lane is less forgiving than downtown routing.",
        bestMove: "Earlier airport pickup windows are clearing better; after 4:20 PM the lane gets less flexible fast.",
        transportStatus: "Airport pickup is still viable, but later windows carry higher risk and less recovery room.",
        recommendation: "Use the airport pickup lane with extra buffer and avoid tight arrival-chain assumptions.",
      },
      critical: {
        pressureLabel: "The airport lane is fragile and fallback moves no longer preserve reliable timing.",
        bestMove: "Do not run DEN pickup tight. Either move much earlier or change the arrival plan entirely.",
        transportStatus: "Airport transfer reliability is weak and same-day timing assumptions are no longer safe.",
        recommendation: "Protect the largest possible buffer or avoid committing to this DEN transfer window.",
      },
    },
  },
];

export const COMMAND_CORRIDORS: CommandCorridorDefinition[] = [
  GOLD_CORRIDORS[0],
  {
    id: "miami-port",
    name: "Airport to PortMiami",
    from: "MIA",
    to: "PortMiami",
    placeIdMatchers: resolvePlaceIdMatchers(
      { slug: "miami-fl", cls: "place" },
      { slug: "portmiami", cls: "port" },
    ),
    shipmentPlaceMatchers: ["miami", "portmiami"],
    fallback: {
      pressureLabel: "Embarkation buffer matters more than raw mileage",
      bestMove: "Add extra transfer buffer before committing to embarkation timing.",
      transportStatus: "Transfer timing is stable with added embarkation buffer.",
      liveSignal: "Port approach pressure is fluctuating across the current window.",
      recommendation: "Arrive with margin and avoid cutting embarkation timing tight.",
    },
  },
  {
    id: "vegas-strip",
    name: "Las Vegas Strip Access",
    from: "LAS",
    to: "Strip",
    placeIdMatchers: resolvePlaceIdMatchers({ slug: "las-vegas-nv", cls: "place" }),
    shipmentPlaceMatchers: ["las-vegas", "strip"],
    handoff: {
      satelliteId: "saveonthestrip",
      citySlug: "las-vegas",
    },
    fallback: {
      pressureLabel: "Tour and show access are holding steady across the lane.",
      bestMove: "Use this clean booking window before demand rotates.",
      transportStatus: "Main corridor movement is stable.",
      liveSignal: "Shows and tours are active across the lane.",
      recommendation: "Bundle transport with attractions while the operating window is still calm.",
    },
  },
];

export function getCorridorById(id: string) {
  return COMMAND_CORRIDORS.find((corridor) => corridor.id === id) || null;
}

export function getGoldCorridors() {
  return GOLD_CORRIDORS;
}
