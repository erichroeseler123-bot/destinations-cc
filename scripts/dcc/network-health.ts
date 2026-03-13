import fs from "fs";
import path from "path";
import {
  evaluateStaleness,
  loadEdgeRegistry,
  loadNodeRegistry,
  loadPromotionPolicy,
  loadSatelliteContract,
  loadStalenessPolicy,
  loadSurfaceExport,
  loadSurfacePolicy,
} from "@/lib/dcc/network/registry";
import type { DccNode, DccPromotionPolicy, DccSurfaceName, DccSurfacePolicy } from "@/lib/dcc/network/schema";

type SatelliteContractFile =
  | "partyatredrocks.contract.v1.json"
  | "welcome-to-alaska.contract.v1.json"
  | "gosno.contract.v1.json";

const SURFACES: DccSurfaceName[] = ["authority", "discovery", "monetized"];
const CONTRACT_FILES: SatelliteContractFile[] = [
  "partyatredrocks.contract.v1.json",
  "welcome-to-alaska.contract.v1.json",
  "gosno.contract.v1.json",
];

function countBy<T extends string>(items: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) out[item] = (out[item] ?? 0) + 1;
  return out;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function latestAuditCounts(mode: "surface" | "satellite", target: string) {
  const dir = path.join(process.cwd(), "data", "network", "audit", mode, target);
  if (!fs.existsSync(dir)) {
    return { found: false, node_added: 0, node_removed: 0, edge_added: 0, edge_removed: 0, report: "" };
  }
  const reports = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".report.json"))
    .sort();
  if (reports.length === 0) {
    return { found: false, node_added: 0, node_removed: 0, edge_added: 0, edge_removed: 0, report: "" };
  }
  const latest = reports[reports.length - 1];
  const latestPath = path.join(dir, latest);
  const doc = JSON.parse(fs.readFileSync(latestPath, "utf-8")) as {
    nodes: { added: string[]; removed: string[] };
    edges: { added: string[]; removed: string[] };
  };
  return {
    found: true,
    node_added: doc.nodes.added.length,
    node_removed: doc.nodes.removed.length,
    edge_added: doc.edges.added.length,
    edge_removed: doc.edges.removed.length,
    report: latestPath,
  };
}

function passesPromotion(node: DccNode, rule: DccPromotionPolicy["surfaces"]["authority"]) {
  if (node.confidence < rule.min_confidence) return false;
  if (!rule.allowed_provenance.includes(node.provenance)) return false;
  if (!rule.required_status.includes(node.status)) return false;
  if (node.related_nodes.length < rule.require_related_nodes_min) return false;
  if (rule.require_monetized_target && node.monetized_targets.length === 0) return false;
  return true;
}

function evaluateContractNode(node: DccNode, contractRule: {
  min_confidence: number;
  allowed_node_types: string[];
  required_fields: string[];
  allowed_provenance: string[];
  excluded_statuses: string[];
}) {
  if (!contractRule.allowed_node_types.includes(node.node_type)) return false;
  if (node.confidence < contractRule.min_confidence) return false;
  if (!contractRule.allowed_provenance.includes(node.provenance)) return false;
  if (contractRule.excluded_statuses.includes(node.status)) return false;
  for (const field of contractRule.required_fields) {
    if (!(field in node)) return false;
  }
  return true;
}

function buildSurfaceHealth(nodes: DccNode[], surfacePolicy: DccSurfacePolicy, promotionPolicy: DccPromotionPolicy) {
  const result: Record<string, unknown> = {};
  for (const surface of SURFACES) {
    const allowedTypes = new Set(surfacePolicy.surfaces[surface]);
    const rule = promotionPolicy.surfaces[surface];
    const candidates = nodes.filter((node) => allowedTypes.has(node.node_type));
    const promoted = candidates.filter((node) => passesPromotion(node, rule));
    const blocked = candidates.length - promoted.length;
    const audit = latestAuditCounts("surface", surface);

    result[surface] = {
      candidate_nodes: candidates.length,
      promoted_nodes: promoted.length,
      blocked_by_policy: blocked,
      promoted_by_type: countBy(promoted.map((node) => node.node_type)),
      blocked_by_type: countBy(candidates.filter((node) => !passesPromotion(node, rule)).map((node) => node.node_type)),
      changes_since_last_export: audit,
    };
  }
  return result;
}

function buildSatelliteHealth(nodesById: Map<string, DccNode>) {
  const satellites: Record<string, unknown> = {};
  for (const contractFile of CONTRACT_FILES) {
    const contract = loadSatelliteContract(contractFile);
    const perSurface: Record<string, unknown> = {};
    let eligible = 0;
    let rejected = 0;

    for (const surface of contract.allowed_surfaces) {
      const exportDoc = loadSurfaceExport(surface);
      const rule = contract.surfaces.find((r) => r.surface === surface);
      if (!rule) continue;
      const nodeIds = exportDoc.nodes.map((n) => n.node_id);
      let surfaceEligible = 0;
      let surfaceRejected = 0;
      for (const nodeId of nodeIds) {
        const node = nodesById.get(nodeId);
        if (!node) continue;
        if (evaluateContractNode(node, rule)) surfaceEligible += 1;
        else surfaceRejected += 1;
      }

      eligible += surfaceEligible;
      rejected += surfaceRejected;
      perSurface[surface] = {
        eligible_nodes: surfaceEligible,
        rejected_nodes: surfaceRejected,
      };
    }

    satellites[contract.satellite_id] = {
      eligible_nodes: eligible,
      rejected_nodes: rejected,
      by_surface: perSurface,
      changes_since_last_export: latestAuditCounts("satellite", contract.satellite_id),
    };
  }
  return satellites;
}

function main() {
  const nodesRegistry = loadNodeRegistry();
  const edgesRegistry = loadEdgeRegistry();
  const stalenessPolicy = loadStalenessPolicy();
  const surfacePolicy = loadSurfacePolicy();
  const promotionPolicy = loadPromotionPolicy();
  const staleness = evaluateStaleness(nodesRegistry, edgesRegistry, stalenessPolicy);
  const nodesById = new Map(nodesRegistry.nodes.map((n) => [n.node_id, n]));

  const graphHealth = {
    version: nodesRegistry.version,
    generatedAt: new Date().toISOString(),
    totals: {
      nodes: nodesRegistry.nodes.length,
      edges: edgesRegistry.edges.length,
    },
    stale_counts: {
      nodes: staleness.reviewItems.filter((item) => item.entity_type === "node" && item.reason.startsWith("stale")).length,
      edges: staleness.reviewItems.filter((item) => item.entity_type === "edge" && item.reason.startsWith("stale")).length,
      monetized_block_nodes: staleness.reviewItems.filter((item) => item.reason === "stale_monetized_node").length,
      monetized_block_edges: staleness.reviewItems.filter((item) => item.reason === "stale_monetized_edge").length,
    },
    review_queue_counts: {
      total: staleness.reviewItems.length,
      errors: staleness.reviewItems.filter((item) => item.severity === "error").length,
      warnings: staleness.reviewItems.filter((item) => item.severity === "warning").length,
    },
    counts_by_provenance: countBy(nodesRegistry.nodes.map((node) => node.provenance)),
    counts_by_owner_pipeline: countBy(nodesRegistry.nodes.map((node) => node.owner_pipeline)),
    edge_counts_by_owner_pipeline: countBy(edgesRegistry.edges.map((edge) => edge.owner_pipeline)),
  };

  const surfaceHealth = {
    version: nodesRegistry.version,
    generatedAt: new Date().toISOString(),
    surfaces: buildSurfaceHealth(nodesRegistry.nodes, surfacePolicy, promotionPolicy),
  };

  const satelliteHealth = {
    version: nodesRegistry.version,
    generatedAt: new Date().toISOString(),
    satellites: buildSatelliteHealth(nodesById),
  };

  const outDir = path.join(process.cwd(), "data", "network", "health");
  ensureDir(outDir);
  const graphPath = path.join(outDir, "graph-health.v1.json");
  const surfacePath = path.join(outDir, "surface-health.v1.json");
  const satellitePath = path.join(outDir, "satellite-health.v1.json");

  fs.writeFileSync(graphPath, JSON.stringify(graphHealth, null, 2));
  fs.writeFileSync(surfacePath, JSON.stringify(surfaceHealth, null, 2));
  fs.writeFileSync(satellitePath, JSON.stringify(satelliteHealth, null, 2));

  console.log(
    JSON.stringify(
      {
        graph_health: graphPath,
        surface_health: surfacePath,
        satellite_health: satellitePath,
      },
      null,
      2
    )
  );
}

main();
