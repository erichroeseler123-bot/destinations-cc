import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getCheckoutProduct,
  getCheckoutRouteConfig,
  getCheckoutProductsForRoute,
} from "@/lib/checkoutProducts";
import { getDccSiteTruth } from "@/lib/dcc/siteTruth";
import { getPublicCorridorContracts } from "@/lib/dcc/publicCorridorContract";

test("retired Argo service cannot re-enter DCC checkout catalog", () => {
  assert.equal(getCheckoutRouteConfig("argo"), null);
  assert.equal(getCheckoutProduct("argo-seat"), null);
  assert.equal(getCheckoutProduct("argo-suv"), null);
  assert.deepEqual(getCheckoutProductsForRoute("argo"), []);
});

test("DCC truth explicitly marks Mighty Argo scheduled transportation retired", () => {
  const dcc = getDccSiteTruth("destination-command-center");
  assert.ok(dcc);
  assert.equal(dcc.public_claims?.mighty_argo_scheduled_transportation, "retired_not_operating");
  assert.equal(dcc.public_claims?.mighty_argo_direct_checkout, false);
});

test("retired Argo corridor is absent from public machine handoffs", () => {
  const corridors = getPublicCorridorContracts();
  assert.equal(corridors.some((corridor) => corridor.id === "argo-day-transport"), false);
  assert.equal(corridors.some((corridor) => corridor.executionSurface.includes("argo-shuttle")), false);
});

test("network exports cannot monetize the retired Argo service", async () => {
  const monetized = JSON.parse(
    await readFile(new URL("../../data/network/exports/monetized.export.v1.json", import.meta.url), "utf8"),
  );
  const nodes = JSON.parse(
    await readFile(new URL("../../data/network/nodes.v1.json", import.meta.url), "utf8"),
  );

  assert.equal(monetized.nodes.length, 0);
  assert.equal(monetized.edges.length, 0);

  const argo = nodes.nodes.find((node: { node_id?: string }) => node.node_id === "dcc:node:mighty-argo-shuttle");
  assert.ok(argo);
  assert.equal(argo.status, "retired");
  assert.deepEqual(argo.monetized_targets, []);
});
