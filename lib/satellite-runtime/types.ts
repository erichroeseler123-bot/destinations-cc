export type SatelliteRequirementLevel = "CRITICAL" | "LOCAL_SMOKE" | "PROD_ONLY" | "OPTIONAL";

export type SatelliteContract = {
  satelliteId: string;
  brandId: string;
  dccBaseUrl: string;
  env?: SatelliteEnvVar[];
};

export type SatelliteEnvVar = {
  key: string;
  level: SatelliteRequirementLevel;
  description: string;
};

export type SatelliteEnvValidationIssue = {
  key: string;
  level: SatelliteRequirementLevel;
  description: string;
};

export type SatelliteEnvValidationResult = {
  ok: boolean;
  missing: SatelliteEnvValidationIssue[];
  checked: string[];
};

export type SatelliteDecisionContext = {
  decision_corridor: string | null;
  decision_action: string | null;
  decision_option: string | null;
  decision_product: string | null;
};

export type SatelliteHandoffContext = SatelliteDecisionContext & {
  satelliteId: string;
  brandId: string;
  dccBaseUrl: string;
  dccHandoffId: string;
  source_url: string | null;
  destination_url: string | null;
};

export type SatelliteTelemetryInput = SatelliteHandoffContext & {
  event_name: string;
  event_payload: Record<string, unknown>;
  occurredAt?: string;
};

export type SatelliteTelemetryEvent = {
  satelliteId: string;
  brandId: string;
  handoffId: string;
  eventName: string;
  eventPayload: Record<string, unknown>;
  occurredAt: string;
  decision: SatelliteDecisionContext;
  sourceUrl: string | null;
  destinationUrl: string | null;
};

export type SatelliteTelemetryResult = {
  ok: boolean;
  status?: number;
  event?: SatelliteTelemetryEvent;
  error?: string;
};

export type PaymentSessionRequest = SatelliteHandoffContext & {
  amountCents: number;
  currency: string;
  provider: "square" | "stripe" | "manual";
  metadata?: Record<string, unknown>;
};

export type PaymentSessionResponse = {
  ok: boolean;
  dccHandoffId: string;
  sessionToken?: string;
  checkoutUrl?: string;
  error?: string;
};

export type MailerBrandConfig = {
  brandId: string;
  fromEnvKey: string;
  replyToEnvKey?: string;
  displayName: string;
  baseUrl?: string;
};

export type SmokeTestCheck = {
  name: string;
  ok: boolean;
  detail?: string;
};

export type SmokeTestResult = {
  ok: boolean;
  satelliteId: string;
  checks: SmokeTestCheck[];
};
