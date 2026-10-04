export interface AlaskaShipData {
  slug: string;
  shipName: string;
  cruiseLine: string;
  typicalScheduledBerth: string;
  dockHours: string;
  callsAtSkagway: boolean;
  skagwayBerth?: string;
  skagwayHours?: string;
  notes?: string;
}

export const ALASKA_CRUISE_FLEET: AlaskaShipData[] = [
  // Princess Cruises
  {
    slug: "discovery-princess",
    shipName: "Discovery Princess",
    cruiseLine: "Princess Cruises",
    typicalScheduledBerth: "Franklin Street Dock (FKL)",
    dockHours: "1:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Franklin Dock is near the Mount Roberts Tramway. Final berth subject to CBJ harbor master assignment.",
  },
  {
    slug: "royal-princess",
    shipName: "Royal Princess",
    cruiseLine: "Princess Cruises",
    typicalScheduledBerth: "Franklin Street Dock (FKL) or Steamship Wharf (CT)",
    dockHours: "12:30 PM – 9:30 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Afternoon port window. Final berth subject to CBJ harbor master assignment.",
  },
  {
    slug: "majestic-princess",
    shipName: "Majestic Princess",
    cruiseLine: "Princess Cruises",
    typicalScheduledBerth: "Franklin Street Dock (FKL)",
    dockHours: "1:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Typical afternoon call. Operator shuttles meet guests outside port security.",
  },
  {
    slug: "grand-princess",
    shipName: "Grand Princess",
    cruiseLine: "Princess Cruises",
    typicalScheduledBerth: "Steamship Wharf (CT)",
    dockHours: "2:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Broadway Dock (BWD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Downtown pier location near visitor center.",
  },
  {
    slug: "ruby-princess",
    shipName: "Ruby Princess",
    cruiseLine: "Princess Cruises",
    typicalScheduledBerth: "Franklin Street Dock (FKL)",
    dockHours: "1:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Direct dockside helicopter pickup.",
  },

  // Holland America Line
  {
    slug: "eurodam",
    shipName: "Eurodam",
    cruiseLine: "Holland America Line",
    typicalScheduledBerth: "Marine Park Dock (MP) or AS Dock",
    dockHours: "1:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Ore Dock (ORD)",
    skagwayHours: "7:00 AM – 9:00 PM (typical)",
    notes: "Downtown Juneau waterfront berth. 15-min shuttle to Juneau Airport heliports.",
  },
  {
    slug: "koningsdam",
    shipName: "Koningsdam",
    cruiseLine: "Holland America Line",
    typicalScheduledBerth: "Franklin Street Dock (FKL)",
    dockHours: "1:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 9:00 PM (typical)",
    notes: "Large ship call. Glacier dog sledding camps fill early.",
  },
  {
    slug: "nieuw-amsterdam",
    shipName: "Nieuw Amsterdam",
    cruiseLine: "Holland America Line",
    typicalScheduledBerth: "Steamship Wharf (CT)",
    dockHours: "1:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Broadway Dock (BWD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Central pier pickup.",
  },
  {
    slug: "westerdam",
    shipName: "Westerdam",
    cruiseLine: "Holland America Line",
    typicalScheduledBerth: "Marine Park Dock (MP)",
    dockHours: "1:00 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Ore Dock (ORD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Central waterfront pier.",
  },
  {
    slug: "zaandam",
    shipName: "Zaandam",
    cruiseLine: "Holland America Line",
    typicalScheduledBerth: "AS Dock",
    dockHours: "8:00 AM – 6:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Broadway Dock (BWD)",
    skagwayHours: "7:00 AM – 5:00 PM (typical)",
    notes: "Full-day port call. Suitable for morning glacier landing or ice trek.",
  },

  // Norwegian Cruise Line (NCL)
  {
    slug: "norwegian-encore",
    shipName: "Norwegian Encore",
    cruiseLine: "Norwegian Cruise Line (NCL)",
    typicalScheduledBerth: "AJ Dock (AJD)",
    dockHours: "2:30 PM – 11:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:00 PM (typical)",
    notes: "Docks at AJ Dock. Operators meet guests at AJ Dock south staging area.",
  },
  {
    slug: "norwegian-bliss",
    shipName: "Norwegian Bliss",
    cruiseLine: "Norwegian Cruise Line (NCL)",
    typicalScheduledBerth: "AJ Dock (AJD)",
    dockHours: "7:00 AM – 1:30 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:00 PM (typical)",
    notes: "Morning port call. Flights coordinated for safe early return.",
  },
  {
    slug: "norwegian-jewel",
    shipName: "Norwegian Jewel",
    cruiseLine: "Norwegian Cruise Line (NCL)",
    typicalScheduledBerth: "AJ Dock (AJD)",
    dockHours: "7:00 AM – 1:15 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Ore Dock (ORD)",
    skagwayHours: "7:00 AM – 8:00 PM (typical)",
    notes: "Early morning call.",
  },

  // Royal Caribbean & Celebrity
  {
    slug: "ovation-of-the-seas",
    shipName: "Ovation of the Seas",
    cruiseLine: "Royal Caribbean",
    typicalScheduledBerth: "Franklin Street Dock (FKL)",
    dockHours: "12:00 PM – 9:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Franklin Dock berth. Direct shuttle outside security.",
  },
  {
    slug: "quantum-of-the-seas",
    shipName: "Quantum of the Seas",
    cruiseLine: "Royal Caribbean",
    typicalScheduledBerth: "Franklin Street Dock (FKL)",
    dockHours: "1:00 PM – 9:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Franklin Dock pickup.",
  },
  {
    slug: "celebrity-edge",
    shipName: "Celebrity Edge",
    cruiseLine: "Celebrity Cruises",
    typicalScheduledBerth: "Steamship Wharf (CT)",
    dockHours: "1:30 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Central pier pickup.",
  },
  {
    slug: "celebrity-solstice",
    shipName: "Celebrity Solstice",
    cruiseLine: "Celebrity Cruises",
    typicalScheduledBerth: "Franklin Street Dock (FKL)",
    dockHours: "1:30 PM – 10:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Afternoon flights match arrival schedule.",
  },

  // Disney & Carnival
  {
    slug: "disney-wonder",
    shipName: "Disney Wonder",
    cruiseLine: "Disney Cruise Line",
    typicalScheduledBerth: "Marine Park Dock (MP)",
    dockHours: "7:00 AM – 4:30 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Ore Dock (ORD)",
    skagwayHours: "7:00 AM – 7:30 PM (typical)",
    notes: "Family-heavy sailing. Morning flights recommended.",
  },
  {
    slug: "carnival-spirit",
    shipName: "Carnival Spirit",
    cruiseLine: "Carnival Cruise Line",
    typicalScheduledBerth: "Steamship Wharf (CT) or AJ Dock",
    dockHours: "1:00 PM – 9:00 PM (typical)",
    callsAtSkagway: true,
    skagwayBerth: "Railroad Dock (RRD)",
    skagwayHours: "7:00 AM – 8:30 PM (typical)",
    notes: "Central pier pickup with 90-120 min safety return buffer.",
  },
];

export function getShipBySlug(slug: string): AlaskaShipData | undefined {
  return ALASKA_CRUISE_FLEET.find(
    (s) => s.slug === slug || s.shipName.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
  );
}

export function getShipByName(name: string): AlaskaShipData | undefined {
  return ALASKA_CRUISE_FLEET.find(
    (s) => s.shipName.toLowerCase() === name.toLowerCase()
  );
}

export interface CalculatedSailingContext {
  ship: AlaskaShipData;
  juneauDate?: string;
  juneauPortHours: string;
  juneauBerth: string;
  juneauSafeFlightWindow: string;
  skagwayDate?: string;
  skagwayPortHours?: string;
  skagwayBerth?: string;
  skagwaySafeFlightWindow?: string;
  callsAtSkagway: boolean;
  dateSource: "passenger_supplied" | "unspecified";
  scheduleDisclaimer: string;
}

/**
 * Calculates sailing context without making unverified assumptions.
 * Skagway date is only set if explicitly supplied by the passenger from their cruise itinerary.
 * callsAtSkagway indicates typical fleet deployment; individual voyage itineraries must be verified.
 */
export function calculateSailingContext(
  shipInput: string,
  juneauDateStr?: string,
  skagwayDateStr?: string
): CalculatedSailingContext | null {
  const ship = getShipBySlug(shipInput) || getShipByName(shipInput);
  if (!ship) return null;

  const juneauSafeWindow = ship.dockHours.includes("1:00 PM") || ship.dockHours.includes("1:30 PM") || ship.dockHours.includes("2:00 PM")
    ? "Typically 2:15 PM – 6:45 PM (leaves 90-120m buffer before all-aboard)"
    : ship.dockHours.includes("7:00 AM")
    ? "Typically 8:15 AM – 11:15 AM (leaves 90-120m buffer before all-aboard)"
    : "Varies by sailing date (leaves 90-120m buffer before all-aboard)";

  const skagwaySafeWindow = ship.callsAtSkagway
    ? "Typically 8:30 AM – 5:30 PM (leaves 90-120m buffer before all-aboard)"
    : undefined;

  return {
    ship,
    juneauDate: juneauDateStr || undefined,
    juneauPortHours: ship.dockHours,
    juneauBerth: ship.typicalScheduledBerth,
    juneauSafeFlightWindow: juneauSafeWindow,
    skagwayDate: skagwayDateStr || undefined,
    skagwayPortHours: ship.skagwayHours,
    skagwayBerth: ship.skagwayBerth,
    skagwaySafeFlightWindow: skagwaySafeWindow,
    callsAtSkagway: ship.callsAtSkagway,
    dateSource: juneauDateStr || skagwayDateStr ? "passenger_supplied" : "unspecified",
    scheduleDisclaimer:
      "Berth assignments and port hours are typical historical patterns and subject to CBJ harbor master assignment and cruise line itinerary adjustments.",
  };
}
