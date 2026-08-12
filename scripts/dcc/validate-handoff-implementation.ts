import fs from "fs";
import path from "path";

type Declared = { handoff_id: string };
type Implementation = { handoff_id: string; status: string; evidence?: string[] };

const root = process.cwd();
const declaredPath = path.join(root, "data", "network", "handoffs.v1.json");
const implementationPath = path.join(root, "data", "network", "handoff-implementation.v1.json");

const declared = JSON.parse(fs.readFileSync(declaredPath, "utf8")) as { handoffs: Declared[] };
const implementation = JSON.parse(fs.readFileSync(implementationPath, "utf8")) as { handoffs: Implementation[] };

const allowed = new Set(["declared_only", "context_handoff", "receiver_confirmed", "end_to_end_verified"]);
const declaredIds = new Set(declared.handoffs.map((row) => row.handoff_id));
const implementationIds = new Set(implementation.handoffs.map((row) => row.handoff_id));
const errors: string[] = [];

for (const row of implementation.handoffs) {
  if (!allowed.has(row.status)) errors.push(`Unknown implementation status for ${row.handoff_id}: ${row.status}`);
  if (!declaredIds.has(row.handoff_id)) errors.push(`Implementation ledger contains undeclared handoff: ${row.handoff_id}`);
  if (row.status !== "declared_only" && !(row.evidence?.length)) errors.push(`Implemented handoff lacks evidence: ${row.handoff_id}`);
}

for (const id of declaredIds) {
  if (!implementationIds.has(id)) errors.push(`Declared handoff missing implementation status: ${id}`);
}

const counts = implementation.handoffs.reduce<Record<string, number>>((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

if (errors.length) {
  console.error("Handoff implementation validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Handoff implementation ledger valid for ${declaredIds.size} declared lanes.`);
console.log(counts);
