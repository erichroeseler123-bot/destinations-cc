import { validateSatelliteEnv } from "./env";
import { parseSatelliteHandoff } from "./handoff";
import { buildTelemetryEvent } from "./telemetry";
import type { SatelliteContract, SmokeTestCheck, SmokeTestResult } from "./types";

function check(name: string, ok: boolean, detail?: string): SmokeTestCheck {
  return { name, ok, detail };
}

export function runSatelliteSmokeTest(input: {
  contract: SatelliteContract;
  env: Record<string, string | undefined>;
  sampleUrl?: string;
}): SmokeTestResult {
  const envResult = validateSatelliteEnv(input.env, input.contract);
  const url = new URL(input.sampleUrl || `${input.contract.dccBaseUrl}/handoff/dcc`);
  url.searchParams.set("dcc_handoff_id", "smoke_handoff_001");
  url.searchParams.set("decision_corridor", "smoke-corridor");
  url.searchParams.set("decision_action", "verify_satellite_runtime");

  const handoff = parseSatelliteHandoff(url, input.contract, "smoke_handoff_fallback");
  const telemetry = buildTelemetryEvent({
    ...handoff,
    event_name: "satellite_smoke_test",
    event_payload: { smoke: true },
  });

  const checks = [
    check("env", envResult.ok, envResult.ok ? "Environment contract satisfied." : `Missing ${envResult.missing.length} keys.`),
    check("handoff", handoff.dccHandoffId === "smoke_handoff_001", "Handoff id parsed from URL."),
    check("decision", handoff.decision_corridor === "smoke-corridor", "Decision corridor normalized."),
    check("telemetry", telemetry.eventName === "satellite_smoke_test", "Telemetry envelope built."),
  ];

  return {
    ok: checks.every((item) => item.ok),
    satelliteId: input.contract.satelliteId,
    checks,
  };
}
