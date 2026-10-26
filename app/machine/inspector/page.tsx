import Link from "next/link";
import {
  evaluateMachineEngine,
  getMachineBundle,
  getMachineStore,
  listMachineEngines,
} from "@/lib/dcc/machine";

export const dynamic = "force-dynamic";

export default async function MachineInspectorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const selectedEngineId =
    typeof params.engine === "string" &&
    (params.engine === "juneau-helicopter-tours" ||
      params.engine === "hawaii-whale-watching")
      ? params.engine
      : "juneau-helicopter-tours";

  const store = getMachineStore();
  const engines = listMachineEngines();
  const bundle = getMachineBundle(selectedEngineId);

  const sampleInputs =
    selectedEngineId === "juneau-helicopter-tours"
      ? {
          date: "2026-07-15",
          arrivalTime: "08:00",
          allAboardTime: "16:30",
          arrivalDock: "CT",
          groupSize: 2,
          youngestChildAgeYears: 14,
          maxSinglePassengerWeightLbs: 195,
          mobilityLevel: "mild_uneven_ice_ok",
          requestedFormat: "standard_glacier_walk",
          weatherCondition: "clear_vfr",
          maxBudgetPerPersonUsd: 600,
        }
      : {
          island: "maui",
          departureArea: "any",
          travelDate: "2027-02-14",
          availableWindowMinutes: 360,
          departureTimeOfDay: "early_morning_calm",
          groupSize: 2,
          youngestChildAgeYears: 12,
          hasPregnantTraveler: false,
          hasBackOrNeckInjury: false,
          mobilityLevel: "standard_marine_boarding",
          seasicknessOrRoughWaterConcern: "moderate_concern",
          vesselPreference: "large_stabilized_catamaran",
          charterMode: "shared_ticket",
          needsHotelOrPierTransfer: false,
          priorityMode: "comfort_and_stability",
          maxBudgetPerPersonUsd: 160,
        };

  const sampleEval = evaluateMachineEngine({
    engineId: selectedEngineId,
    inputs: sampleInputs,
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
  });

  const claimVersions = bundle
    ? Object.values(bundle.embeddedClaims)
    : Array.from(store.claimVersionsById.values());

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-mono text-sm">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="border border-slate-800 bg-slate-900/70 rounded-lg p-5">
          <div className="text-xs uppercase tracking-widest text-sky-400">
            DCC Machine Layer v0.1 • Secondary Human Inspector Projection
          </div>
          <h1 className="text-2xl font-bold mt-1">
            DCC Decision IR &amp; Immutable Evidence Fabric Inspector
          </h1>
          <p className="text-slate-400 mt-2">
            Rendered directly from the compiled{" "}
            <code>dcc-decision-ir/0.1</code> bundle, deterministic evaluation trace,
            and immutable <code>/r/&#123;id&#125;/v/&#123;version&#125;</code>{" "}
            reference graph.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {engines.map((eng) => (
              <Link
                key={eng.id}
                href={`/machine/inspector?engine=${eng.id}`}
                className={`px-3 py-1.5 rounded border ${
                  eng.id === selectedEngineId
                    ? "bg-sky-900/50 border-sky-400 text-sky-200"
                    : "bg-slate-900 border-slate-700 text-slate-300"
                }`}
              >
                {eng.id}@{eng.activeVersion}
              </Link>
            ))}
            <a
              href="/.well-known/dcc"
              className="px-3 py-1.5 rounded border border-slate-700 bg-slate-900 text-emerald-300"
            >
              GET /.well-known/dcc
            </a>
            <a
              href={`/api/v1/bundles/${selectedEngineId}/1.0.0`}
              className="px-3 py-1.5 rounded border border-slate-700 bg-slate-900 text-amber-300"
            >
              GET /api/v1/bundles/{selectedEngineId}/1.0.0
            </a>
          </div>
        </header>

        {bundle && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400">Active Compiled Bundle</div>
              <div className="text-lg font-bold mt-1">{bundle.id}</div>
              <div className="mt-2 text-xs space-y-1 text-slate-300">
                <div>
                  IR Schema: <code>{bundle.irSchemaVersion}</code>
                </div>
                <div>
                  Jurisdiction: <code>{bundle.jurisdiction}</code> ({bundle.timezone})
                </div>
                <div>
                  Bundle Hash:{" "}
                  <code className="text-sky-300">
                    {bundle.bundleHash.slice(0, 20)}…
                  </code>
                </div>
                <div>
                  Immutable URI:{" "}
                  <a
                    href={bundle.immutableReferenceUri}
                    className="text-sky-400 underline"
                  >
                    {bundle.immutableReferenceUri}
                  </a>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-4">
              <div className="text-xs text-slate-400">Compiled Graph Counts</div>
              <div className="mt-2 text-xs space-y-1 text-slate-300">
                <div>Candidates: {bundle.candidates.length}</div>
                <div>Rules: {bundle.rules.length}</div>
                <div>
                  Embedded Claim Versions:{" "}
                  {Object.keys(bundle.embeddedClaims).length}
                </div>
                <div>
                  Open Conflicts: {Object.keys(bundle.embeddedConflicts).length}
                </div>
                <div>
                  RuleSet Hash:{" "}
                  <code>{bundle.manifest.ruleSetHash.slice(0, 20)}…</code>
                </div>
              </div>
            </div>

            {sampleEval.ok && (
              <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-4">
                <div className="text-xs text-slate-400">
                  Deterministic Evaluation Output
                </div>
                <div className="text-lg font-bold mt-1 text-emerald-400">
                  {sampleEval.response.decisionState}
                </div>
                <div className="mt-2 text-xs space-y-1 text-slate-300">
                  <div>
                    Recommended:{" "}
                    <code>
                      {sampleEval.response.recommendedCandidateId ?? "none"}
                    </code>
                  </div>
                  <div>
                    Result Hash:{" "}
                    <code>{sampleEval.response.resultHash.slice(0, 20)}…</code>
                  </div>
                  <div>
                    Trace Hash:{" "}
                    <code>{sampleEval.response.traceHash.slice(0, 20)}…</code>
                  </div>
                  <div>
                    Trace URI:{" "}
                    <a
                      href={`/r/${sampleEval.response.traceId}/v/1`}
                      className="text-sky-400 underline"
                    >
                      /r/{sampleEval.response.traceId}/v/1
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {sampleEval.ok && (
          <section className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-4">
            <h2 className="text-lg font-bold">
              Candidate Outcomes &amp; Rule Trace ({selectedEngineId})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">
                  Viable Candidates ({sampleEval.response.viableCandidates.length})
                </h3>
                <ul className="space-y-2">
                  {sampleEval.response.viableCandidates.map((cand) => (
                    <li
                      key={cand.candidateId}
                      className="border border-emerald-900/60 bg-slate-900 p-3 rounded"
                    >
                      <div className="font-bold">
                        {cand.title} (<code>{cand.candidateId}</code>)
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Status: <code>{cand.status}</code> • Preference Score:{" "}
                        {cand.preferenceScore} • Commercial Weight:{" "}
                        {cand.commercialWeightApplied}
                      </div>
                      <div className="text-xs mt-1">
                        Reason Codes: <code>{cand.reasonCodes.join(", ")}</code>
                      </div>
                      <div className="text-xs mt-1 flex flex-wrap gap-2">
                        {cand.referenceUris.map((uri) => (
                          <a
                            key={uri}
                            href={uri}
                            className="text-sky-400 underline"
                          >
                            {uri}
                          </a>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-rose-400 font-semibold mb-2">
                  Excluded Candidates (
                  {sampleEval.response.excludedCandidates.length})
                </h3>
                <ul className="space-y-2">
                  {sampleEval.response.excludedCandidates.map((cand) => (
                    <li
                      key={cand.candidateId}
                      className="border border-rose-900/60 bg-slate-900 p-3 rounded"
                    >
                      <div className="font-bold">
                        {cand.title} (<code>{cand.candidateId}</code>)
                      </div>
                      <div className="text-xs text-rose-300 mt-1">
                        Failed Hard Rules:{" "}
                        <code>{cand.failedHardRuleIds.join(", ")}</code> (
                        <code>{cand.reasonCodes.join(", ")}</code>)
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Remediation: {cand.remediationHints.join(" ")}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        <section className="border border-slate-800 bg-slate-900/40 rounded-lg p-5 space-y-3">
          <h2 className="text-lg font-bold">
            Immutable Claim Version Ledger ({claimVersions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3">ClaimVersion ID</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Subject / Predicate</th>
                  <th className="py-2 pr-3">Source Organization</th>
                  <th className="py-2 pr-3">Immutable Citation URI</th>
                </tr>
              </thead>
              <tbody>
                {claimVersions.map((cv) => (
                  <tr
                    key={cv.versionId}
                    className="border-b border-slate-900 hover:bg-slate-900/70"
                  >
                    <td className="py-2 pr-3">
                      <code>{cv.versionId}</code>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800">
                        {cv.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <code>{cv.subject}</code> → <code>{cv.predicate}</code>
                    </td>
                    <td className="py-2 pr-3">{cv.sourceOrganization}</td>
                    <td className="py-2 pr-3">
                      <a
                        href={cv.immutableReferenceUri}
                        className="text-sky-400 underline"
                      >
                        {cv.immutableReferenceUri}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
