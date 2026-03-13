import fs from "fs";
import path from "path";
import {
  evaluateStaleness,
  loadEdgeRegistry,
  loadNodeRegistry,
  loadStalenessPolicy,
  loadSurfaceManifest,
} from "@/lib/dcc/network/registry";

type Surface = "authority" | "discovery" | "monetized";

function isEligible(node: ReturnType<typeof loadNodeRegistry>["nodes"][number], manifest: ReturnType<typeof loadSurfaceManifest>) {
  const rule = manifest.node_types[node.node_type];
  if (!rule) return false;
  if (node.confidence < rule.min_confidence) return false;
  if (!rule.allowed_provenance.includes(node.provenance)) return false;
  if (rule.disallowed_statuses.includes(node.status)) return false;
  if (rule.require_monetized_target && node.monetized_targets.length === 0) return false;
  for (const field of rule.required_fields) {
    if (!(field in node)) return false;
  }
  return true;
}

function main() {
  const argSurface = process.argv[2] as Surface | undefined;
  if (!argSurface || !["authority", "discovery", "monetized"].includes(argSurface)) {
    console.error("Usage: tsx scripts/dcc/export-surface.ts <authority|discovery|monetized>");
    process.exit(1);
  }

  const nodesRegistry = loadNodeRegistry();
  const edgesRegistry = loadEdgeRegistry();
  const stalenessPolicy = loadStalenessPolicy();
  const manifest = loadSurfaceManifest(argSurface);
  const staleness = evaluateStaleness(nodesRegistry, edgesRegistry, stalenessPolicy);
  const monetizedBlockedNodes = new Set(
    staleness.reviewItems
      .filter((item) => item.reason === "stale_monetized_node")
      .map((item) => item.entity_id)
  );
  const monetizedBlockedEdges = new Set(
    staleness.reviewItems
      .filter((item) => item.reason === "stale_monetized_edge")
      .map((item) => item.entity_id)
  );

  const nodes = nodesRegistry.nodes.filter((node) => {
    if (!isEligible(node, manifest)) return false;
    if (argSurface === "monetized" && monetizedBlockedNodes.has(node.node_id)) return false;
    return true;
  });
  const nodeIds = new Set(nodes.map((node) => node.node_id));
  const edges = edgesRegistry.edges.filter((edge) => {
    if (!(nodeIds.has(edge.from_node) && nodeIds.has(edge.to_node))) return false;
    if (argSurface === "monetized" && monetizedBlockedEdges.has(edge.edge_id)) return false;
    return true;
  });

  const output = {
    version: nodesRegistry.version,
    surface: argSurface,
    generatedAt: new Date().toISOString(),
    node_count: nodes.length,
    edge_count: edges.length,
    staleness_filtered_nodes:
      argSurface === "monetized"
        ? [...monetizedBlockedNodes].filter((id) => !nodeIds.has(id)).length
        : 0,
    staleness_filtered_edges:
      argSurface === "monetized"
        ? [...monetizedBlockedEdges].filter((id) => !edges.find((e) => e.edge_id === id)).length
        : 0,
    nodes,
    edges,
  };

  const outDir = path.join(process.cwd(), "data", "network", "exports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${argSurface}.export.v1.json`);
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  console.log(
    JSON.stringify(
      {
        surface: argSurface,
        output: outFile,
        node_count: nodes.length,
        edge_count: edges.length,
      },
      null,
      2
    )
  );
}

main();
