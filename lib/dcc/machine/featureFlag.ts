/**
 * DCC Machine Layer v0.1 — Feature Flag & Rollback Control
 *
 * Governs access to the DCC Machine Layer v0.1 (`DCC_MACHINE_V1`).
 * Supports instant environment-variable gating and runtime override for rollback verification.
 */

let runtimeFeatureFlagOverride: boolean | null = null;

export function isDccMachineV1Enabled(): boolean {
  if (runtimeFeatureFlagOverride !== null) {
    return runtimeFeatureFlagOverride;
  }
  const raw = (process.env.DCC_MACHINE_V1 ?? "1").trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off" || raw === "disabled") {
    return false;
  }
  return true;
}

export function setDccMachineV1FlagForTests(enabled: boolean | null): void {
  runtimeFeatureFlagOverride = enabled;
}

export function setDccMachineV1RuntimeOverride(enabled: boolean | null): void {
  runtimeFeatureFlagOverride = enabled;
}

export function getDccMachineV1Status() {
  return {
    featureFlag: "DCC_MACHINE_V1" as const,
    enabled: isDccMachineV1Enabled(),
    overrideActive: runtimeFeatureFlagOverride !== null,
    version: "0.1.0",
  };
}
