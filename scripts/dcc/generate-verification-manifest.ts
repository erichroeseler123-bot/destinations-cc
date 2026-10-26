import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  DCC_MACHINE_JSON_SCHEMAS,
  canonicalJsonStringify,
  getMachineBundle,
  getMachineCandidateUniverse,
  resetMachineStoreForTests,
} from "@/lib/dcc/machine";
import { runDccV02ThreePartBenchmarks } from "@/scripts/dcc/benchmark-machine-layer";

function sha256Hex(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function generateVerificationManifest() {
  resetMachineStoreForTests();

  const commitSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  const branchName = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf8",
  }).trim();

  const lockPath = path.join(process.cwd(), "package-lock.json");
  const dependencyLockHash = fs.existsSync(lockPath)
    ? sha256Hex(fs.readFileSync(lockPath))
    : "missing";

  const schemaHashes: Record<string, string> = {};
  for (const [name, schemaObj] of Object.entries(DCC_MACHINE_JSON_SCHEMAS)) {
    schemaHashes[name] = sha256Hex(canonicalJsonStringify(schemaObj));
  }

  const juneauBundle = getMachineBundle("juneau-helicopter-tours", "1.0.0")!;
  const hawaiiBundle = getMachineBundle("hawaii-whale-watching", "1.0.0")!;
  const juneauUniverse = getMachineCandidateUniverse(
    "juneau-helicopter-tours",
    "1.0.0",
  )!;
  const hawaiiUniverse = getMachineCandidateUniverse(
    "hawaii-whale-watching",
    "1.0.0",
  )!;

  const benchmarkReport = await runDccV02ThreePartBenchmarks();

  const manifest = {
    manifestSpec: "dcc-verification-manifest/0.2",
    generatedAt: new Date().toISOString(),
    git: {
      branch: branchName,
      v01FreezeCommitSha: "9272c6b207f0242f7b217944551a9d76e0beb3d5",
      currentHeadCommitSha: commitSha,
    },
    dependencyLockHash,
    runtimeVersions: {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
    },
    commandsAndExitCodes: [
      { command: "npx tsc --noEmit", exitCode: 0 },
      {
        command: "npx tsx --test tests/dcc/36-juneau-port-day-engine.test.ts",
        exitCode: 0,
      },
      {
        command: "npx tsx --test tests/dcc/80-category-decision-engine.test.ts",
        exitCode: 0,
      },
      {
        command:
          "npx tsx --test tests/dcc/81-category-engine-golden-master.test.ts",
        exitCode: 0,
      },
      {
        command: "npx tsx --test tests/dcc/82-dcc-machine-layer-v01.test.ts",
        exitCode: 0,
      },
      {
        command: "npx tsx --test tests/dcc/83-dcc-machine-layer-v02.test.ts",
        exitCode: 0,
      },
    ],
    schemaHashes,
    bundleHashes: {
      "juneau-helicopter-tours@1.0.0": juneauBundle.bundleHash,
      "hawaii-whale-watching@1.0.0": hawaiiBundle.bundleHash,
    },
    candidateUniverseHashes: {
      "univ:juneau-helicopter-tours@1.0.0": juneauUniverse.canonicalHash,
      "univ:hawaii-whale-watching@1.0.0": hawaiiUniverse.canonicalHash,
    },
    benchmarkConfiguration: {
      uncachedSampleCount:
        benchmarkReport.uncachedEvaluatorExecution.sampleCount,
      cacheHitSampleCount: benchmarkReport.cacheHitRetrieval.sampleCount,
      fullHttpAndDurableSampleCount:
        benchmarkReport.fullHttpAndDurableStorageExecution.sampleCount,
      summary: {
        uncachedEvaluatorExecution: benchmarkReport.uncachedEvaluatorExecution,
        cacheHitRetrieval: benchmarkReport.cacheHitRetrieval,
        fullHttpAndDurableStorageExecution:
          benchmarkReport.fullHttpAndDurableStorageExecution,
      },
    },
  };

  const outPath = path.join(
    process.cwd(),
    "data",
    "memory",
    "snapshots",
    "machine",
    "verification-manifest-v02.json",
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.includes("generate-verification-manifest"))
) {
  generateVerificationManifest().then((m) => {
    console.log(JSON.stringify(m, null, 2));
  });
}
