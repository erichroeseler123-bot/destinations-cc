import fs from "fs";
import path from "path";
import { evaluateStaleness, loadEdgeRegistry, loadNodeRegistry, loadStalenessPolicy } from "@/lib/dcc/network/registry";

function main() {
  const nodes = loadNodeRegistry();
  const edges = loadEdgeRegistry();
  const policy = loadStalenessPolicy();
  const result = evaluateStaleness(nodes, edges, policy);

  const output = {
    version: nodes.version,
    generatedAt: new Date().toISOString(),
    review_count: result.reviewItems.length,
    errors_count: result.reviewItems.filter((item) => item.severity === "error").length,
    warnings_count: result.reviewItems.filter((item) => item.severity === "warning").length,
    items: result.reviewItems,
  };

  const outDir = path.join(process.cwd(), "data", "network", "exports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "review-queue.v1.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  console.log(
    JSON.stringify(
      {
        output: outFile,
        review_count: output.review_count,
        errors_count: output.errors_count,
        warnings_count: output.warnings_count,
      },
      null,
      2
    )
  );
}

main();
