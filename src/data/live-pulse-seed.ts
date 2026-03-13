import type { LivePulseSignalType, LivePulseVisibilityScope } from "@/lib/dcc/livePulse/types";

export type LivePulseSeedItem = {
  id: string;
  entityType: "city" | "port" | "venue" | "event";
  entitySlug: string;
  signalType: LivePulseSignalType;
  location: string;
  startsInMinutes: number;
  visibilityScope: LivePulseVisibilityScope;
  trustTier: "dcc-verified" | "partner";
  sourceName: string;
  reporterId: string;
  note?: string;
  imageUrl?: string;
  linkUrl?: string;
  actionHint?: string;
};

export const LIVE_PULSE_SEED_ITEMS: LivePulseSeedItem[] = [
  {
    id: "seed-denver-traffic-1",
    entityType: "city",
    entitySlug: "denver",
    signalType: "traffic_parking",
    location: "Downtown Denver",
    startsInMinutes: -10,
    visibilityScope: "city-feed",
    trustTier: "dcc-verified",
    sourceName: "DCC Ops Desk",
    reporterId: "dcc-ops",
    note: "Garage turnover is slow around event lanes.",
    actionHint: "Use rideshare or satellite parking and walk the final blocks.",
  },
  {
    id: "seed-denver-vibe-1",
    entityType: "city",
    entitySlug: "denver",
    signalType: "great_right_now",
    location: "RiNo",
    startsInMinutes: -8,
    visibilityScope: "city-feed",
    trustTier: "partner",
    sourceName: "RiNo Partner Desk",
    reporterId: "partner-rino",
    note: "Street energy is high and movement is smooth right now.",
  },
  {
    id: "seed-juneau-port-1",
    entityType: "port",
    entitySlug: "juneau",
    signalType: "long_lines",
    location: "Juneau waterfront transfer zone",
    startsInMinutes: -12,
    visibilityScope: "entity-only",
    trustTier: "dcc-verified",
    sourceName: "DCC Port Ops",
    reporterId: "dcc-port-ops",
    note: "Pickup zones are queuing longer than normal near dock exits.",
    actionHint: "Use shorter transfer lanes and keep all-aboard buffer conservative.",
  },
  {
    id: "seed-juneau-port-2",
    entityType: "port",
    entitySlug: "juneau",
    signalType: "weather_issue",
    location: "Juneau harbor weather lane",
    startsInMinutes: -7,
    visibilityScope: "next48-overlay",
    trustTier: "partner",
    sourceName: "Local Harbor Partner",
    reporterId: "partner-juneau-harbor",
    note: "Rain bands are reducing visibility on exposed excursion lanes.",
  },
  {
    id: "seed-redrocks-packed-1",
    entityType: "venue",
    entitySlug: "red-rocks-amphitheatre",
    signalType: "packed",
    location: "Red Rocks Amphitheatre",
    startsInMinutes: -15,
    visibilityScope: "next48-overlay",
    trustTier: "dcc-verified",
    sourceName: "DCC Venue Ops",
    reporterId: "dcc-venue-ops",
    note: "Lower lots filling quickly ahead of doors.",
    imageUrl: "/images/authority/venues/red-rocks-amphitheatre/hero.webp",
    linkUrl: "/venues/red-rocks-amphitheatre",
  },
  {
    id: "seed-redrocks-lines-1",
    entityType: "venue",
    entitySlug: "red-rocks-amphitheatre",
    signalType: "long_lines",
    location: "South Gate",
    startsInMinutes: -4,
    visibilityScope: "entity-only",
    trustTier: "partner",
    sourceName: "PARR Shuttle Team",
    reporterId: "parr-shuttle-desk",
    note: "Queue is moving but slower than normal.",
    actionHint: "Aim for alternate gate or add 20 minutes before showtime.",
  }
];
