/**
 * April 24 Dock Rollout Context:
 * 1. Juneau:
 *    - Opens the Whale Deck Backup Flow ONLY from a traveler's "My flight was canceled"
 *      selection (`?flight_canceled=1`) OR an operator's tracked cancellation link
 *      (`?cancel_ref=<operator_token>`).
 *    - Uses PAJN METAR (Juneau International Airport) strictly as weather context —
 *      never infers or fabricates flight cancellation status from weather alone.
 * 2. New Orleans:
 *    - Uses relevant NWS flood warnings (`LIX` / Southeast Louisiana bayou zones) and
 *      water-level observations (USGS/NOAA Bayou Barataria at Lafitte 07380335 &
 *      West Pearl River at Pearl River 02492620) to flag affected bayou trips for an
 *      operator check (`Operator check required`).
 */

export interface PajnMetarContext {
  stationId: "PAJN";
  stationName: "Juneau International Airport (PAJN)";
  rawMetar: string;
  observedAtIso: string;
  flightCategory: "VFR" | "MVFR" | "IFR" | "LIFR";
  ceilingFeetAgl: number | null;
  visibilityStatuteMiles: number;
  windSummary: string;
  contextNote: string;
}

export interface JuneauBackupFlowContext {
  backupFlowOpen: boolean;
  cancellationSource: "TRAVELER_SELECTION" | "OPERATOR_TRACKED_LINK" | "NONE";
  operatorCancelRef: string | null;
  statusHeadline: string;
  statusExplanation: string;
  pajnMetar: PajnMetarContext;
}

export const DEFAULT_PAJN_METAR_CONTEXT: PajnMetarContext = {
  stationId: "PAJN",
  stationName: "Juneau International Airport (PAJN)",
  rawMetar: "PAJN 241653Z 11014G22KT 2SM -RA BR OVC009 06/05 A2968 RMK AO2",
  observedAtIso: "2026-04-24T16:53:00Z",
  flightCategory: "IFR",
  ceilingFeetAgl: 900,
  visibilityStatuteMiles: 2,
  windSummary: "ESE 14 kt gusting 22 kt",
  contextNote:
    "PAJN METAR is shown strictly as local aviation weather context. Actual helicopter or floatplane cancellation status comes only from your operator or your selection below.",
};

export function evaluateJuneauBackupFlow(params: {
  travelerSelectedCanceled?: boolean | string | null;
  operatorCancelRef?: string | null;
  pajnMetarOverride?: Partial<PajnMetarContext>;
}): JuneauBackupFlowContext {
  const metar: PajnMetarContext = {
    ...DEFAULT_PAJN_METAR_CONTEXT,
    ...(params.pajnMetarOverride || {}),
  };

  const cleanCancelRef =
    typeof params.operatorCancelRef === "string" && params.operatorCancelRef.trim().length > 0
      ? params.operatorCancelRef.trim()
      : null;

  const travelerFlag =
    params.travelerSelectedCanceled === true ||
    params.travelerSelectedCanceled === "1" ||
    params.travelerSelectedCanceled === "true" ||
    params.travelerSelectedCanceled === "yes";

  if (cleanCancelRef) {
    return {
      backupFlowOpen: true,
      cancellationSource: "OPERATOR_TRACKED_LINK",
      operatorCancelRef: cleanCancelRef,
      statusHeadline: `Backup Flow Active — Operator Cancellation Link (${cleanCancelRef})`,
      statusExplanation:
        "Your flight operator's tracked cancellation link opened the Auke Bay Whale Deck backup flow. Surface vessels in Stephens Passage operate under marine visibility rules and remain bookable when fits-cruise-window timing passes.",
      pajnMetar: metar,
    };
  }

  if (travelerFlag) {
    return {
      backupFlowOpen: true,
      cancellationSource: "TRAVELER_SELECTION",
      operatorCancelRef: null,
      statusHeadline: "Backup Flow Active — My Flight Was Canceled",
      statusExplanation:
        "You selected 'My flight was canceled'. Below are the same-day Auke Bay whale-watching and Mendenhall surface departures that fit your ship's confirmed all-aboard buffer.",
      pajnMetar: metar,
    };
  }

  return {
    backupFlowOpen: false,
    cancellationSource: "NONE",
    operatorCancelRef: null,
    statusHeadline: "Standard Juneau Whale Deck Mode (No Flight Cancellation Reported)",
    statusExplanation:
      "Select 'My flight was canceled' or use your flight operator's tracked cancellation link to open the immediate same-day backup flow.",
    pajnMetar: metar,
  };
}

export interface NolaNwsFloodAlert {
  alertId: string;
  office: "NWS New Orleans/Baton Rouge (LIX)";
  event: string;
  severity: "Moderate" | "Severe" | "Minor" | "None";
  affectedBasin: "BARATARIA_LAFITTE" | "HONEY_ISLAND_PEARL" | "MANCHAC_MAUREPAS";
  headline: string;
  active: boolean;
}

export interface NolaWaterLevelGauge {
  gaugeId: string;
  gaugeName: string;
  basin: "BARATARIA_LAFITTE" | "HONEY_ISLAND_PEARL" | "MANCHAC_MAUREPAS";
  observedFeetNavd88: number;
  actionStageFeetNavd88: number;
  floodStageFeetNavd88: number;
  observedAtIso: string;
}

export interface NolaBayouTripFlagResult {
  basin: "BARATARIA_LAFITTE" | "HONEY_ISLAND_PEARL" | "MANCHAC_MAUREPAS";
  flaggedForOperatorCheck: boolean;
  flagBadgeLabel: "Operator check required — NWS flood / water-level advisory" | "Normal bayou water-level conditions";
  waterLevelSummary: string;
  activeNwsWarningHeadline: string | null;
  operatorActionNote: string;
}

export const DEFAULT_NOLA_BAYOU_GAUGES: Record<
  "BARATARIA_LAFITTE" | "HONEY_ISLAND_PEARL" | "MANCHAC_MAUREPAS",
  NolaWaterLevelGauge
> = {
  BARATARIA_LAFITTE: {
    gaugeId: "USGS-07380335",
    gaugeName: "Bayou Barataria at Lafitte, LA (USGS 07380335)",
    basin: "BARATARIA_LAFITTE",
    observedFeetNavd88: 2.4,
    actionStageFeetNavd88: 3.2,
    floodStageFeetNavd88: 3.8,
    observedAtIso: "2026-04-24T14:00:00Z",
  },
  HONEY_ISLAND_PEARL: {
    gaugeId: "USGS-02492620",
    gaugeName: "West Pearl River at Pearl River, LA (USGS 02492620 / NWS PRLL1)",
    basin: "HONEY_ISLAND_PEARL",
    observedFeetNavd88: 10.6,
    actionStageFeetNavd88: 12.0,
    floodStageFeetNavd88: 14.0,
    observedAtIso: "2026-04-24T14:00:00Z",
  },
  MANCHAC_MAUREPAS: {
    gaugeId: "USGS-073802332",
    gaugeName: "Pass Manchac near Ponchatoula, LA (USGS 073802332)",
    basin: "MANCHAC_MAUREPAS",
    observedFeetNavd88: 1.9,
    actionStageFeetNavd88: 3.0,
    floodStageFeetNavd88: 4.0,
    observedAtIso: "2026-04-24T14:00:00Z",
  },
};

export function evaluateNolaBayouConditions(params: {
  basin: "BARATARIA_LAFITTE" | "HONEY_ISLAND_PEARL" | "MANCHAC_MAUREPAS";
  observedFeetOverride?: number;
  activeNwsFloodWarning?: NolaNwsFloodAlert | null;
}): NolaBayouTripFlagResult {
  const baseGauge = DEFAULT_NOLA_BAYOU_GAUGES[params.basin];
  const observedFeet =
    typeof params.observedFeetOverride === "number"
      ? params.observedFeetOverride
      : baseGauge.observedFeetNavd88;

  const exceedsActionOrFloodStage = observedFeet >= baseGauge.actionStageFeetNavd88;
  const hasActiveNwsWarning = Boolean(
    params.activeNwsFloodWarning &&
      params.activeNwsFloodWarning.active &&
      params.activeNwsFloodWarning.affectedBasin === params.basin,
  );

  const flagged = exceedsActionOrFloodStage || hasActiveNwsWarning;

  return {
    basin: params.basin,
    flaggedForOperatorCheck: flagged,
    flagBadgeLabel: flagged
      ? "Operator check required — NWS flood / water-level advisory"
      : "Normal bayou water-level conditions",
    waterLevelSummary: `${baseGauge.gaugeName}: ${observedFeet.toFixed(1)} ft NAVD88 (action stage ${baseGauge.actionStageFeetNavd88.toFixed(1)} ft / flood stage ${baseGauge.floodStageFeetNavd88.toFixed(1)} ft)`,
    activeNwsWarningHeadline: hasActiveNwsWarning
      ? params.activeNwsFloodWarning!.headline
      : null,
    operatorActionNote: flagged
      ? "Bayou trip is flagged for an operator check due to active NWS flood warning or elevated gauge reading. Confirm dock clearance and vessel dispatch with the operator before departure."
      : "NWS LIX alerts and USGS gauge levels are below action stage; standard bayou dispatch applies.",
  };
}
