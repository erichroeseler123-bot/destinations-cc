import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import {
  getDiscoveryPublicationStorePath,
  listDiscoveryPublicationTargets,
  publishDiscoveryStackSnapshot,
  readPublishedDiscoverySnapshot,
} from "@/lib/dcc/discoveryPublicationStore";

test("publication store writes federated discovery files to the configured snapshot path", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-discovery-"));
  const storePath = path.join(tempDir, "published.json");

  process.env.DCC_DISCOVERY_PUBLICATION_STORE_PATH = storePath;

  try {
    const published = publishDiscoveryStackSnapshot();
    const reread = readPublishedDiscoverySnapshot();

    assert.equal(getDiscoveryPublicationStorePath(), storePath);
    assert.ok(fs.existsSync(storePath));
    assert.equal(reread?.version, published.version);
    assert.ok(reread?.surfaces.some((surface) => surface.id === "destinationcommandcenter"));
    assert.ok(reread?.surfaces.some((surface) => surface.id === "partyatredrocks"));

    const dcc = reread?.surfaces.find((surface) => surface.id === "destinationcommandcenter");
    assert.match(dcc?.files.sitemap.body || "", /<sitemapindex/);
    assert.match(dcc?.files.agent.body || "", /"role": "dcc"/);
  } finally {
    delete process.env.DCC_DISCOVERY_PUBLICATION_STORE_PATH;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("publication targets expose deterministic storage keys for each governed surface", () => {
  const targets = listDiscoveryPublicationTargets();
  const dcc = targets.find((target) => target.id === "destinationcommandcenter");

  assert.ok(dcc);
  assert.equal(dcc?.storageKey, "discovery:destinationcommandcenter");
  assert.equal(dcc?.files.sitemap, "discovery:destinationcommandcenter/sitemap.xml");
});
