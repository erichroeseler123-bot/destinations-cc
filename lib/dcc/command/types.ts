export type CommandStatusLevel = "normal" | "watch" | "busy" | "critical";

export type CommandNetworkStatus = {
  placesTracked: number;
  activeRoutes: number;
  liveAlerts: number;
  recentEvents: number;
  portsMonitored: number;
};

export type CommandMapDestination = {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  status: CommandStatusLevel;
};

export type CommandMapCorridor = {
  id: string;
  name: string;
  from: string;
  to: string;
  status: CommandStatusLevel;
};

export type CorridorDebugSignalSource = "shipment_events" | "satellite_handoffs" | "graph_signals" | "fallback";

export type CorridorDebugSource = {
  primary: CorridorDebugSignalSource;
  contributing: CorridorDebugSignalSource[];
  confidence: "low" | "medium" | "high";
};

export type CorridorMapFeature = {
  id: string;
  tier?: "gold";
  name: string;
  center: { lat: number; lon: number };
  path: Array<[number, number]>;
  status: CommandStatusLevel;
  trend: "improving" | "steady" | "slipping";
  pressureLabel: string;
  bestMove: string;
};

export type CorridorHealthCardModel = {
  id: string;
  name: string;
  from: string;
  to: string;
  status: CommandStatusLevel;
  trend: "improving" | "steady" | "slipping";
  pressureLabel: string;
  bestMove: string;
};

export type CommandEntrySurfaceCardModel = {
  id: string;
  label: string;
  path: string;
  kind: "city" | "corridor" | "feeder";
  intent: "transport" | "tours" | "activity" | "mixed";
  state?: string;
};

export type DestinationStatusCardModel = {
  slug: string;
  name: string;
  status: CommandStatusLevel;
  transportStatus: string;
  liveSignal: string;
  recommendation: string;
};

export type BestMoveModel = {
  id: string;
  title: string;
  context: string;
  recommendation: string;
  status: CommandStatusLevel;
};

export type CommandAlertModel = {
  id: string;
  title: string;
  impact: string;
  severity: CommandStatusLevel;
  href?: string;
};

export type CommandEventModel = {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  severity: CommandStatusLevel;
};

export type CommandViewPayload = {
  generatedAt: string;
  networkStatus: CommandNetworkStatus;
  entrySurfaces: CommandEntrySurfaceCardModel[];
  mapData: {
    destinations: CommandMapDestination[];
    corridors: CommandMapCorridor[];
    features: CorridorMapFeature[];
  };
  corridors: CorridorHealthCardModel[];
  destinations: DestinationStatusCardModel[];
  bestMoves: BestMoveModel[];
  alerts: CommandAlertModel[];
  liveStream: CommandEventModel[];
};
