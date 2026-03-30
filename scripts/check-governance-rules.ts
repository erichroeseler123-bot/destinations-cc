import fs from "node:fs";
import path from "node:path";
import { pageRegistry } from "@/data/page-registry";

const ROOT = process.cwd();
const SCAN_ROOTS = ["app", "components", "lib", "scripts", "data"];
const LINK_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".json"]);
const PUBLIC_SURFACE_SCAN = /(sitemap|nav|navbar|navigation)/i;
const PAYMENT_PATH = /(checkout|create-payment|create-intent|pay-balance|pay(?:\/|$))/i;
const EXECUTION_METRIC = /(checkout|booking|completion|purchase|revenue|paid|execution)/i;

type Finding = {
  code: string;
  message: string;
};

function walkFiles(dir: string, out: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "legacy_vault") continue;
      walkFiles(fullPath, out);
      continue;
    }
    if (LINK_FILE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }
}

function findReferences(target: string, predicate?: (filePath: string) => boolean) {
  const hits: string[] = [];
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    walkFiles(path.join(ROOT, root), files);
  }

  for (const filePath of files) {
    const relative = path.relative(ROOT, filePath);
    if (relative === "data/page-registry.ts" || relative === "data/cleanup-queue.ts") continue;
    if (predicate && !predicate(relative)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes(target)) hits.push(relative);
  }

  return hits;
}

function main() {
  const findings: Finding[] = [];

  for (const entry of pageRegistry) {
    if (entry.status === "review" && !entry.justification?.trim()) {
      findings.push({
        code: "governance.review_missing_justification",
        message: `${entry.path} is review but has no justification.`,
      });
    }

    if (entry.status === "redirect_pending" && !entry.handoffTarget) {
      findings.push({
        code: "governance.redirect_pending_missing_target",
        message: `${entry.path} is redirect_pending but has no handoffTarget.`,
      });
    }

    if (entry.status === "review" || entry.layer === "unclassified") {
      continue;
    }

    if (entry.layer === "ops" && entry.owner !== "internal") {
      findings.push({
        code: "governance.ops_owner_invalid",
        message: `${entry.path} is ops but is owned by ${entry.owner}; ops routes should stay under internal ownership.`,
      });
    }

    if (entry.owner === "internal" && entry.layer !== "ops") {
      findings.push({
        code: "governance.internal_non_ops",
        message: `${entry.path} is owned by internal but classified as ${entry.layer}.`,
      });
    }

    if (entry.layer === "understand" && entry.handoffTarget && PAYMENT_PATH.test(entry.handoffTarget)) {
      findings.push({
        code: "governance.understand_to_payment",
        message: `${entry.path} is understand but hands off directly to payment/execution target ${entry.handoffTarget}.`,
      });
    }

    if (entry.status !== "kill" && entry.layer === "act" && (!entry.successMetric || !EXECUTION_METRIC.test(entry.successMetric))) {
      findings.push({
        code: "governance.act_missing_execution_metric",
        message: `${entry.path} is act but lacks an execution-oriented success metric.`,
      });
    }

    if (entry.layer === "ops" && entry.surface !== null && entry.surface !== undefined) {
      findings.push({
        code: "governance.ops_surface_public",
        message: `${entry.path} is ops and must not declare a public surface.`,
      });
    }

    if (entry.surface === "authority" && (entry.owner !== "dcc" || entry.layer !== "understand")) {
      findings.push({
        code: "governance.authority_misclassified",
        message: `${entry.path} is marked authority but is not a DCC understand surface.`,
      });
    }

    if (entry.path.includes("/guide") && entry.status !== "kill" && !entry.justification?.trim()) {
      findings.push({
        code: "governance.guide_missing_reason",
        message: `${entry.path} is a guide route but does not state why it reduces pre-booking uncertainty.`,
      });
    }

    if (entry.status === "kill") {
      const refs = findReferences(entry.path, (filePath) => !filePath.startsWith("legacy_vault/"));
      if (refs.length > 0) {
        findings.push({
          code: "governance.kill_route_linked",
          message: `${entry.path} is marked kill but is still referenced by ${refs.slice(0, 5).join(", ")}${refs.length > 5 ? "..." : ""}.`,
        });
      }
    }

    if (entry.layer === "ops") {
      const refs = findReferences(entry.path, (filePath) => PUBLIC_SURFACE_SCAN.test(filePath));
      if (refs.length > 0) {
        findings.push({
          code: "governance.ops_exposed_publicly",
          message: `${entry.path} appears in public nav/sitemap files: ${refs.join(", ")}.`,
        });
      }
    }
  }

  const summary = {
    ok: findings.length === 0,
    entries: pageRegistry.length,
    findings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (findings.length > 0) process.exit(1);
}

main();
