import { performance } from "node:perf_hooks";
import {
  clearSafeEvaluationCache,
  compileDecisionEngineBundle,
  evaluateDecisionIrBundle,
  evaluateDecisionIrBundleBatch,
  getMachineStore,
  readImmutableArtifact,
  type DecisionIrBundle,
  type DecisionIrCandidate,
  type EngineCompilationInput,
} from "@/lib/dcc/machine";
import { buildJuneauAndHawaiiMachineSeed } from "@/lib/dcc/machine/seedJuneauAndHawaii";

export interface BundleBenchmarkMetrics {
  tier: "Small" | "Medium" | "Large";
  engineId: string;
  candidateCount: number;
  ruleCount: number;
  bundleSizeBytes: number;
  bundleCompileMs: number;
  bundleLoadFromArtifactMs: number;
  coldEvalMeanMs: number;
  coldEvalP50Ms: number;
  coldEvalP95Ms: number;
  coldEvalP99Ms: number;
  warmEvalMeanMs: number;
  warmEvalP50Ms: number;
  warmEvalP95Ms: number;
  warmEvalP99Ms: number;
  batch100TotalMs: number;
  batchThroughputEvalsPerSec: number;
  heapUsedDeltaKb: number;
  rssMb: number;
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((p / 100) * sortedValues.length)),
  );
  return Number(sortedValues[idx].toFixed(4));
}

function buildScaledCompilationSpec(
  baseSpec: EngineCompilationInput,
  tier: "Medium" | "Large",
  targetCandidates: number,
  targetRules: number,
): EngineCompilationInput {
  const candidates: DecisionIrCandidate[] = [];
  const baseCommercial = baseSpec.candidates.filter(
    (c) => c.candidateClass === "commercial_tour",
  );
  const baseContingency = baseSpec.candidates.filter(
    (c) => c.candidateClass === "noncommercial_or_contingency",
  );

  for (let i = 0; i < targetCandidates - baseContingency.length; i++) {
    const template = baseCommercial[i % baseCommercial.length];
    candidates.push({
      ...template,
      candidateId: `${template.candidateId}-scale-${i + 1}`,
      title: `${template.title} (Variant #${i + 1})`,
      attributes: {
        ...template.attributes,
        activityMinutes:
          Number(template.attributes.activityMinutes ?? 80) + (i % 30),
        priceFromUsd:
          Number(template.attributes.priceFromUsd ?? 389) + (i % 15) * 10,
      },
    });
  }
  for (const cont of baseContingency) {
    candidates.push(cont);
  }

  const rules: EngineCompilationInput["rules"] = [];
  for (let i = 0; i < targetRules; i++) {
    const template = baseSpec.rules[i % baseSpec.rules.length];
    rules.push({
      ...template,
      id: i < baseSpec.rules.length ? template.id : `${template.id}:scale-${i + 1}`,
      reasonCode:
        i < baseSpec.rules.length
          ? template.reasonCode
          : `${template.reasonCode}_SCALE_${i + 1}`,
    });
  }

  return {
    ...baseSpec,
    engineId: `benchmark-${tier.toLowerCase()}-engine`,
    version: "1.0.0",
    candidates,
    rules,
  };
}

function benchmarkSingleBundle(
  tier: "Small" | "Medium" | "Large",
  spec: EngineCompilationInput,
): BundleBenchmarkMetrics {
  const store = getMachineStore();
  const existingBundles = new Map<string, DecisionIrBundle>();

  const memBefore = process.memoryUsage();
  const compileStart = performance.now();
  const compiled = compileDecisionEngineBundle(spec, {
    entities: store.entitiesById,
    sources: store.sourcesById,
    sourceSnapshots: store.sourceSnapshotsById,
    evidenceFragments: store.evidenceFragmentsById,
    claimVersions: store.claimVersionsById,
    conflicts: store.claimConflictsById,
    publishedBundles: existingBundles,
  });
  const compileEnd = performance.now();

  const bundle = compiled.bundle;

  // Measure bundle load + parse from immutable snapshot artifact
  const loadSamples: number[] = [];
  let rawBytes = 0;
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    const artifact = readImmutableArtifact(bundle.storageUri);
    if (!artifact) {
      throw new Error(`Artifact missing for ${bundle.storageUri}`);
    }
    rawBytes = Buffer.byteLength(artifact.content, "utf8");
    const parsed = JSON.parse(artifact.content) as DecisionIrBundle;
    if (parsed.bundleHash !== bundle.bundleHash) {
      throw new Error("Bundle hash mismatch on load");
    }
    loadSamples.push(performance.now() - t0);
  }
  loadSamples.sort((a, b) => a - b);

  // Measure cold evaluation latency (bypassCache = true, distinct inputs)
  clearSafeEvaluationCache();
  const coldSamples: number[] = [];
  const iterations = 60;
  for (let i = 0; i < iterations; i++) {
    const input = {
      date: "2026-07-15",
      arrivalTime: "08:00",
      allAboardTime: i % 2 === 0 ? "16:30" : "17:00",
      arrivalDock: i % 2 === 0 ? "CT" : "AJD",
      groupSize: (i % 5) + 1,
      maxSinglePassengerWeightLbs: 180 + (i % 90),
      youngestChildAgeYears: 10 + (i % 30),
      mobilityLevel: "mild_uneven_ice_ok",
      weatherCondition: "clear_vfr",
      requestedFormat:
        i % 3 === 0 ? "glacier_dogsled" : "standard_glacier_walk",
      maxBudgetPerPersonUsd: 450 + (i % 10) * 35,
    };
    const t0 = performance.now();
    evaluateDecisionIrBundle({
      bundle,
      input,
      mode: "compact",
      overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
      bypassCache: true,
    });
    coldSamples.push(performance.now() - t0);
  }
  coldSamples.sort((a, b) => a - b);

  // Measure warm evaluation latency (cache hit path)
  const warmInput = {
    date: "2026-07-15",
    arrivalTime: "08:00",
    allAboardTime: "16:30",
    arrivalDock: "CT",
    groupSize: 2,
    maxSinglePassengerWeightLbs: 195,
    youngestChildAgeYears: 14,
    mobilityLevel: "mild_uneven_ice_ok",
    weatherCondition: "clear_vfr",
    requestedFormat: "standard_glacier_walk",
    maxBudgetPerPersonUsd: 600,
  };
  evaluateDecisionIrBundle({
    bundle,
    input: warmInput,
    mode: "compact",
    overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
  });

  const warmSamples: number[] = [];
  for (let i = 0; i < 200; i++) {
    const t0 = performance.now();
    evaluateDecisionIrBundle({
      bundle,
      input: warmInput,
      mode: "compact",
      overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
    });
    warmSamples.push(performance.now() - t0);
  }
  warmSamples.sort((a, b) => a - b);

  // Measure 100-item batch evaluation throughput
  clearSafeEvaluationCache();
  const batchItems = Array.from({ length: 100 }, (_, idx) => ({
    requestId: `bench_${idx + 1}`,
    bundle,
    input: {
      date: "2026-07-15",
      arrivalTime: "08:00",
      allAboardTime: "16:30",
      arrivalDock: idx % 3 === 0 ? "AJD" : "CT",
      groupSize: (idx % 4) + 1,
      maxSinglePassengerWeightLbs: 185 + ((idx % 10) * 10),
      youngestChildAgeYears: 15,
      mobilityLevel: "mild_uneven_ice_ok",
      weatherCondition:
        idx % 7 === 0 ? "low_ifr_fog_hold" : "clear_vfr",
      requestedFormat: "standard_glacier_walk",
      maxBudgetPerPersonUsd: 550,
    },
    mode: "compact" as const,
  }));

  const batchStart = performance.now();
  evaluateDecisionIrBundleBatch({
    items: batchItems,
    overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
  });
  const batchTotalMs = performance.now() - batchStart;

  const memAfter = process.memoryUsage();
  const coldMean =
    coldSamples.reduce((acc, v) => acc + v, 0) / coldSamples.length;
  const warmMean =
    warmSamples.reduce((acc, v) => acc + v, 0) / warmSamples.length;
  const loadMean =
    loadSamples.reduce((acc, v) => acc + v, 0) / loadSamples.length;

  return {
    tier,
    engineId: spec.engineId,
    candidateCount: bundle.candidates.length,
    ruleCount: bundle.rules.length,
    bundleSizeBytes: rawBytes,
    bundleCompileMs: Number((compileEnd - compileStart).toFixed(3)),
    bundleLoadFromArtifactMs: Number(loadMean.toFixed(4)),
    coldEvalMeanMs: Number(coldMean.toFixed(4)),
    coldEvalP50Ms: percentile(coldSamples, 50),
    coldEvalP95Ms: percentile(coldSamples, 95),
    coldEvalP99Ms: percentile(coldSamples, 99),
    warmEvalMeanMs: Number(warmMean.toFixed(4)),
    warmEvalP50Ms: percentile(warmSamples, 50),
    warmEvalP95Ms: percentile(warmSamples, 95),
    warmEvalP99Ms: percentile(warmSamples, 99),
    batch100TotalMs: Number(batchTotalMs.toFixed(3)),
    batchThroughputEvalsPerSec: Math.round((100 / batchTotalMs) * 1000),
    heapUsedDeltaKb: Math.max(
      0,
      Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024),
    ),
    rssMb: Number((memAfter.rss / (1024 * 1024)).toFixed(2)),
  };
}

export function runDccMachineLayerBenchmarks(): BundleBenchmarkMetrics[] {
  const seed = buildJuneauAndHawaiiMachineSeed();
  const smallSpec = seed.juneauCompilationSpec; // 7 candidates, 10 rules
  const mediumSpec = buildScaledCompilationSpec(smallSpec, "Medium", 50, 40);
  const largeSpec = buildScaledCompilationSpec(smallSpec, "Large", 250, 100);

  return [
    benchmarkSingleBundle("Small", smallSpec),
    benchmarkSingleBundle("Medium", mediumSpec),
    benchmarkSingleBundle("Large", largeSpec),
  ];
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.includes("benchmark-machine-layer"))
) {
  const results = runDccMachineLayerBenchmarks();
  console.log(JSON.stringify({ benchmarkVersion: "0.1.0", results }, null, 2));
}
