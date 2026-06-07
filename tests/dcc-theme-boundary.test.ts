import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveNodeForRequest } from "@/lib/network/nodes";

const ROOT = process.cwd();

function read(pathname: string) {
  return readFileSync(join(ROOT, pathname), "utf8");
}

test("DCC header source owns the exact DCC core chrome markers", () => {
  const source = read("app/components/dcc/SiteHeader.tsx");
  for (const marker of [
    "DCC",
    "SYS_OK",
    "Overview",
    "Routing",
    "Metrics",
    "Governance",
    "Sign In",
    "Launch Console",
  ]) {
    assert.match(source, new RegExp(marker.replace(".", "\\.")), marker);
  }
});

test("DCC footer source owns the DCC footer matrix grammar", () => {
  const source = read("app/components/dcc/SiteFooter.tsx");
  for (const marker of ["DCC", ".engine", ".system", ".connect"]) {
    assert.match(source, new RegExp(marker.replace(".", "\\.")), marker);
  }
});

test("tracked satellite headers do not contain DCC command chrome markers", () => {
  const satelliteHeaderPaths = [
    "app/components/network/WtonotBrandHeader.tsx",
    "apps/welcometotheswamp/app/components/SiteHeader.tsx",
    "apps/juneauflightdeck/app/components/SiteHeader.tsx",
  ];

  for (const pathname of satelliteHeaderPaths) {
    const source = read(pathname);
    assert.doesNotMatch(source, /SYS_OK/, pathname);
    assert.doesNotMatch(source, /Launch Console/, pathname);
    assert.doesNotMatch(source, /Overview\s*\/\s*Routing\s*\/\s*Metrics\s*\/\s*Governance/, pathname);
  }
});

test("node resolver enforces DCC vs satellite boundary intent", () => {
  assert.equal(
    resolveNodeForRequest({ host: "www.destinationcommandcenter.com", pathname: "/command" }).nodeId,
    "dcc",
  );
  assert.equal(
    resolveNodeForRequest({ host: "www.welcometoneworleanstours.com", pathname: "/" }).nodeId,
    "wtonot",
  );
  assert.equal(resolveNodeForRequest({ host: "www.welcometotheswamp.com", pathname: "/plan" }).nodeId, "wts");
  assert.equal(
    resolveNodeForRequest({ host: "shuttletosomersetamphitheater.com", pathname: "/" }).nodeId,
    "somerset",
  );
});

test("WTONOT proxy path carries an explicit brand-shell header", () => {
  const source = read("proxy.ts");
  assert.match(source, /const WTONOT_BRAND_SHELL_HEADER = "x-dcc-brand-shell"/);
  assert.match(source, /requestHeaders\.set\(WTONOT_BRAND_SHELL_HEADER, "wtonot"\)/);
  assert.match(source, /request:\s*\{\s*headers:\s*getWtonotBrandShellHeaders\(request\)\s*\}/);
});

test("Somerset proxy drift is documented without changing behavior", (t) => {
  const source = read("proxy.ts");
  const somersetRewriteBlock = source.match(/const somersetRewrite = getSomersetHostRewrite\(request\);[\s\S]*?return response;/)?.[0] || "";

  assert.match(somersetRewriteBlock, /NextResponse\.rewrite\(somersetRewrite\)/);
  assert.doesNotMatch(somersetRewriteBlock, /x-dcc-brand-shell|brandShell|somerset"/);
  t.diagnostic(
    "Known Phase 1 drift: Somerset host suppression exists in app/layout.tsx, but proxy.ts does not set an explicit somerset brand-shell header yet.",
  );
});
