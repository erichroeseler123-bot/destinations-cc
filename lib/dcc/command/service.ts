import { getPlanetaryEvents } from "@/lib/dcc/memory/resolve";
import { getNetworkLanes } from "@/lib/dcc/networkFeeds";
import { getPortSlugs } from "@/lib/dcc/ports";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { listRecentSatelliteEvents } from "@/lib/dcc/satelliteHandoffs";
import { COMMAND_CORRIDORS, getCorridorById, type GoldCorridorTemplate } from "@/lib/dcc/command/corridors";
import { getCommandEntrySurfaces } from "@/src/data/entry-surfaces";
import {
  COMMAND_ALERTS,
  COMMAND_BEST_MOVES,
  COMMAND_DESTINATIONS,
  COMMAND_MAP_CORRIDORS,
  COMMAND_MAP_DESTINATIONS,
} from "@/lib/dcc/command/mock";
import {
  buildBestMove,
  buildLiveSignal,
  buildPressureLabel,
  buildRecommendation,
  buildTransportStatus,
  calculateCorridorHealth,
  summarizeHandoffEvent,
  trendToStatus,
  type CommandCorridorDefinition,
} from "@/lib/dcc/command/scoring";
import type {
  BestMoveModel,
  CommandAlertModel,
  CommandEntrySurfaceCardModel,
  CommandEventModel,
  CorridorMapFeature,
  CommandStatusLevel,
  CommandViewPayload,
  CorridorHealthCardModel,
  DestinationStatusCardModel,
} from "@/lib/dcc/command/types";

type ScoredCorridorState = {
  definition: CommandCorridorDefinition;
  analysis: Awaited<ReturnType<typeof calculateCorridorHealth>>;
  card: CorridorHealthCardModel;
};

function hasMapGeometry(corridor: CommandCorridorDefinition | null): corridor is GoldCorridorTemplate {
  return Boolean(corridor && "map" in corridor && corridor.map);
}

function buildCorridorMapFeatures(corridors: ScoredCorridorState[]): CorridorMapFeature[] {
  return corridors.reduce<CorridorMapFeature[]>((features, entry) => {
      const template = getCorridorById(entry.definition.id);
      if (!hasMapGeometry(template)) return features;

      features.push({
        id: entry.definition.id,
        tier: entry.definition.tier,
        name: entry.definition.name,
        center: template.map.center,
        path: template.map.path,
        status: entry.card.status,
        trend: entry.analysis.trend,
        pressureLabel: entry.card.pressureLabel,
        bestMove: entry.card.bestMove,
      });

      return features;
    }, []);
}

function formatTimestamp(input: string): string {
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return input;
  return value.toISOString();
}

function eventSeverity(value: string | null | undefined): CommandStatusLevel {
  if (value === "high") return "busy";
  if (value === "low") return "watch";
  return "normal";
}

function buildGraphDestinationStatuses(): DestinationStatusCardModel[] {
  const summaries = listPlaceGraphSummaries(6);
  const bySlug = new Map(summaries.map((entry) => [entry.place_slug, entry]));

  return COMMAND_DESTINATIONS.map((destination) => {
    const summary = bySlug.get(destination.slug);
    if (!summary) return destination;

    const totalActions =
      summary.action_counts.cruises +
      summary.action_counts.events +
      summary.action_counts.tours +
      summary.action_counts.transport;

    return {
      ...destination,
      status: trendToStatus(summary.trend),
      liveSignal:
        summary.latest_event && summary.latest_event !== "none"
          ? summary.latest_event.replace(/_/g, " ")
          : destination.liveSignal,
      transportStatus:
        totalActions > 0
          ? `${summary.action_counts.transport} transport lanes and ${summary.action_counts.events} event signals active`
          : destination.transportStatus,
    };
  });
}

async function buildScoredCorridors(): Promise<ScoredCorridorState[]> {
  return Promise.all(
    COMMAND_CORRIDORS.map(async (corridor) => {
      const analysis = await calculateCorridorHealth(corridor);
      return {
        definition: corridor,
        analysis,
        card: {
          id: corridor.id,
          name: corridor.name,
          from: corridor.from,
          to: corridor.to,
          status: analysis.status,
          trend: analysis.trend,
          pressureLabel: buildPressureLabel(corridor, analysis),
          bestMove: buildBestMove(corridor, analysis),
        },
      };
    }),
  );
}

function buildDestinationStatuses(corridors: ScoredCorridorState[]): DestinationStatusCardModel[] {
  const graphBacked = buildGraphDestinationStatuses();
  const graphBySlug = new Map(graphBacked.map((entry) => [entry.slug, entry]));

  const corridorBindings: Record<string, string> = {
    denver: "denver-red-rocks",
    "denver-airport": "denver-dia",
    miami: "miami-port",
    "las-vegas": "vegas-strip",
  };

  return COMMAND_DESTINATIONS.map((destination) => {
    const graph = graphBySlug.get(destination.slug);
    const corridor = corridors.find((entry) => entry.definition.id === corridorBindings[destination.slug]);
    const definition = corridor?.definition;
    const analysis = corridor?.analysis;
    const card = corridor?.card;

    return {
      ...destination,
      status: card?.status || graph?.status || destination.status,
      liveSignal: definition && analysis ? buildLiveSignal(definition, analysis) : graph?.liveSignal || destination.liveSignal,
      transportStatus:
        definition && analysis
          ? buildTransportStatus(definition, analysis)
          : graph?.transportStatus || destination.transportStatus,
      recommendation:
        definition && analysis
          ? buildRecommendation(definition, analysis)
          : graph?.recommendation || destination.recommendation,
    };
  });
}

function buildBestMoves(corridors: ScoredCorridorState[]): BestMoveModel[] {
  const dynamic = corridors
    .map((entry) => entry.card)
    .filter((corridor) => corridor.status !== "normal")
    .slice(0, 3)
    .map((corridor) => ({
      id: `move-${corridor.id}`,
      title: `${corridor.name} needs a tactical move`,
      context: corridor.pressureLabel,
      recommendation: corridor.bestMove,
      status: corridor.status,
    }));

  return dynamic.length > 0 ? dynamic : COMMAND_BEST_MOVES;
}

function buildAlerts(corridors: ScoredCorridorState[]): CommandAlertModel[] {
  const dynamic = corridors
    .map((entry) => entry.card)
    .filter((corridor) => corridor.status === "critical" || corridor.status === "busy")
    .map((corridor) => ({
      id: `alert-${corridor.id}`,
      title: `${corridor.name} under pressure`,
      impact: corridor.pressureLabel,
      severity: corridor.status,
      href:
        corridor.id === "denver-red-rocks"
          ? "/red-rocks-transportation"
          : corridor.id === "denver-dia"
            ? "/command"
            : corridor.id === "miami-port"
              ? "/command"
              : "/command",
    }));

  return dynamic.length > 0 ? dynamic : COMMAND_ALERTS;
}

function buildEntrySurfaceCards(): CommandEntrySurfaceCardModel[] {
  return getCommandEntrySurfaces().map((entry) => ({
    id: entry.id,
    label: entry.label,
    path: entry.path,
    kind: entry.kind,
    intent: entry.intent,
    state: entry.state,
  }));
}

function buildLiveStream(): CommandEventModel[] {
  const planetary = getPlanetaryEvents(6).map((event) => ({
    id: event.id,
    timestamp: formatTimestamp(event.timestamp),
    title: event.title,
    detail: `${event.event_type.replace(/_/g, " ")} event logged in the DCC memory timeline.`,
    severity: eventSeverity(event.severity),
  }));

  const handoff = listRecentSatelliteEvents("partyatredrocks", 8).map((event) => {
    const summary = summarizeHandoffEvent(event);
    return {
      id: event.eventId,
      timestamp: formatTimestamp(event.occurredAt || event.receivedAt),
      title: summary.title,
      detail:
        event.booking?.venueSlug === "red-rocks-amphitheatre"
          ? `${summary.detail} This is currently tied to the Red Rocks execution lane.`
          : summary.detail,
      severity: summary.severity,
    };
  });

  return [...planetary, ...handoff]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 8);
}

export async function getCommandViewData(): Promise<CommandViewPayload> {
  const [network] = await Promise.all([getNetworkLanes()]);
  const graphHealth = getGraphHealth();
  const graphSummaries = listPlaceGraphSummaries(200);
  const feedFallbacks = [network.parr, network.sots, network.fastPass].filter(
    (feed) => feed && feed.status !== "ok",
  ).length;
  const corridors = await buildScoredCorridors();
  const liveAlerts =
    graphSummaries.filter((row) => row.trend === "degrading").length +
    feedFallbacks +
    corridors.filter((corridor) => corridor.card.status === "busy" || corridor.card.status === "critical").length;
  const recentEvents = getPlanetaryEvents(20).length;
  const destinationStatuses = buildDestinationStatuses(corridors);
  const activeRoutes = graphHealth.edges + network.lanes.length;

  return {
    generatedAt: new Date().toISOString(),
    networkStatus: {
      placesTracked: graphHealth.places,
      activeRoutes,
      liveAlerts,
      recentEvents,
      portsMonitored: getPortSlugs().length,
    },
    entrySurfaces: buildEntrySurfaceCards(),
    mapData: {
      destinations: COMMAND_MAP_DESTINATIONS.map((destination) => {
        const match = destinationStatuses.find((entry) => entry.slug === destination.slug);
        return {
          ...destination,
          status: match?.status || destination.status,
        };
      }),
      corridors: COMMAND_MAP_CORRIDORS.map((corridor) => ({
        ...corridor,
        status: corridors.find((entry) => entry.definition.id === corridor.id)?.card.status || corridor.status,
      })),
      features: buildCorridorMapFeatures(corridors),
    },
    corridors: corridors.map((entry) => entry.card),
    destinations: destinationStatuses,
    bestMoves: buildBestMoves(corridors),
    alerts: buildAlerts(corridors),
    liveStream: buildLiveStream(),
  };
}
