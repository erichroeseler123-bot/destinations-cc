import fs from "fs";
import path from "path";
import {
  loadSatelliteContract,
  loadSurfaceExport,
  validateSatelliteContractAgainstSurfaceExport,
} from "@/lib/dcc/network/registry";

function countBy(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const value of values) out[value] = (out[value] ?? 0) + 1;
  return out;
}

function main() {
  const contractFile = process.argv[2];
  if (!contractFile) {
    console.error("Usage: tsx scripts/dcc/export-satellite.ts <contract-file>");
    process.exit(1);
  }

  const contract = loadSatelliteContract(contractFile);
  const exports = contract.allowed_surfaces.map((surface) => loadSurfaceExport(surface));

  const result = {
    version: contract.version,
    satellite_id: contract.satellite_id,
    generatedAt: new Date().toISOString(),
    bundles: [] as Array<{
      surface: string;
      node_count: number;
      edge_count: number;
      node_ids: string[];
      edge_ids: string[];
      node_type_counts: Record<string, number>;
      min_confidence: number;
      warnings: string[];
    }>,
  };

  const allErrors: string[] = [];

  for (const surfaceExport of exports) {
    const report = validateSatelliteContractAgainstSurfaceExport(contract, surfaceExport);
    allErrors.push(...report.errors);
    if (report.errors.length === 0) {
      result.bundles.push({
        surface: surfaceExport.surface,
        node_count: surfaceExport.nodes.length,
        edge_count: surfaceExport.edges.length,
        node_ids: surfaceExport.nodes.map((n) => n.node_id),
        edge_ids: surfaceExport.edges.map((e) => e.edge_id),
        node_type_counts: countBy(surfaceExport.nodes.map((n) => n.node_type)),
        min_confidence:
          surfaceExport.nodes.length > 0
            ? Math.min(...surfaceExport.nodes.map((n) => n.confidence))
            : 0,
        warnings: report.warnings,
      });
    }
  }

  if (allErrors.length > 0) {
    console.error(JSON.stringify({ satellite_id: contract.satellite_id, errors: allErrors }, null, 2));
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), "data", "network", "exports", "satellites");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${contract.satellite_id}.bundle.v1.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));

  console.log(
    JSON.stringify(
      {
        satellite_id: contract.satellite_id,
        output: outFile,
        surfaces: result.bundles.map((b) => b.surface),
      },
      null,
      2
    )
  );
}

main();
