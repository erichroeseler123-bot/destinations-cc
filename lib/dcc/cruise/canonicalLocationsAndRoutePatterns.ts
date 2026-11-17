/**
 * Stage 2 — Authoritative DCC Canonical Location (WGS84 + Precision Tier),
 * Evergreen RoutePattern, Field-Level Superseded Provenance, and Fact Verification Queue.
 */

export const CANONICAL_LOCATION_PRECISION_TIERS = [
  'berth',
  'terminal',
  'tender_landing',
  'meeting_point',
  'port_gate',
  'city_centroid',
] as const;

export type CanonicalLocationPrecisionTier =
  (typeof CANONICAL_LOCATION_PRECISION_TIERS)[number];

export type CanonicalFactSourceType =
  | 'cruise_line_official'
  | 'port_authority_official'
  | 'organizer_official'
  | 'dcc_editorial_verified'
  | 'organizer_workspace_proposal';

export type CanonicalFactVerificationState =
  | 'verified'
  | 'organizer_supplied'
  | 'needs_review'
  | 'held';

export interface MaterialFieldProvenance<T = unknown> {
  value: T;
  sourceUrl: string;
  sourceType: CanonicalFactSourceType;
  suppliedBy: string;
  verifiedBy: string;
  knownAt: string;
  validAt: string;
  checkedAt: string;
  verificationState: CanonicalFactVerificationState;
  precisionTier?: CanonicalLocationPrecisionTier;
  confidence: 'high' | 'medium' | 'disputed';
  supersededValue: T | null;
}

export interface CanonicalPortLocationRecord {
  locationId: string;
  portSlug: string;
  portName: string;
  facilityName: string;
  countryCode: string;
  regionLabel: string;
  coordinateDatum: 'WGS84';
  latitude: number;
  longitude: number;
  precisionTier: CanonicalLocationPrecisionTier;
  eligibleForWalkTimeCalculation: boolean;
  typicalReturnBufferMinutes: 120;
  notes: string;
  coordinatesProvenance: MaterialFieldProvenance<{ lat: number; lng: number }>;
}

export interface CanonicalRoutePatternRecord {
  routePatternId: string;
  routeSlug: string;
  title: string;
  regionLabel: string;
  typicalNightsMin: number;
  typicalNightsMax: number;
  embarkPortSlug: string;
  embarkLocationId: string;
  canonicalCallPortSlugs: string[];
  canonicalCallLocationIds: string[];
  summary: string;
  provenance: MaterialFieldProvenance<string>;
}

export interface DccFactVerificationQueueItem {
  verificationId: string;
  entityType: 'organizer' | 'franchise' | 'hosted_sailing' | 'physical_sailing' | 'location';
  entityId: string;
  fieldPath: string;
  currentVerifiedValue: unknown;
  proposedOrConflictingValue: unknown;
  submittedByRole: 'claimed_organizer' | 'dcc_source_audit' | 'traveler_report';
  submittedByActor: string;
  sourceUrl: string | null;
  secondaryConflictSourceUrl?: string | null;
  conflictSummary: string;
  state: 'needs_review' | 'approved_into_canonical' | 'rejected_keep_canonical';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  resolutionNote: string | null;
  isSyntheticTest?: boolean;
}

export function isPrecisionTierWalkTimeEligible(
  tier: CanonicalLocationPrecisionTier,
): boolean {
  return tier !== 'city_centroid';
}

export function assertLocationEligibleForWalkTime(
  location: Pick<CanonicalPortLocationRecord, 'locationId' | 'precisionTier' | 'eligibleForWalkTimeCalculation'>,
): void {
  if (
    location.precisionTier === 'city_centroid' ||
    !location.eligibleForWalkTimeCalculation
  ) {
    throw new Error(
      `Location ${location.locationId} has precisionTier="${location.precisionTier}" and cannot be used as walk-time or pier-distance evidence.`,
    );
  }
}

export function supersedeMaterialProvenance<T>(
  prior: MaterialFieldProvenance<T>,
  next: {
    value: T;
    sourceUrl: string;
    sourceType: CanonicalFactSourceType;
    suppliedBy: string;
    verifiedBy: string;
    validAt: string;
    checkedAt: string;
    verificationState: CanonicalFactVerificationState;
    confidence?: 'high' | 'medium' | 'disputed';
  },
): MaterialFieldProvenance<T> {
  return {
    value: next.value,
    sourceUrl: next.sourceUrl,
    sourceType: next.sourceType,
    suppliedBy: next.suppliedBy,
    verifiedBy: next.verifiedBy,
    knownAt: next.checkedAt,
    validAt: next.validAt,
    checkedAt: next.checkedAt,
    verificationState: next.verificationState,
    ...(prior.precisionTier ? { precisionTier: prior.precisionTier } : {}),
    confidence: next.confidence ?? 'high',
    supersededValue: prior.value,
  };
}

function makeCoordProv(
  lat: number,
  lng: number,
  sourceUrl: string,
  precisionTier: CanonicalLocationPrecisionTier,
): MaterialFieldProvenance<{ lat: number; lng: number }> {
  return {
    value: { lat, lng },
    sourceUrl,
    sourceType: 'port_authority_official',
    suppliedBy: 'dcc:port-geodesy-registry',
    verifiedBy: 'dcc:wgs84-port-audit',
    knownAt: '2026-11-16T16:00:00Z',
    validAt: '2026-11-16T16:00:00Z',
    checkedAt: '2026-11-16T16:00:00Z',
    verificationState: 'verified',
    precisionTier,
    confidence: precisionTier === 'city_centroid' ? 'medium' : 'high',
    supersededValue: null,
  };
}

export const CANONICAL_PORT_LOCATIONS: readonly CanonicalPortLocationRecord[] = [
  {
    locationId: 'location:miami:portmiami-terminal-b',
    portSlug: 'miami',
    portName: 'Miami, Florida',
    facilityName: 'PortMiami Cruise Terminal B (Dodge Island)',
    countryCode: 'US',
    regionLabel: 'Florida & Bahamas',
    coordinateDatum: 'WGS84',
    latitude: 25.7781,
    longitude: -80.1704,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Primary Dodge Island turnaround terminal complex for NCL, Royal Caribbean, Carnival, and Virgin Voyages.',
    coordinatesProvenance: makeCoordProv(25.7781, -80.1704, 'https://www.miamidade.gov/portmiami/', 'terminal'),
  },
  {
    locationId: 'location:fort-lauderdale:port-everglades-terminal-25',
    portSlug: 'fort-lauderdale',
    portName: 'Fort Lauderdale, Florida',
    facilityName: 'Port Everglades Midport Terminal 25',
    countryCode: 'US',
    regionLabel: 'Florida & Bahamas',
    coordinateDatum: 'WGS84',
    latitude: 26.0865,
    longitude: -80.1182,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Port Everglades security gate requires government ID and cruise boarding pass; walk between terminals is restricted.',
    coordinatesProvenance: makeCoordProv(26.0865, -80.1182, 'https://www.porteverglades.net/', 'terminal'),
  },
  {
    locationId: 'location:port-canaveral:cruise-terminal-1',
    portSlug: 'port-canaveral',
    portName: 'Port Canaveral, Florida',
    facilityName: 'Port Canaveral Cruise Terminal 1',
    countryCode: 'US',
    regionLabel: 'Florida & Bahamas',
    coordinateDatum: 'WGS84',
    latitude: 28.4106,
    longitude: -80.6285,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Deep-water south-side terminal serving Icon- and Oasis-class turnaround departures.',
    coordinatesProvenance: makeCoordProv(28.4106, -80.6285, 'https://www.portcanaveral.com/', 'terminal'),
  },
  {
    locationId: 'location:tampa:port-tampa-bay-terminal-2',
    portSlug: 'tampa',
    portName: 'Tampa, Florida',
    facilityName: 'Port Tampa Bay Cruise Terminal 2 (Channelside)',
    countryCode: 'US',
    regionLabel: 'Gulf Coast & Western Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 27.9437,
    longitude: -82.4449,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Channelside District cruise terminal adjacent to Tampa Streetcar and Florida Aquarium.',
    coordinatesProvenance: makeCoordProv(27.9437, -82.4449, 'https://www.porttb.com/', 'terminal'),
  },
  {
    locationId: 'location:new-orleans:erato-street-cruise-terminal',
    portSlug: 'new-orleans',
    portName: 'New Orleans, Louisiana',
    facilityName: 'Port of New Orleans Erato Street & Julia Street Cruise Terminals',
    countryCode: 'US',
    regionLabel: 'Gulf Coast & Western Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 29.9391,
    longitude: -90.0609,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Mississippi Riverfront terminals serving Carnival Valor, Carnival Liberty, Norwegian Escape, and Royal Caribbean.',
    coordinatesProvenance: makeCoordProv(29.9391, -90.0609, 'https://portnola.com/cruise', 'terminal'),
  },
  {
    locationId: 'location:galveston:pier-10-terminal',
    portSlug: 'galveston',
    portName: 'Galveston, Texas',
    facilityName: 'Port of Galveston Cruise Terminal 10 & Terminal 25',
    countryCode: 'US',
    regionLabel: 'Gulf Coast & Western Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 29.3106,
    longitude: -94.7918,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Harborside Drive terminals serving Royal Caribbean Oasis/Voyager-class and Carnival Excel-class vessels.',
    coordinatesProvenance: makeCoordProv(29.3106, -94.7918, 'https://www.portofgalveston.com/', 'terminal'),
  },
  {
    locationId: 'location:cozumel:puerta-maya-pier',
    portSlug: 'cozumel',
    portName: 'Cozumel, Mexico',
    facilityName: 'Puerta Maya & International Cruise Pier Complex',
    countryCode: 'MX',
    regionLabel: 'Western Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 20.4761,
    longitude: -86.9746,
    precisionTier: 'berth',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Southern hotel-zone deep-water piers ~5 km south of Punta Langosta downtown pier; confirm exact ship pier before booking.',
    coordinatesProvenance: makeCoordProv(20.4761, -86.9746, 'https://www.puertamaya.com/', 'berth'),
  },
  {
    locationId: 'location:costa-maya:puerto-costa-maya-pier',
    portSlug: 'costa-maya',
    portName: 'Costa Maya, Mexico',
    facilityName: 'Puerto Costa Maya Pier Gate',
    countryCode: 'MX',
    regionLabel: 'Western Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 18.7347,
    longitude: -87.7078,
    precisionTier: 'port_gate',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Long concrete pier requires 10–15 minute walk or tram ride to reach external excursion dispatch gate.',
    coordinatesProvenance: makeCoordProv(18.7347, -87.7078, 'https://costamaya.com/', 'port_gate'),
  },
  {
    locationId: 'location:progreso:causeway-pier-gate',
    portSlug: 'progreso',
    portName: 'Progreso, Yucatán, Mexico',
    facilityName: 'Puerto Progreso 6.5-km Causeway Terminal Gate',
    countryCode: 'MX',
    regionLabel: 'Western Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 21.3414,
    longitude: -89.6736,
    precisionTier: 'berth',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Offshore berth sits 4 miles out on the Yucatán viaduct; mandatory shuttle transfer to shore adds 20 minutes each way.',
    coordinatesProvenance: makeCoordProv(21.3414, -89.6736, 'https://puertosyucatan.com/', 'berth'),
  },
  {
    locationId: 'location:roatan:mahogany-bay-cruise-center',
    portSlug: 'roatan',
    portName: 'Roatán, Honduras',
    facilityName: 'Mahogany Bay & Port of Roatán Coxen Hole Berths',
    countryCode: 'HN',
    regionLabel: 'Western Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 16.3247,
    longitude: -86.4959,
    precisionTier: 'port_gate',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Carnival Corp ships typically berth at Mahogany Bay while Royal Caribbean/NCL/Celebrity berth at Coxen Hole Town Center.',
    coordinatesProvenance: makeCoordProv(16.3247, -86.4959, 'https://www.mahoganybaycc.com/', 'port_gate'),
  },
  {
    locationId: 'location:nassau:prince-george-wharf',
    portSlug: 'nassau',
    portName: 'Nassau, Bahamas',
    facilityName: 'Nassau Cruise Port (Prince George Wharf)',
    countryCode: 'BS',
    regionLabel: 'Florida & Bahamas',
    coordinateDatum: 'WGS84',
    latitude: 25.0808,
    longitude: -77.3406,
    precisionTier: 'berth',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Six-berth downtown Nassau port opening directly onto Bay Street Marketplace.',
    coordinatesProvenance: makeCoordProv(25.0808, -77.3406, 'https://www.nassaucruiseport.com/', 'berth'),
  },
  {
    locationId: 'location:key-west:mallory-square-outer-mole',
    portSlug: 'key-west',
    portName: 'Key West, Florida',
    facilityName: 'Key West Pier B / Mallory Square Dock',
    countryCode: 'US',
    regionLabel: 'Florida & Bahamas',
    coordinateDatum: 'WGS84',
    latitude: 24.5594,
    longitude: -81.8076,
    precisionTier: 'berth',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Walkable Old Town Key West pier immediately adjacent to Mallory Square.',
    coordinatesProvenance: makeCoordProv(24.5594, -81.8076, 'https://www.cityofkeywest-fl.gov/', 'berth'),
  },
  {
    locationId: 'location:juneau:aj-dock',
    portSlug: 'juneau',
    portName: 'Juneau, Alaska',
    facilityName: 'Juneau Cruise Terminal / AJ Dock & Franklin Dock Corridor',
    countryCode: 'US',
    regionLabel: 'Alaska',
    coordinateDatum: 'WGS84',
    latitude: 58.2994,
    longitude: -134.4055,
    precisionTier: 'meeting_point',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Mount Roberts Tramway parking deck serves as primary independent shore-excursion dispatch; AJ Dock ships use a 5-minute shuttle.',
    coordinatesProvenance: makeCoordProv(58.2994, -134.4055, 'https://juneau.org/harbors', 'meeting_point'),
  },
  {
    locationId: 'location:cabo-san-lucas:marina-tender-landing',
    portSlug: 'cabo-san-lucas',
    portName: 'Cabo San Lucas, Mexico',
    facilityName: 'Cabo San Lucas IGY Marina Tender Pier',
    countryCode: 'MX',
    regionLabel: 'Mexican Riviera',
    coordinateDatum: 'WGS84',
    latitude: 22.8808,
    longitude: -109.9089,
    precisionTier: 'tender_landing',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: '100% tender port; ships anchor in Cabo Bay and tender guests directly to Marina boardwalk.',
    coordinatesProvenance: makeCoordProv(22.8808, -109.9089, 'https://www.igymarinas.com/marinas/marina-cabo-san-lucas/', 'tender_landing'),
  },
  {
    locationId: 'location:san-juan:old-san-juan-pier-4',
    portSlug: 'san-juan',
    portName: 'San Juan, Puerto Rico',
    facilityName: 'Old San Juan Pier 4 & Pan American Pier',
    countryCode: 'PR',
    regionLabel: 'Eastern & Southern Caribbean',
    coordinateDatum: 'WGS84',
    latitude: 18.4631,
    longitude: -66.1128,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Port-call ships dock at walkable Old San Juan Piers 1–4; turnaround embarkations often use Pan American Pier across the bay.',
    coordinatesProvenance: makeCoordProv(18.4631, -66.1128, 'https://sanjuancruiseport.com/', 'terminal'),
  },
  {
    locationId: 'location:new-york:manhattan-cruise-terminal-pier-88',
    portSlug: 'new-york',
    portName: 'New York, New York',
    facilityName: 'Manhattan Cruise Terminal Pier 88 (12th Ave & W 48th St)',
    countryCode: 'US',
    regionLabel: 'Bermuda & Northeast',
    coordinateDatum: 'WGS84',
    latitude: 40.7662,
    longitude: -73.9967,
    precisionTier: 'terminal',
    eligibleForWalkTimeCalculation: true,
    typicalReturnBufferMinutes: 120,
    notes: 'Hudson River West Side turnaround terminal for NCL, Carnival, and boutique ocean vessels.',
    coordinatesProvenance: makeCoordProv(40.7662, -73.9967, 'https://nycruise.com/manhattan-terminal/', 'terminal'),
  },
  {
    locationId: 'location:rome:city-centroid-reference',
    portSlug: 'rome',
    portName: 'Rome (via Civitavecchia), Italy',
    facilityName: 'Rome Metropolitan Reference Centroid (Inland Destination — Not a Cruise Berth)',
    countryCode: 'IT',
    regionLabel: 'Mediterranean',
    coordinateDatum: 'WGS84',
    latitude: 41.9028,
    longitude: 12.4964,
    precisionTier: 'city_centroid',
    eligibleForWalkTimeCalculation: false,
    typicalReturnBufferMinutes: 120,
    notes: 'City centroid ~70 km inland from Port of Civitavecchia; strictly forbidden for pier walk-time calculations.',
    coordinatesProvenance: makeCoordProv(41.9028, 12.4964, 'https://www.adspmarcetsettentrionale.it/', 'city_centroid'),
  },
];

export const CANONICAL_ROUTE_PATTERNS: readonly CanonicalRoutePatternRecord[] = [
  {
    routePatternId: 'route-pattern:7n-western-caribbean-miami',
    routeSlug: '7-night-western-caribbean-from-miami',
    title: '7-Night Western Caribbean Round-Trip from Miami',
    regionLabel: 'Western Caribbean',
    typicalNightsMin: 6,
    typicalNightsMax: 8,
    embarkPortSlug: 'miami',
    embarkLocationId: 'location:miami:portmiami-terminal-b',
    canonicalCallPortSlugs: ['cozumel', 'costa-maya', 'roatan'],
    canonicalCallLocationIds: [
      'location:cozumel:puerta-maya-pier',
      'location:costa-maya:puerto-costa-maya-pier',
      'location:roatan:mahogany-bay-cruise-center',
    ],
    summary:
      'Evergreen weeklong Western Caribbean route pattern departing PortMiami with calls across Cozumel, Costa Maya, and Roatán.',
    provenance: {
      value: 'route-pattern:7n-western-caribbean-miami',
      sourceUrl: 'https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog',
      sourceType: 'dcc_editorial_verified',
      suppliedBy: 'dcc:route-pattern-engine',
      verifiedBy: 'dcc:schedule-reconciliation',
      knownAt: '2026-11-16T16:00:00Z',
      validAt: '2026-11-16T16:00:00Z',
      checkedAt: '2026-11-16T16:00:00Z',
      verificationState: 'verified',
      confidence: 'high',
      supersededValue: null,
    },
  },
  {
    routePatternId: 'route-pattern:4n-5n-cozumel-progreso-new-orleans',
    routeSlug: '4-to-5-night-western-caribbean-from-new-orleans',
    title: '4–5 Night Cozumel & Progreso Round-Trip from New Orleans',
    regionLabel: 'Gulf Coast & Western Caribbean',
    typicalNightsMin: 4,
    typicalNightsMax: 5,
    embarkPortSlug: 'new-orleans',
    embarkLocationId: 'location:new-orleans:erato-street-cruise-terminal',
    canonicalCallPortSlugs: ['cozumel', 'progreso'],
    canonicalCallLocationIds: [
      'location:cozumel:puerta-maya-pier',
      'location:progreso:causeway-pier-gate',
    ],
    summary:
      'High-frequency Mississippi River turnaround route pattern from New Orleans to Cozumel and Yucatán (Progreso), widely used by educational conferences and regional fan cruises.',
    provenance: {
      value: 'route-pattern:4n-5n-cozumel-progreso-new-orleans',
      sourceUrl: 'https://www.carnival.com/cruise-from/new-orleans',
      sourceType: 'cruise_line_official',
      suppliedBy: 'dcc:route-pattern-engine',
      verifiedBy: 'dcc:schedule-reconciliation',
      knownAt: '2026-11-16T16:00:00Z',
      validAt: '2026-11-16T16:00:00Z',
      checkedAt: '2026-11-16T16:00:00Z',
      verificationState: 'verified',
      confidence: 'high',
      supersededValue: null,
    },
  },
  {
    routePatternId: 'route-pattern:4n-5n-key-west-cozumel-tampa',
    routeSlug: '4-to-5-night-key-west-and-cozumel-from-tampa',
    title: '4–5 Night Key West, Nassau & Cozumel Charter Pattern from Florida',
    regionLabel: 'Florida & Bahamas',
    typicalNightsMin: 4,
    typicalNightsMax: 5,
    embarkPortSlug: 'miami',
    embarkLocationId: 'location:miami:portmiami-terminal-b',
    canonicalCallPortSlugs: ['key-west', 'nassau', 'cozumel'],
    canonicalCallLocationIds: [
      'location:key-west:mallory-square-outer-mole',
      'location:nassau:prince-george-wharf',
      'location:cozumel:puerta-maya-pier',
    ],
    summary:
      'Short festival charter route pattern favored by 4- and 5-night music, gaming, and fan charters out of Miami, Fort Lauderdale, and Tampa.',
    provenance: {
      value: 'route-pattern:4n-5n-key-west-cozumel-tampa',
      sourceUrl: 'https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog',
      sourceType: 'dcc_editorial_verified',
      suppliedBy: 'dcc:route-pattern-engine',
      verifiedBy: 'dcc:schedule-reconciliation',
      knownAt: '2026-11-16T16:00:00Z',
      validAt: '2026-11-16T16:00:00Z',
      checkedAt: '2026-11-16T16:00:00Z',
      verificationState: 'verified',
      confidence: 'high',
      supersededValue: null,
    },
  },
  {
    routePatternId: 'route-pattern:7n-alaska-inside-passage-seattle',
    routeSlug: '7-night-alaska-inside-passage-from-seattle',
    title: '7-Night Alaska Inside Passage Round-Trip from Seattle',
    regionLabel: 'Alaska',
    typicalNightsMin: 7,
    typicalNightsMax: 7,
    embarkPortSlug: 'seattle',
    embarkLocationId: 'location:juneau:aj-dock',
    canonicalCallPortSlugs: ['juneau'],
    canonicalCallLocationIds: ['location:juneau:aj-dock'],
    summary:
      'Weeklong Alaska Inside Passage pattern calling at Juneau, Skagway, Ketchikan, and Victoria.',
    provenance: {
      value: 'route-pattern:7n-alaska-inside-passage-seattle',
      sourceUrl: 'https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog',
      sourceType: 'dcc_editorial_verified',
      suppliedBy: 'dcc:route-pattern-engine',
      verifiedBy: 'dcc:schedule-reconciliation',
      knownAt: '2026-11-16T16:00:00Z',
      validAt: '2026-11-16T16:00:00Z',
      checkedAt: '2026-11-16T16:00:00Z',
      verificationState: 'verified',
      confidence: 'high',
      supersededValue: null,
    },
  },
  {
    routePatternId: 'route-pattern:7n-western-caribbean-galveston',
    routeSlug: '7-night-western-caribbean-from-galveston',
    title: '7-Night Western Caribbean Round-Trip from Galveston',
    regionLabel: 'Gulf Coast & Western Caribbean',
    typicalNightsMin: 6,
    typicalNightsMax: 7,
    embarkPortSlug: 'galveston',
    embarkLocationId: 'location:galveston:pier-10-terminal',
    canonicalCallPortSlugs: ['cozumel', 'costa-maya', 'roatan'],
    canonicalCallLocationIds: [
      'location:cozumel:puerta-maya-pier',
      'location:costa-maya:puerto-costa-maya-pier',
      'location:roatan:mahogany-bay-cruise-center',
    ],
    summary:
      'Texas Gulf Coast weeklong pattern serving Cozumel, Costa Maya, and Roatán aboard Royal Caribbean and Carnival ships.',
    provenance: {
      value: 'route-pattern:7n-western-caribbean-galveston',
      sourceUrl: 'https://www.portofgalveston.com/',
      sourceType: 'port_authority_official',
      suppliedBy: 'dcc:route-pattern-engine',
      verifiedBy: 'dcc:schedule-reconciliation',
      knownAt: '2026-11-16T16:00:00Z',
      validAt: '2026-11-16T16:00:00Z',
      checkedAt: '2026-11-16T16:00:00Z',
      verificationState: 'verified',
      confidence: 'high',
      supersededValue: null,
    },
  },
];

// In-memory + durable appendable verification queue for organizer schedule-correction proposals & source-conflict audits
const runtimeVerificationQueue: DccFactVerificationQueueItem[] = [];

export function enqueueDccFactVerificationItem(
  item: Omit<DccFactVerificationQueueItem, 'createdAt' | 'reviewedAt' | 'reviewedBy' | 'resolutionNote' | 'state'> & {
    createdAt?: string;
    state?: DccFactVerificationQueueItem['state'];
  },
): DccFactVerificationQueueItem {
  const existingIdx = runtimeVerificationQueue.findIndex(
    (q) => q.verificationId === item.verificationId,
  );
  const full: DccFactVerificationQueueItem = {
    ...item,
    state: item.state ?? 'needs_review',
    createdAt: item.createdAt ?? new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    resolutionNote: null,
  };
  if (existingIdx >= 0) {
    runtimeVerificationQueue[existingIdx] = full;
  } else {
    runtimeVerificationQueue.push(full);
  }
  return full;
}

export function listDccFactVerificationQueue(options?: {
  includeSyntheticTest?: boolean;
}): DccFactVerificationQueueItem[] {
  const includeSynthetic = Boolean(options?.includeSyntheticTest);
  return runtimeVerificationQueue.filter((q) => includeSynthetic || !q.isSyntheticTest);
}

export function recordUnresolvedPhysicalSailingLineFinding(params: {
  shipSlug: string;
  sailDate: string;
  verifiedSailingCruiseLine?: string | null;
  cruiseLineInput?: string | null;
  reason: "unrecognized_or_missing_line_code" | "ambiguous_dated_ship_operator";
  sourceContext?: string;
  isSyntheticTest?: boolean;
}): DccFactVerificationQueueItem {
  const cleanShip = params.shipSlug.trim().toLowerCase();
  const cleanDate = params.sailDate.trim();
  const verificationId = `vf_phys_line_${cleanShip}_${cleanDate}_${params.reason}`;
  return enqueueDccFactVerificationItem({
    verificationId,
    entityType: "physical_sailing",
    entityId: `unresolved-sailing:${cleanShip}:${cleanDate}`,
    fieldPath: "physicalSailingId.lineCode",
    currentVerifiedValue: null,
    proposedOrConflictingValue: {
      verifiedSailingCruiseLine: params.verifiedSailingCruiseLine ?? null,
      cruiseLineInput: params.cruiseLineInput ?? null,
      reason: params.reason,
    },
    submittedByRole: "dcc_source_audit",
    submittedByActor: params.sourceContext || "dcc:physical-sailing-line-resolver",
    sourceUrl: null,
    conflictSummary:
      params.reason === "ambiguous_dated_ship_operator"
        ? `Ambiguous dated ship/operator window for "${cleanShip}" on ${cleanDate}; refusing to synthesize physicalSailingId without verified cruise line.`
        : `Missing or unrecognized cruise line for "${cleanShip}" on ${cleanDate}; refusing to guess lineCode from ship name alone.`,
    isSyntheticTest: Boolean(params.isSyntheticTest),
  });
}

export function getCanonicalLocationsSummary() {
  return {
    totalLocations: CANONICAL_PORT_LOCATIONS.length,
    walkTimeEligibleCount: CANONICAL_PORT_LOCATIONS.filter(
      (l) => l.eligibleForWalkTimeCalculation,
    ).length,
    cityCentroidRestrictedCount: CANONICAL_PORT_LOCATIONS.filter(
      (l) => l.precisionTier === 'city_centroid',
    ).length,
    totalRoutePatterns: CANONICAL_ROUTE_PATTERNS.length,
  };
}
