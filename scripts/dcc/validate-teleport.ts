import { teleportQuery } from "../../lib/dcc/graph/teleport";

const results = teleportQuery({ limit: 10 });

if (!results.length) {
  console.error("Teleport validation failed: no ranked results from place-action index.");
  process.exit(1);
}

const actionBacked = results.filter((row) =>
  Object.values(row.action_counts).some((count) => Number(count) > 0),
);

if (!actionBacked.length) {
  console.error("Teleport validation failed: top results contain no action-backed places.");
  process.exit(1);
}

for (let i = 1; i < results.length; i += 1) {
  const previous = results[i - 1];
  const current = results[i];
  if (current.score > previous.score) {
    console.error(`Teleport validation failed: unstable ranking at ${previous.place_id} -> ${current.place_id}.`);
    process.exit(1);
  }
  if (current.score === previous.score && current.place_id.localeCompare(previous.place_id) < 0) {
    console.error(`Teleport validation failed: tie-break order is not deterministic for ${previous.place_id} and ${current.place_id}.`);
    process.exit(1);
  }
}

console.log(`Teleport validation passed: ${results.length} ranked places; ${actionBacked.length} action-backed.`);
