import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDccRootAgentManifest,
  buildDccRootLlmsText,
  buildDccRootSitemapIndex,
  buildDiscoveryStackSnapshot,
} from "@/lib/dcc/discoveryStack";

test("discovery stack snapshot includes dcc root and governed surfaces", () => {
  const snapshot = buildDiscoveryStackSnapshot();
  const ids = snapshot.publications.map((publication) => publication.id);

  assert.ok(ids.includes("destinationcommandcenter"));
  assert.ok(ids.includes("welcometotheswamp"));
  assert.ok(ids.includes("partyatredrocks"));
});

test("dcc root sitemap index includes satellite and operator domains", () => {
  const xml = buildDccRootSitemapIndex();

  assert.match(xml, /destinationcommandcenter\.com\/sitemap\.xml/);
  assert.match(xml, /welcometotheswamp\.com\/sitemap\.xml/);
  assert.match(xml, /partyatredrocks\.com\/sitemap\.xml/);
});

test("dcc root agent manifest exposes governed surfaces and handoff contract", () => {
  const manifest = buildDccRootAgentManifest() as {
    role: string;
    governed_surfaces?: Array<{ id: string }>;
    handoff_protocol?: { type: string };
  };

  assert.equal(manifest.role, "dcc");
  assert.equal(manifest.handoff_protocol?.type, "decision_carriage");
  assert.ok(manifest.governed_surfaces?.some((surface) => surface.id === "welcometoalaskatours"));
});

test("dcc root llms text describes governance and machine-readable paths", () => {
  const text = buildDccRootLlmsText();

  assert.match(text, /Role: dcc/);
  assert.match(text, /destinationcommandcenter\.com\/agent\.json/);
});
