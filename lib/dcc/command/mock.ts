import type {
  BestMoveModel,
  CommandAlertModel,
  CommandEventModel,
  CommandMapCorridor,
  CommandMapDestination,
  CorridorHealthCardModel,
  DestinationStatusCardModel,
} from "@/lib/dcc/command/types";

export const COMMAND_MAP_DESTINATIONS: CommandMapDestination[] = [
  { slug: "denver", name: "Denver / Red Rocks", lat: 39.7392, lon: -104.9903, status: "busy" },
  { slug: "denver-airport", name: "Denver / DEN Airport", lat: 39.8561, lon: -104.6737, status: "watch" },
  { slug: "miami", name: "Miami / PortMiami", lat: 25.7617, lon: -80.1918, status: "watch" },
  { slug: "las-vegas", name: "Las Vegas Strip", lat: 36.1699, lon: -115.1398, status: "normal" },
  { slug: "seattle", name: "Seattle Waterfront", lat: 47.6062, lon: -122.3321, status: "watch" },
  { slug: "new-york-city", name: "New York City", lat: 40.7128, lon: -74.006, status: "watch" },
];

export const COMMAND_MAP_CORRIDORS: CommandMapCorridor[] = [
  { id: "denver-red-rocks", name: "Denver to Red Rocks", from: "Denver", to: "Red Rocks", status: "busy" },
  { id: "denver-dia", name: "Denver to DEN Airport", from: "Denver", to: "DEN", status: "watch" },
  { id: "miami-port", name: "Airport to PortMiami", from: "MIA", to: "PortMiami", status: "watch" },
  { id: "vegas-strip", name: "Las Vegas Strip Access", from: "Airport", to: "Strip", status: "normal" },
];

export const COMMAND_CORRIDORS: CorridorHealthCardModel[] = [
  {
    id: "denver-red-rocks",
    name: "Denver to Red Rocks",
    from: "Denver",
    to: "Red Rocks",
    status: "busy",
    trend: "slipping",
    pressureLabel: "Venue arrivals tightening before show window",
    bestMove: "Depart early and favor shuttle routing over last-minute rideshare.",
  },
  {
    id: "denver-dia",
    name: "Denver to DEN Airport",
    from: "Denver",
    to: "DEN",
    status: "watch",
    trend: "steady",
    pressureLabel: "Airport pickup timing is workable, but buffer disappears faster than downtown assumptions.",
    bestMove: "Stage airport pickup earlier instead of turning DEN arrival into a last-minute transfer.",
  },
  {
    id: "miami-port",
    name: "Airport to PortMiami",
    from: "MIA",
    to: "PortMiami",
    status: "watch",
    trend: "steady",
    pressureLabel: "Embarkation buffer matters more than raw mileage",
    bestMove: "Add extra transfer buffer before committing to embarkation timing.",
  },
  {
    id: "vegas-strip",
    name: "Las Vegas Strip Access",
    from: "LAS",
    to: "Strip",
    status: "normal",
    trend: "improving",
    pressureLabel: "Tour and show access stable",
    bestMove: "Use this as a clean booking and movement lane right now.",
  },
];

export const COMMAND_DESTINATIONS: DestinationStatusCardModel[] = [
  {
    slug: "denver",
    name: "Denver / Red Rocks",
    status: "busy",
    transportStatus: "Shuttles active, rideshare friction elevated",
    liveSignal: "Show-night venue pressure building",
    recommendation: "Lock in transport before the main arrival wave.",
  },
  {
    slug: "denver-airport",
    name: "Denver / DEN Airport",
    status: "watch",
    transportStatus: "Airport transfer timing is stable with extra margin",
    liveSignal: "Arrival-chain pressure is building at DEN",
    recommendation: "Stage pickup before the late airport wave to keep the transfer clean.",
  },
  {
    slug: "miami",
    name: "Miami / PortMiami",
    status: "watch",
    transportStatus: "Transfer timing stable with added embarkation buffer",
    liveSignal: "Port approach pressure fluctuating",
    recommendation: "Arrive with margin and avoid cutting embarkation timing tight.",
  },
  {
    slug: "las-vegas",
    name: "Las Vegas Strip",
    status: "normal",
    transportStatus: "Main corridor movement stable",
    liveSignal: "Shows and tours active across the lane",
    recommendation: "Strong window for bundling transport with attractions.",
  },
];

export const COMMAND_BEST_MOVES: BestMoveModel[] = [
  {
    id: "red-rocks-shuttle",
    title: "Red Rocks arrivals are tightening",
    context: "Venue approach pressure is rising faster than general Denver movement.",
    recommendation: "Shared shuttle remains the strongest move for tonight's run.",
    status: "busy",
  },
  {
    id: "portmiami-buffer",
    title: "PortMiami timing still favors buffer",
    context: "Embarkation windows degrade faster than the headline traffic picture suggests.",
    recommendation: "Stage earlier than the minimum and protect your port transfer.",
    status: "watch",
  },
  {
    id: "vegas-booking-window",
    title: "Vegas lane is clean right now",
    context: "Shows, tours, and direct-booking paths are live without obvious friction.",
    recommendation: "Use this window to lock in the next move before demand rotates.",
    status: "normal",
  },
];

export const COMMAND_ALERTS: CommandAlertModel[] = [
  {
    id: "alert-red-rocks",
    title: "Venue access pressure at Red Rocks",
    impact: "Pre-show arrival windows are compressing and exit friction is likely later.",
    severity: "busy",
    href: "/red-rocks-transportation",
  },
  {
    id: "alert-portmiami",
    title: "Embarkation timing risk",
    impact: "Port transfers still look manageable, but missed buffer can break the day fast.",
    severity: "watch",
    href: "/command",
  },
];

export const COMMAND_EVENTS: CommandEventModel[] = [
  {
    id: "event-red-rocks",
    timestamp: new Date().toISOString(),
    title: "Red Rocks venue pressure building",
    detail: "Live movement signals point to tighter arrival windows before the main show push.",
    severity: "busy",
  },
  {
    id: "event-portmiami",
    timestamp: new Date().toISOString(),
    title: "PortMiami transfer lane stable",
    detail: "Embarkation access is holding, but buffer remains the right call.",
    severity: "watch",
  },
];
