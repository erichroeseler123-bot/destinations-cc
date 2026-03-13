import fs from "fs";
import path from "path";
import {
  loadSatelliteContract,
  loadSurfaceExport,
  validateSatelliteContractAgainstSurfaceExport,
} from "@/lib/dcc/network/registry";

function main() {
  const contractsDir = path.join(process.cwd(), "data", "network", "contracts");
  const contractFiles = fs
    .readdirSync(contractsDir)
    .filter((file) => file.endsWith(".contract.v1.json"))
    .sort();

  const summaries: Array<{
    contract: string;
    surface: string;
    ok: boolean;
    errors: number;
    warnings: number;
    infos: number;
  }> = [];

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const file of contractFiles) {
    const contract = loadSatelliteContract(file);
    for (const surface of contract.allowed_surfaces) {
      const exportDoc = loadSurfaceExport(surface);
      const report = validateSatelliteContractAgainstSurfaceExport(contract, exportDoc);
      summaries.push({
        contract: contract.satellite_id,
        surface,
        ok: report.ok,
        errors: report.errors.length,
        warnings: report.warnings.length,
        infos: report.infos.length,
      });
      allErrors.push(...report.errors);
      allWarnings.push(...report.warnings);
    }
  }

  const output = {
    contracts_count: contractFiles.length,
    evaluations_count: summaries.length,
    ok: allErrors.length === 0,
    errors_count: allErrors.length,
    warnings_count: allWarnings.length,
    summaries,
    errors: allErrors,
    warnings: allWarnings,
  };

  if (allErrors.length > 0) {
    console.error(JSON.stringify(output, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(output, null, 2));
}

main();
