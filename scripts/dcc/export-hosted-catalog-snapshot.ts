/**
 * Export DCC's canonical hosted catalog for a consumer such as Cruise Promenade.
 *
 * Usage:
 *   npx tsx scripts/dcc/export-hosted-catalog-snapshot.ts --write ../cruisepromenade/src/generated/dcc-hosted-catalog.snapshot.json
 *   npx tsx scripts/dcc/export-hosted-catalog-snapshot.ts --check ../cruisepromenade/src/generated/dcc-hosted-catalog.snapshot.json
 */
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import {
  DCC_CANONICAL_HOSTED_SAILINGS,
  getDccCanonicalHostedCatalogSnapshot,
  validateDccHostedCatalogIntegrity,
} from "../../lib/dcc/cruise/hostedCatalogRegistry";

const [mode, path] = process.argv.slice(2);
if (!["--write", "--check"].includes(mode) || !path || process.argv.length !== 4) {
  console.error("Usage: export-hosted-catalog-snapshot.ts (--write|--check) <consumer-json-path>");
  process.exit(2);
}

const integrity = validateDccHostedCatalogIntegrity();
if (!integrity.valid) {
  throw new Error(`DCC hosted catalog violates publication safeguards: ${JSON.stringify(integrity.violations)}`);
}

// The public API enriches each row with a derived communityId. CP's versioned
// consumer snapshot stores the canonical fields from the DCC registry.
const snapshot = {
  ...getDccCanonicalHostedCatalogSnapshot({ includeHeld: true }),
  hostedSailings: DCC_CANONICAL_HOSTED_SAILINGS,
};
const latestSourceCheck = snapshot.hostedSailings.reduce(
  (latest, sailing) => sailing.organizerSourceCheckedAt > latest ? sailing.organizerSourceCheckedAt : latest,
  "",
);
if (snapshot.generatedAt < latestSourceCheck) {
  throw new Error(`DCC snapshot generatedAt ${snapshot.generatedAt} predates source check ${latestSourceCheck}`);
}
for (const sailing of snapshot.hostedSailings) {
  if (sailing.announcedHostedProgramming?.includes("[object Object]")) {
    throw new Error(`Unrendered hosted programming on ${sailing.hostedSailingId}`);
  }
}

const serialized = JSON.stringify(snapshot, null, 2) + "\n";
async function main() {
  if (mode === "--write") {
    await writeFile(path, serialized, "utf8");
    console.log(`Wrote ${snapshot.snapshotId} (${snapshot.hostedSailings.length} sailings) to ${path}`);
  } else {
    const actual = JSON.parse(await readFile(path, "utf8")) as typeof snapshot;
    const expected = JSON.parse(serialized) as typeof snapshot;
    if (!isDeepStrictEqual(actual, expected)) {
      const actualById = new Map(actual.hostedSailings.map((s) => [s.hostedSailingId, s]));
      const mismatched = expected.hostedSailings
        .filter((s) => !isDeepStrictEqual(actualById.get(s.hostedSailingId), s))
        .map((s) => s.hostedSailingId);
      const missing = actual.hostedSailings
        .filter((s) => !expected.hostedSailings.some((canonical) => canonical.hostedSailingId === s.hostedSailingId))
        .map((s) => s.hostedSailingId);
      console.error(JSON.stringify({
        error: "Consumer snapshot differs from DCC",
        expectedSnapshotId: expected.snapshotId,
        consumerSnapshotId: actual.snapshotId,
        expectedGeneratedAt: expected.generatedAt,
        consumerGeneratedAt: actual.generatedAt,
        differingSailingIds: mismatched.slice(0, 20),
        extraConsumerSailingIds: missing.slice(0, 20),
        differentMetadataOrOtherEntities: mismatched.length === 0 && missing.length === 0,
      }, null, 2));
      process.exitCode = 1;
    } else {
      console.log(`Consumer snapshot matches ${snapshot.snapshotId} (${snapshot.hostedSailings.length} sailings)`);
    }
  }
}
void main();
