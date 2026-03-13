import fs from "fs";
import path from "path";
import {
  evaluateStaleness,
  loadNodeRegistry,
  loadSatelliteContract,
  loadStalenessPolicy,
  loadSurfaceManifest,
  loadSurfacePolicy,
} from "@/lib/dcc/network/registry";

type Mode = "surface" | "satellite";
type Surface = "authority" | "discovery" | "monetized";

type DiffResult = {
  target: string;
  mode: Mode;
  generatedAt: string;
  previousSnapshotFound: boolean;
  nodes: {
    current: number;
    previous: number;
    added: string[];
    removed: string[];
  };
  edges: {
    current: number;
    previous: number;
    added: string[];
    removed: string[];
  };
  removal_reasons: Record<string, string[]>;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function toSet(values: string[]): Set<string> {
  return new Set(values);
}

function diffIds(current: Set<string>, previous: Set<string>) {
  const added = [...current].filter((id) => !previous.has(id)).sort();
  const removed = [...previous].filter((id) => !current.has(id)).sort();
  return { added, removed };
}

function loadCurrentForSurface(surface: Surface) {
  const file = path.join(process.cwd(), "data", "network", "exports", `${surface}.export.v1.json`);
  const doc = readJson<{ nodes: Array<{ node_id: string }>; edges: Array<{ edge_id: string }> }>(file);
  return {
    file,
    nodeIds: doc.nodes.map((n) => n.node_id),
    edgeIds: doc.edges.map((e) => e.edge_id),
  };
}

function loadCurrentForSatellite(satelliteId: string) {
  const file = path.join(process.cwd(), "data", "network", "exports", "satellites", `${satelliteId}.bundle.v1.json`);
  const doc = readJson<{
    bundles: Array<{ surface: string; node_ids?: string[]; edge_ids?: string[]; node_count: number; edge_count: number }>;
  }>(file);
  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  for (const bundle of doc.bundles) {
    for (const id of bundle.node_ids ?? []) nodeIds.push(`${bundle.surface}:${id}`);
    for (const id of bundle.edge_ids ?? []) edgeIds.push(`${bundle.surface}:${id}`);
  }
  return { file, nodeIds, edgeIds };
}

function reasonForSurfaceRemoval(surface: Surface, nodeId: string): string[] {
  const reasons: string[] = [];
  const nodes = loadNodeRegistry();
  const manifest = loadSurfaceManifest(surface);
  const surfacePolicy = loadSurfacePolicy();
  const node = nodes.nodes.find((n) => n.node_id === nodeId);
  if (!node) return ["node_no_longer_exists"];

  const rule = manifest.node_types[node.node_type];
  if (!rule) reasons.push("node_type_not_in_manifest");
  else {
    if (node.confidence < rule.min_confidence) reasons.push("below_manifest_confidence");
    if (!rule.allowed_provenance.includes(node.provenance)) reasons.push("provenance_not_allowed");
    if (rule.disallowed_statuses.includes(node.status)) reasons.push("status_disallowed");
    if (rule.require_monetized_target && node.monetized_targets.length === 0) {
      reasons.push("missing_monetized_target");
    }
  }

  if (!surfacePolicy.surfaces[surface].includes(node.node_type)) {
    reasons.push("surface_policy_type_disallowed");
  }

  if (surface === "monetized") {
    const staleness = evaluateStaleness(nodes, readJson(path.join(process.cwd(), "data", "network", "edges.v1.json")), loadStalenessPolicy());
    if (staleness.reviewItems.some((item) => item.entity_type === "node" && item.entity_id === nodeId && item.reason === "stale_monetized_node")) {
      reasons.push("blocked_by_staleness_policy");
    }
  }

  return reasons.length > 0 ? reasons : ["policy_or_data_change"];
}

function reasonForSatelliteRemoval(satelliteId: string, compositeNodeId: string): string[] {
  const [surfaceRaw, nodeId] = compositeNodeId.split(":dcc:node:");
  if (!nodeId) return ["unknown_format"];
  const surface = surfaceRaw as Surface;
  const contract = loadSatelliteContract(`${satelliteId}.contract.v1.json`);
  const reasons: string[] = [];
  if (!contract.allowed_surfaces.includes(surface)) reasons.push("surface_not_allowed_by_contract");

  const rule = contract.surfaces.find((s) => s.surface === surface);
  const nodes = loadNodeRegistry();
  const node = nodes.nodes.find((n) => n.node_id === `dcc:node:${nodeId}`);
  if (!node) return ["node_no_longer_exists"];
  if (!rule) return ["missing_contract_surface_rule"];
  if (!rule.allowed_node_types.includes(node.node_type)) reasons.push("node_type_disallowed_by_contract");
  if (node.confidence < rule.min_confidence) reasons.push("below_contract_confidence");
  if (!rule.allowed_provenance.includes(node.provenance)) reasons.push("provenance_disallowed_by_contract");
  if (rule.excluded_statuses.includes(node.status)) reasons.push("status_excluded_by_contract");

  return reasons.length > 0 ? reasons : ["surface_export_changed"];
}

function main() {
  const mode = process.argv[2] as Mode | undefined;
  const target = process.argv[3];

  if (!mode || !target || !["surface", "satellite"].includes(mode)) {
    console.error("Usage: tsx scripts/dcc/export-diff.ts <surface|satellite> <target>");
    process.exit(1);
  }

  const current = mode === "surface" ? loadCurrentForSurface(target as Surface) : loadCurrentForSatellite(target);
  const auditDir = path.join(process.cwd(), "data", "network", "audit", mode, target);
  fs.mkdirSync(auditDir, { recursive: true });
  const latestSnapshot = path.join(auditDir, "latest.snapshot.json");
  const hasPrevious = fs.existsSync(latestSnapshot);
  const previous = hasPrevious
    ? readJson<{ nodeIds: string[]; edgeIds: string[] }>(latestSnapshot)
    : { nodeIds: [], edgeIds: [] };

  const currentNodes = toSet(current.nodeIds);
  const previousNodes = toSet(previous.nodeIds);
  const currentEdges = toSet(current.edgeIds);
  const previousEdges = toSet(previous.edgeIds);
  const nodeDiff = diffIds(currentNodes, previousNodes);
  const edgeDiff = diffIds(currentEdges, previousEdges);

  const removalReasons: Record<string, string[]> = {};
  for (const nodeId of nodeDiff.removed) {
    removalReasons[nodeId] =
      mode === "surface"
        ? reasonForSurfaceRemoval(target as Surface, nodeId)
        : reasonForSatelliteRemoval(target, nodeId);
  }

  const report: DiffResult = {
    target,
    mode,
    generatedAt: new Date().toISOString(),
    previousSnapshotFound: hasPrevious,
    nodes: {
      current: currentNodes.size,
      previous: previousNodes.size,
      added: nodeDiff.added,
      removed: nodeDiff.removed,
    },
    edges: {
      current: currentEdges.size,
      previous: previousEdges.size,
      added: edgeDiff.added,
      removed: edgeDiff.removed,
    },
    removal_reasons: removalReasons,
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportFile = path.join(auditDir, `${stamp}.report.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  fs.writeFileSync(
    latestSnapshot,
    JSON.stringify({ generatedAt: report.generatedAt, nodeIds: [...currentNodes], edgeIds: [...currentEdges] }, null, 2)
  );

  console.log(
    JSON.stringify(
      {
        mode,
        target,
        report: reportFile,
        previous_snapshot_found: hasPrevious,
        node_added: report.nodes.added.length,
        node_removed: report.nodes.removed.length,
        edge_added: report.edges.added.length,
        edge_removed: report.edges.removed.length,
      },
      null,
      2
    )
  );
}

main();
