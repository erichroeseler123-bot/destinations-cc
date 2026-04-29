export type MissionStatus = "running" | "waiting" | "failed" | "completed";

export type WorkflowSignalEvent = "erich-approval" | "mission-cancel";

export type MissionStepStatus = MissionStatus;

export type MissionEntity = "gosno" | "alaska" | "redrocks" | "earthos";

export type LaunchMissionInput = {
  entity: MissionEntity;
  region: string;
  missionType: string;
  objective: string;
};

export type MissionRiskLevel = "Normal" | "Watch" | "High";

export type MissionIntelligence = {
  headline: string;
  briefing: string;
  riskLevel: MissionRiskLevel;
  recommendedAction: string;
  dccSignals: {
    alertCount: number;
    graphHealth: number | null;
  };
};

export type MissionPublication = {
  missionId: string;
  slug: string;
  path: string;
  entity: MissionEntity;
  region: string;
  headline: string;
  briefing: string;
  riskLevel: MissionRiskLevel;
  recommendedAction: string;
  publishedAt: string;
  networkTarget: "live-ops";
};

export type RuntimeMissionStep = {
  id: string;
  name: string;
  status: MissionStepStatus;
  startedAt: string | null;
  endedAt: string | null;
  retryCount: number;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
};

export type RuntimeMission = {
  id: string;
  entity: MissionEntity;
  region: string;
  mission: string;
  status: MissionStatus;
  currentStep: string | null;
  startedAt: string;
  updatedAt: string;
  lastCheckpointAt: string | null;
  waitingForEvent: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: {
    message: string;
    step?: string;
  } | null;
  steps: RuntimeMissionStep[];
};

export type MissionListItem = {
  id: string;
  entity: MissionEntity;
  region: string;
  mission: string;
  status: MissionStatus;
  currentStep: string | null;
  progressPercent: number | null;
  startedAt: string;
  updatedAt: string;
  lastCheckpointAt: string | null;
  waitingForEvent: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  isStale: boolean;
  isOverdueApproval: boolean;
  intelligence: MissionIntelligence | null;
};

export type MissionStep = {
  id: string;
  name: string;
  status: MissionStepStatus;
  startedAt: string | null;
  endedAt: string | null;
  retryCount: number;
  outputPreview: string | null;
  errorMessage: string | null;
};

export type MissionDetail = {
  id: string;
  entity: MissionEntity;
  region: string;
  mission: string;
  status: MissionStatus;
  currentStep: string | null;
  startedAt: string;
  updatedAt: string;
  lastCheckpointAt: string | null;
  waitingForEvent: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: {
    message: string;
    step?: string;
  } | null;
  durationMs: number | null;
  isStale: boolean;
  isOverdueApproval: boolean;
  intelligence: MissionIntelligence | null;
  publication: MissionPublication | null;
  steps: MissionStep[];
};

export type MissionListResponse = {
  ok: true;
  missions: MissionListItem[];
  fetchedAt: string;
};

export type MissionDetailResponse = {
  ok: true;
  mission: MissionDetail;
  fetchedAt: string;
};
