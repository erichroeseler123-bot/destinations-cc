import fs from "fs";
import path from "path";

type Bundle = {
  version: string;
  satellite_id: string;
  generatedAt: string;
  bundles: Array<{
    surface: string;
    node_count: number;
    edge_count: number;
    node_type_counts?: Record<string, number>;
    warnings?: string[];
  }>;
};

type Thresholds = {
  version: string;
  updatedAt: string;
  satellites: Record<
    string,
    {
      surfaces: Record<
        string,
        {
          min_nodes: number;
          min_edges: number;
          required_node_types: Record<string, number>;
        }
      >;
    }
  >;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function latestAuditSummary(satelliteId: string) {
  const dir = path.join(process.cwd(), "data", "network", "audit", "satellite", satelliteId);
  if (!fs.existsSync(dir)) return null;
  const reports = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".report.json"))
    .sort();
  if (reports.length === 0) return null;
  const latestPath = path.join(dir, reports[reports.length - 1]);
  const doc = readJson<{
    nodes: { added: string[]; removed: string[] };
    edges: { added: string[]; removed: string[] };
  }>(latestPath);
  return {
    report: latestPath,
    node_added: doc.nodes.added.length,
    node_removed: doc.nodes.removed.length,
    edge_added: doc.edges.added.length,
    edge_removed: doc.edges.removed.length,
  };
}

function main() {
  const satelliteId = process.argv[2];
  if (!satelliteId) {
    console.error("Usage: tsx scripts/dcc/validate-satellite-bundle-health.ts <satellite-id>");
    process.exit(1);
  }

  const bundlePath = path.join(
    process.cwd(),
    "data",
    "network",
    "exports",
    "satellites",
    `${satelliteId}.bundle.v1.json`
  );
  const thresholdsPath = path.join(
    process.cwd(),
    "data",
    "network",
    "contracts",
    "satellite-ci-thresholds.v1.json"
  );

  if (!fs.existsSync(bundlePath)) {
    console.error(`Missing bundle file: ${bundlePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(thresholdsPath)) {
    console.error(`Missing threshold file: ${thresholdsPath}`);
    process.exit(1);
  }

  const bundle = readJson<Bundle>(bundlePath);
  const thresholds = readJson<Thresholds>(thresholdsPath);
  const satelliteThresholds = thresholds.satellites[satelliteId];
  if (!satelliteThresholds) {
    console.error(`No CI thresholds configured for satellite: ${satelliteId}`);
    process.exit(1);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const details: Array<{
    surface: string;
    node_count: number;
    edge_count: number;
    node_type_counts: Record<string, number>;
  }> = [];

  for (const [surface, rule] of Object.entries(satelliteThresholds.surfaces)) {
    const bundleSurface = bundle.bundles.find((entry) => entry.surface === surface);
    if (!bundleSurface) {
      errors.push(`Missing required surface in bundle: ${surface}`);
      continue;
    }

    const typeCounts = bundleSurface.node_type_counts ?? {};
    details.push({
      surface,
      node_count: bundleSurface.node_count,
      edge_count: bundleSurface.edge_count,
      node_type_counts: typeCounts,
    });

    if (bundleSurface.node_count < rule.min_nodes) {
      errors.push(
        `[${surface}] node_count ${bundleSurface.node_count} < min_nodes ${rule.min_nodes}`
      );
    }
    if (bundleSurface.edge_count < rule.min_edges) {
      errors.push(
        `[${surface}] edge_count ${bundleSurface.edge_count} < min_edges ${rule.min_edges}`
      );
    }

    for (const [nodeType, minCount] of Object.entries(rule.required_node_types)) {
      const count = typeCounts[nodeType] ?? 0;
      if (count < minCount) {
        errors.push(
          `[${surface}] required node type ${nodeType} count ${count} < ${minCount}`
        );
      }
    }

    for (const warn of bundleSurface.warnings ?? []) {
      warnings.push(`[${surface}] ${warn}`);
    }
  }

  const audit = latestAuditSummary(satelliteId);
  const output = {
    satellite_id: satelliteId,
    bundle_version: bundle.version,
    bundle_generated_at: bundle.generatedAt,
    ci_pass: errors.length === 0,
    errors_count: errors.length,
    warnings_count: warnings.length,
    details,
    latest_diff_summary: audit,
    errors,
    warnings,
  };

  if (errors.length > 0) {
    console.error(JSON.stringify(output, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(output, null, 2));
}

main();
