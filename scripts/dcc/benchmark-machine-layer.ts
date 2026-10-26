import { performance } from "node:perf_hooks";
import {
  canonicalJsonStringify,
  clearSafeEvaluationCache,
  compileDecisionEngineBundle,
  evaluateDecisionIrBundle,
  evaluateDecisionIrBundleBatch,
  getMachineStore,
  readImmutableArtifact,
  sha256Hex,
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

export interface LatencyDistributionMetrics {
  benchmarkCategory:
    | "1_uncached_evaluator_execution"
    | "2_cache_hit_retrieval"
    | "3_full_http_and_durable_storage_execution";
  sampleCount: number;
  distinctInputCount: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  notes: string;
}

export interface V02ThreePartBenchmarkReport {
  benchmarkSpec: "dcc-machine-benchmark/0.2";
  measuredAt: string;
  uncachedEvaluatorExecution: LatencyDistributionMetrics;
  cacheHitRetrieval: LatencyDistributionMetrics;
  fullHttpAndDurableStorageExecution: LatencyDistributionMetrics;
  tierBreakdowns: BundleBenchmarkMetrics[];
}

function buildVariedInputs(count: number): Array<Record<string, unknown>> {
  const docks = ["CT", "AJD", "FKL", "AS"];
  const mobilities = ["full_agility", "mild_uneven_ice_ok", "no_stairs_or_steep_ice", "wheelchair"];
  const formats = ["standard_glacier_walk", "double_glacier_landing", "glacier_dogsled", "technical_crampon_trek"];
  const weathers = ["clear_vfr", "marginal_ceiling_1200ft", "low_ifr_fog_hold"];

  return Array.from({ length: count }, (_, i) => ({
    date: `2026-07-${String((i % 28) + 1).padStart(2, "0")}`,
    arrivalTime: i % 2 === 0 ? "07:30" : "08:00",
    allAboardTime: i % 3 === 0 ? "16:00" : "17:30",
    arrivalDock: docks[i % docks.length],
    groupSize: (i % 6) + 1,
    maxSinglePassengerWeightLbs: 165 + ((i * 7) % 130),
    youngestChildAgeYears: 6 + (i % 25),
    mobilityLevel: mobilities[i % mobilities.length],
    weatherCondition: weathers[i % weathers.length],
    requestedFormat: formats[i % formats.length],
    maxBudgetPerPersonUsd: 400 + (i % 15) * 25,
  }));
}

export async function runDccV02ThreePartBenchmarks(options?: {
  httpEvaluateHandler?: (req: Request) => Promise<Response>;
  durableRoundTripFn?: (payload: string, idx: number) => Promise<void>;
}): Promise<V02ThreePartBenchmarkReport> {
  const store = getMachineStore();
  const bundle = store.bundlesByKey.get("juneau-helicopter-tours@1.0.0")!;
  const varied50 = buildVariedInputs(50);

  // 1. Uncached evaluator execution across 50 distinct varied inputs
  clearSafeEvaluationCache();
  const uncachedSamples: number[] = [];
  for (let i = 0; i < varied50.length; i++) {
    const t0 = performance.now();
    evaluateDecisionIrBundle({
      bundle,
      input: varied50[i],
      mode: "expanded",
      overrides: {
        nowIso: "2026-04-12T12:00:00.000Z",
        validAt: "2026-07-15T12:00:00.000Z",
        knownAt: "2026-04-12T12:00:00.000Z",
      },
      bypassCache: true,
    });
    uncachedSamples.push(performance.now() - t0);
  }
  uncachedSamples.sort((a, b) => a - b);

  // 2. Cache-hit retrieval across the same 50 distinct varied inputs (no single repeated input!)
  clearSafeEvaluationCache();
  // Prime cache with all 50 distinct varied inputs
  for (let i = 0; i < varied50.length; i++) {
    evaluateDecisionIrBundle({
      bundle,
      input: varied50[i],
      mode: "compact",
      overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
      bypassCache: false,
    });
  }
  const cacheHitSamples: number[] = [];
  for (let i = 0; i < varied50.length; i++) {
    const t0 = performance.now();
    evaluateDecisionIrBundle({
      bundle,
      input: varied50[i],
      mode: "compact",
      overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
      bypassCache: false,
    });
    cacheHitSamples.push(performance.now() - t0);
  }
  cacheHitSamples.sort((a, b) => a - b);

  // 3. Full HTTP + durable-storage execution across 25 distinct varied inputs
  const varied25 = varied50.slice(0, 25);
  const httpSamples: number[] = [];
  const { POST: postEvaluateRoute } = await import("@/app/api/v1/evaluate/route");
  const { setDccMachineV1RuntimeOverride, writeImmutableArtifact } = await import(
    "@/lib/dcc/machine"
  );
  setDccMachineV1RuntimeOverride(true);
  const handler = options?.httpEvaluateHandler ?? postEvaluateRoute;

  for (let i = 0; i < varied25.length; i++) {
    const reqBody = JSON.stringify({
      engineId: "juneau-helicopter-tours",
      engineVersion: "1.0.0",
      mode: "expanded",
      validAt: "2026-07-15T12:00:00.000Z",
      knownAt: "2026-04-12T12:00:00.000Z",
      inputs: varied25[i],
    });
    const t0 = performance.now();
    const req = new Request("https://www.destinationcommandcenter.com/api/v1/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": `198.51.100.${(i % 200) + 1}`,
      },
      body: reqBody,
    });
    const res = await handler(req);
    const bodyText = await res.text();
    if (options?.durableRoundTripFn) {
      await options.durableRoundTripFn(bodyText, i);
    } else {
      const parsedBody = JSON.parse(bodyText) as { receipt?: unknown; receiptId?: string };
      const receiptContent = canonicalJsonStringify(parsedBody.receipt ?? parsedBody);
      const rcptHash = sha256Hex(receiptContent).slice(0, 16);
      const saved = writeImmutableArtifact({
        category: "receipts",
        filename: `bench_receipt_${i + 1}__${rcptHash}.json`,
        content: receiptContent,
      });
      readImmutableArtifact(saved.storageUri, saved.sha256);
    }
    httpSamples.push(performance.now() - t0);
  }
  httpSamples.sort((a, b) => a - b);

  const avg = (arr: number[]) =>
    Number((arr.reduce((acc, v) => acc + v, 0) / arr.length).toFixed(4));

  return {
    benchmarkSpec: "dcc-machine-benchmark/0.2",
    measuredAt: new Date().toISOString(),
    uncachedEvaluatorExecution: {
      benchmarkCategory: "1_uncached_evaluator_execution",
      sampleCount: uncachedSamples.length,
      distinctInputCount: varied50.length,
      meanMs: avg(uncachedSamples),
      p50Ms: percentile(uncachedSamples, 50),
      p95Ms: percentile(uncachedSamples, 95),
      p99Ms: percentile(uncachedSamples, 99),
      notes:
        "Cold deterministic IR evaluation + Ed25519 receipt signing across 50 distinct varied inputs (bypassCache=true).",
    },
    cacheHitRetrieval: {
      benchmarkCategory: "2_cache_hit_retrieval",
      sampleCount: cacheHitSamples.length,
      distinctInputCount: varied50.length,
      meanMs: avg(cacheHitSamples),
      p50Ms: percentile(cacheHitSamples, 50),
      p95Ms: percentile(cacheHitSamples, 95),
      p99Ms: percentile(cacheHitSamples, 99),
      notes:
        "Warm cache-hit retrieval across 50 distinct varied pre-warmed inputs (each generating a fresh evaluationRunId and traceRunId).",
    },
    fullHttpAndDurableStorageExecution: {
      benchmarkCategory: "3_full_http_and_durable_storage_execution",
      sampleCount: httpSamples.length,
      distinctInputCount: varied25.length,
      meanMs: avg(httpSamples),
      p50Ms: percentile(httpSamples, 50),
      p95Ms: percentile(httpSamples, 95),
      p99Ms: percentile(httpSamples, 99),
      notes: options?.durableRoundTripFn
        ? "Full HTTP POST /api/v1/evaluate + Neon Postgres durable storage round-trip across 25 distinct varied inputs."
        : "Full HTTP POST /api/v1/evaluate + immutable artifact storage persistence across 25 distinct varied inputs.",
    },
    tierBreakdowns: runDccMachineLayerBenchmarks(),
  };
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.includes("benchmark-machine-layer"))
) {
  runDccV02ThreePartBenchmarks().then((report) => {
    console.log(JSON.stringify(report, null, 2));
  });
}
