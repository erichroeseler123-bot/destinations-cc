import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { SatelliteEventPayloadSchema } from "@/lib/dcc/satelliteHandoffs";

const ROOT = process.cwd();
const TARGET_FILES = [
  path.join(ROOT, "tests", "dcc", "10-satellite-handoff-events.test.ts"),
];

type Finding = {
  code: string;
  message: string;
};

function sampleForProperty(name: string): unknown {
  switch (name) {
    case "handoffId":
      return "fixture-handoff-123";
    case "satelliteId":
      return "welcome-to-alaska";
    case "eventType":
      return "handoff_viewed";
    case "source":
      return "fixture";
    case "sourcePath":
      return "/handoff/dcc";
    case "status":
      return "received";
    case "stage":
      return "landing";
    case "externalReference":
      return "fixture-ext-1";
    case "occurredAt":
      return new Date().toISOString();
    default:
      return "fixture-value";
  }
}

function objectLiteralToSample(node: ts.ObjectLiteralExpression): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const property of node.properties) {
    if (ts.isShorthandPropertyAssignment(property)) {
      const name = property.name.getText().replace(/^['"]|['"]$/g, "");
      out[name] = sampleForProperty(name);
      continue;
    }

    if (!ts.isPropertyAssignment(property)) continue;
    const name = property.name.getText().replace(/^['"]|['"]$/g, "");
    const initializer = property.initializer;

    if (ts.isObjectLiteralExpression(initializer)) {
      out[name] = objectLiteralToSample(initializer);
      continue;
    }

    if (ts.isArrayLiteralExpression(initializer)) {
      out[name] = initializer.elements.map((element) => {
        if (ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element)) return element.text;
        if (ts.isNumericLiteral(element)) return Number(element.text);
        return "fixture-item";
      });
      continue;
    }

    if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
      out[name] = initializer.text;
      continue;
    }

    if (ts.isNumericLiteral(initializer)) {
      out[name] = Number(initializer.text);
      continue;
    }

    if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
      out[name] = true;
      continue;
    }

    if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
      out[name] = false;
      continue;
    }

    out[name] = sampleForProperty(name);
  }

  return out;
}

function main() {
  const findings: Finding[] = [];

  for (const filePath of TARGET_FILES) {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "appendSatelliteEvent") {
        const firstArg = node.arguments[0];
        if (!firstArg || !ts.isObjectLiteralExpression(firstArg)) {
          findings.push({
            code: "fixtures.non_literal_event_payload",
            message: `${path.relative(ROOT, filePath)} contains appendSatelliteEvent call without an inline object literal; validator cannot prove fixture shape.`,
          });
        } else {
          const sample = objectLiteralToSample(firstArg);
          const parsed = SatelliteEventPayloadSchema.safeParse(sample);
          if (!parsed.success) {
            findings.push({
              code: "fixtures.invalid_satellite_event",
              message: `${path.relative(ROOT, filePath)} has appendSatelliteEvent fixture that does not satisfy SatelliteEventPayloadSchema: ${parsed.error.issues.map((issue) => issue.path.join(".") || "<root>").join(", ")}.`,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  const summary = {
    ok: findings.length === 0,
    files: TARGET_FILES.map((filePath) => path.relative(ROOT, filePath)),
    findings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (findings.length > 0) process.exit(1);
}

main();
