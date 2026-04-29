import type {
  LaunchMissionInput,
  MissionPublication,
  RuntimeMission,
} from "@/lib/dcc/earthos/workflows/types";

type WorkflowRuntimeStore = {
  version: number;
  missions: RuntimeMission[];
  publications: MissionPublication[];
};

const STALE_AFTER_MS = 10 * 60 * 1000;
const APPROVAL_SLA_MS = 24 * 60 * 60 * 1000;

function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

function seedMissions(): RuntimeMission[] {
  const now = new Date();

  return [
    {
      id: "mission_scan_aspen",
      entity: "gosno",
      region: "Colorado Front Range",
      mission: "Scan Aspen mountain transport health",
      status: "running",
      currentStep: "fetch-snow-depth",
      startedAt: minutesAgo(now, 18),
      updatedAt: minutesAgo(now, 14),
      lastCheckpointAt: minutesAgo(now, 14),
      waitingForEvent: null,
      payload: {
        missionType: "regional-scan",
        city: "Aspen",
        objective: "Assess transport viability and powder demand for same-day dispatch",
        alertCount: 2,
        graphHealth: 91,
      },
      result: {
        dccContext: {
          alertCount: 2,
          topAlert: "Traction law is active while overnight snowfall has pushed powder demand higher.",
          relevantAlerts: [
            {
              id: "i70-traction-law",
              title: "I-70 traction law active",
              impact: "Passenger vehicles need traction equipment westbound through the mountain corridor.",
              severity: "watch",
            },
            {
              id: "aspen-powder-demand",
              title: "Powder demand rising",
              impact: "Aspen and Snowmass are both showing more than 8 inches of overnight snowfall.",
              severity: "watch",
            },
          ],
          networkStatus: {
            placesTracked: 91,
            activeRoutes: 14,
            liveAlerts: 2,
            recentEvents: 7,
            portsMonitored: 0,
          },
        },
        synthesis: {
          briefing:
            "Powder demand is high across the Aspen lane. Traction law is active on I-70 and mountain demand is rising after more than 8 inches of overnight snowfall, so dispatch should assess cams and chain-control viability before releasing the next shuttle wave.",
          recommendedAction: "Assess Road Viability",
          riskLevel: "Watch",
        },
      },
      error: null,
      steps: [
        {
          id: "step_seed_signals",
          name: "seed-front-range-signals",
          status: "completed",
          startedAt: minutesAgo(now, 18),
          endedAt: minutesAgo(now, 17),
          retryCount: 0,
          output: { scannedCities: ["Denver", "Boulder", "Aspen"] },
          errorMessage: null,
        },
        {
          id: "step_fetch_snow_depth",
          name: "fetch-snow-depth",
          status: "running",
          startedAt: minutesAgo(now, 4),
          endedAt: null,
          retryCount: 0,
          output: {
            provider: "mcp://dcc-satellite/weather",
            city: "Aspen",
            overnightSnowInches: 12,
            tractionLawActive: true,
            roadCamerasChecked: false,
          },
          errorMessage: null,
        },
      ],
    },
    {
      id: "mission_juneau_dispatch",
      entity: "alaska",
      region: "Southeast Alaska",
      mission: "Flight dispatch risk briefing",
      status: "waiting",
      currentStep: "erich-approval",
      startedAt: minutesAgo(now, 220),
      updatedAt: minutesAgo(now, 1600),
      lastCheckpointAt: minutesAgo(now, 1600),
      waitingForEvent: "erich-approval",
      payload: {
        missionType: "dispatch-approval",
        port: "Juneau",
        objective: "Approve shuttle reallocation after flight arrival compression",
        alertCount: 4,
        graphHealth: 82,
      },
      result: {
        dccContext: {
          alertCount: 4,
          topAlert: "Three Juneau arrivals are collapsing into a 60-minute gate window while a cruise departure wave is staging.",
          relevantAlerts: [
            {
              id: "jnu-flight-compression",
              title: "Juneau flight compression",
              impact: "Three flights now arrive inside a 60-minute window.",
              severity: "critical",
            },
            {
              id: "jnu-shuttle-load",
              title: "Shuttle load factor rising",
              impact: "Overflow vans are already above 92% projected load.",
              severity: "busy",
            },
            {
              id: "jnu-port-wind",
              title: "Port wind pressure",
              impact: "Crosswinds are slowing passenger egress from the dock.",
              severity: "watch",
            },
            {
              id: "jnu-tendering-delay",
              title: "Tendering delay",
              impact: "Tender sequence is behind by 12 minutes.",
              severity: "watch",
            },
          ],
          networkStatus: {
            placesTracked: 82,
            activeRoutes: 19,
            liveAlerts: 4,
            recentEvents: 11,
            portsMonitored: 6,
          },
        },
        synthesis: {
          briefing:
            "Juneau port compression is active. Three flights are now arriving inside a 60-minute window while dockside passenger flow is delayed. Shuttle load factor is already projecting at 92%, so reallocate two overflow vans and hold a reserve driver for baggage recovery before the boarding surge lands.",
          recommendedAction: "Immediate Satellite Dispatch",
          riskLevel: "High",
        },
        },
      error: null,
      steps: [
        {
          id: "step_scan_flights",
          name: "scan-juneau-arrivals",
          status: "completed",
          startedAt: minutesAgo(now, 220),
          endedAt: minutesAgo(now, 205),
          retryCount: 0,
          output: {
            delayedFlights: 3,
            compressedWindowMinutes: 60,
            shuttleLoadFactor: 92,
            cruiseBoardingWindowMinutes: 45,
          },
          errorMessage: null,
        },
        {
          id: "step_synthesize",
          name: "global-synthesis",
          status: "completed",
          startedAt: minutesAgo(now, 205),
          endedAt: minutesAgo(now, 200),
          retryCount: 1,
          output: {
            model: "openai/gpt-5.4",
            recommendation: "Immediate Satellite Dispatch",
            riskLevel: "High",
            headline: "PORT COMPRESSION DETECTED",
          },
          errorMessage: null,
        },
        {
          id: "step_approval",
          name: "erich-approval",
          status: "waiting",
          startedAt: minutesAgo(now, 200),
          endedAt: null,
          retryCount: 0,
          output: {
            requestedAction: "Approve immediate Juneau overflow reallocation",
          },
          errorMessage: null,
        },
      ],
    },
    {
      id: "mission_redrocks_ticket_sync",
      entity: "redrocks",
      region: "Denver Metro",
      mission: "Ticket sync and shuttle load balancing",
      status: "failed",
      currentStep: "mcp-fetch",
      startedAt: minutesAgo(now, 45),
      updatedAt: minutesAgo(now, 14),
      lastCheckpointAt: minutesAgo(now, 25),
      waitingForEvent: null,
      payload: {
        missionType: "inventory-sync",
        venue: "Red Rocks Amphitheatre",
        objective: "Sync ticket velocity and shuttle load assumptions before doors",
      },
      result: null,
      error: {
        message: "Seat inventory MCP fetch timed out after repeated upstream 504s.",
        step: "mcp-fetch",
      },
      steps: [
        {
          id: "step_load_manifest",
          name: "load-venue-manifest",
          status: "completed",
          startedAt: minutesAgo(now, 45),
          endedAt: minutesAgo(now, 40),
          retryCount: 0,
          output: { activeRoutes: 6, reservedPassengers: 212 },
          errorMessage: null,
        },
        {
          id: "step_mcp_fetch",
          name: "mcp-fetch",
          status: "failed",
          startedAt: minutesAgo(now, 40),
          endedAt: minutesAgo(now, 14),
          retryCount: 3,
          output: { tool: "get_show_inventory", provider: "mcp://ops-satellite/ticketing" },
          errorMessage: "Upstream provider exceeded timeout budget.",
        },
      ],
    },
    {
      id: "mission_global_ports",
      entity: "earthos",
      region: "Global Ports",
      mission: "Global port synthesis",
      status: "completed",
      currentStep: "dispatch-ops",
      startedAt: minutesAgo(now, 90),
      updatedAt: minutesAgo(now, 60),
      lastCheckpointAt: minutesAgo(now, 60),
      waitingForEvent: null,
      payload: {
        missionType: "global-synthesis",
        regions: ["Juneau", "Ketchikan", "Cozumel"],
        objective: "Publish a cross-port ops brief for next departures",
      },
      result: {
        briefing:
          "Alaska ports require weather-driven contingency dispatch. Cozumel remains normal with no tendering escalation.",
        dispatchLogId: "dispatch_earthos_0422",
      },
      error: null,
      steps: [
        {
          id: "step_scan_regions",
          name: "scan-regions",
          status: "completed",
          startedAt: minutesAgo(now, 90),
          endedAt: minutesAgo(now, 75),
          retryCount: 0,
          output: { scannedRegions: 3, anomalies: 2 },
          errorMessage: null,
        },
        {
          id: "step_global_synthesis",
          name: "global-synthesis",
          status: "completed",
          startedAt: minutesAgo(now, 75),
          endedAt: minutesAgo(now, 66),
          retryCount: 0,
          output: { model: "anthropic/claude-3-5-sonnet", confidence: "high" },
          errorMessage: null,
        },
        {
          id: "step_dispatch_ops",
          name: "dispatch-ops",
          status: "completed",
          startedAt: minutesAgo(now, 66),
          endedAt: minutesAgo(now, 60),
          retryCount: 0,
          output: { notifiedTeams: ["gosno", "alaska", "redrocks"] },
          errorMessage: null,
        },
      ],
    },
  ];
}

function getRuntimeStore(): WorkflowRuntimeStore {
  const globalStore = globalThis as typeof globalThis & {
    __earthosWorkflowStore?: WorkflowRuntimeStore;
  };

  if (!globalStore.__earthosWorkflowStore) {
    globalStore.__earthosWorkflowStore = {
      version: 1,
      missions: seedMissions(),
      publications: [],
    };
  }

  return globalStore.__earthosWorkflowStore;
}

export function readRuntimeMissions(): RuntimeMission[] {
  return getRuntimeStore().missions;
}

export function findRuntimeMission(id: string): RuntimeMission | null {
  return readRuntimeMissions().find((mission) => mission.id === id) || null;
}

export function writeRuntimeMissions(missions: RuntimeMission[]): void {
  const store = getRuntimeStore();
  store.missions = missions;
}

export function updateRuntimeMission(
  id: string,
  updater: (mission: RuntimeMission) => RuntimeMission,
): RuntimeMission | null {
  const store = getRuntimeStore();
  const index = store.missions.findIndex((mission) => mission.id === id);
  if (index === -1) return null;

  store.missions[index] = updater(store.missions[index]);
  return store.missions[index];
}

export function appendRuntimeMission(input: LaunchMissionInput): RuntimeMission {
  const now = new Date().toISOString();
  const id = `mission_${input.entity}_${Date.now()}`;

  const mission: RuntimeMission = {
    id,
    entity: input.entity,
    region: input.region,
    mission: input.objective,
    status: "running",
    currentStep: input.entity === "earthos" ? "global-synthesis" : `scan-${input.entity}-signals`,
    startedAt: now,
    updatedAt: now,
    lastCheckpointAt: now,
    waitingForEvent: null,
    payload: {
      entity: input.entity,
      region: input.region,
      missionType: input.missionType,
      objective: input.objective,
      launchSource: "dashboard",
    },
    result: null,
    error: null,
    steps: [
      {
        id: `step_launch_${id}`,
        name: "launch-mission",
        status: "completed",
        startedAt: now,
        endedAt: now,
        retryCount: 0,
        output: {
          missionType: input.missionType,
          launchSource: "dashboard",
        },
        errorMessage: null,
      },
      {
        id: `step_scan_${id}`,
        name: input.entity === "earthos" ? "global-synthesis" : `scan-${input.entity}-signals`,
        status: "running",
        startedAt: now,
        endedAt: null,
        retryCount: 0,
        output: {
          region: input.region,
          objective: input.objective,
        },
        errorMessage: null,
      },
    ],
  };

  const store = getRuntimeStore();
  store.missions = [mission, ...store.missions];
  return mission;
}

export function findMissionPublicationByMissionId(missionId: string): MissionPublication | null {
  return getRuntimeStore().publications.find((publication) => publication.missionId === missionId) || null;
}

export function findMissionPublicationBySlug(slug: string): MissionPublication | null {
  return getRuntimeStore().publications.find((publication) => publication.slug === slug) || null;
}

export function readMissionPublications(): MissionPublication[] {
  return getRuntimeStore().publications;
}

export function upsertMissionPublication(publication: MissionPublication): MissionPublication {
  const store = getRuntimeStore();
  const index = store.publications.findIndex((entry) => entry.missionId === publication.missionId);

  if (index === -1) {
    store.publications = [publication, ...store.publications];
    return publication;
  }

  store.publications[index] = publication;
  return store.publications[index];
}

export { APPROVAL_SLA_MS, STALE_AFTER_MS };
