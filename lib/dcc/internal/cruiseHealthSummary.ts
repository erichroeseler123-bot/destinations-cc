import {
  getCruiseProviderHealthDiagnostics,
  getCruiseProviderHealthSnapshotStatus,
  readCruiseProviderHealthSnapshot,
} from "@/lib/dcc/action/cruiseProviderHealth";

export function getCruiseHealthSummary() {
  const snapshot = readCruiseProviderHealthSnapshot();
  const status = getCruiseProviderHealthSnapshotStatus(snapshot);
  const diagnostics = getCruiseProviderHealthDiagnostics(snapshot);
  return {
    snapshot,
    status,
    diagnostics,
    providerRows: snapshot?.provider_status || [],
    totals: snapshot?.totals || {
      providers_total: 0,
      providers_configured: 0,
      live_rows: 0,
      provider_errors: 0,
    },
  };
}
