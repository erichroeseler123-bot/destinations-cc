import { getGraphContextForPath } from "@/lib/dcc/graph/context";

type Finding = { severity: "error" | "info"; code: string; message: string };

const TOP5 = [
  "/cities/denver",
  "/ports/juneau",
  "/venues/red-rocks-amphitheatre",
  "/attractions/mendenhall-glacier",
  "/routes/denver-red-rocks",
];

const findings: Finding[] = [];

for (const path of TOP5) {
  const context = getGraphContextForPath(path);
  if (!context) {
    findings.push({ severity: "error", code: "graph.context_missing", message: `${path} has no graph context.` });
    continue;
  }

  const totals =
    context.nearbyNodes.length +
    context.relatedExperiences.length +
    context.routesFromHere.length +
    context.topThingsNearby.length +
    context.siblings.length +
    (context.parentHub ? 1 : 0);

  if (context.nearbyNodes.length < 2) {
    findings.push({ severity: "error", code: "graph.nearby_low", message: `${path} has fewer than 2 nearby nodes.` });
  }
  if (context.relatedExperiences.length < 2) {
    findings.push({ severity: "error", code: "graph.related_low", message: `${path} has fewer than 2 related experiences.` });
  }
  if (context.routesFromHere.length < 1) {
    findings.push({ severity: "error", code: "graph.routes_low", message: `${path} has no routes-from-here links.` });
  }
  if (totals < 8) {
    findings.push({ severity: "error", code: "graph.total_low", message: `${path} has weak graph density (${totals} links/signals).` });
  } else {
    findings.push({ severity: "info", code: "graph.context_ok", message: `${path} graph density ${totals}.` });
  }
}

const errors = findings.filter((f) => f.severity === "error");
const infos = findings.filter((f) => f.severity === "info");

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0,
      checked_paths: TOP5.length,
      errors_count: errors.length,
      infos_count: infos.length,
      errors,
      infos,
    },
    null,
    2
  )
);

if (errors.length) process.exit(1);
