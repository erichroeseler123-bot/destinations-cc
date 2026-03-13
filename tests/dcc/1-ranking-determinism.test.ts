import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCruiseSortMode,
  sortCruises,
  buildCruisePayload,
} from "@/lib/dcc/internal/cruisePayload";
import { makeSailing } from "./helpers";

const input = [
  makeSailing({ sailing_id: "A", starting_price: { amount: 500, currency: "USD", cabin_type: "inside" }, duration_days: 5, departure_date: "2026-07-05", sailing_context: { demand_level: "high" } as any }),
  makeSailing({ sailing_id: "B", starting_price: { amount: 200, currency: "USD", cabin_type: "inside" }, duration_days: 7, departure_date: "2026-07-03", sailing_context: { demand_level: "very-high" } as any }),
  makeSailing({ sailing_id: "C", starting_price: { amount: 200, currency: "USD", cabin_type: "inside" }, duration_days: 7, departure_date: "2026-07-03", sailing_context: { demand_level: "very-high" } as any }),
];

test("normalizeCruiseSortMode falls back to departure", () => {
  assert.equal(normalizeCruiseSortMode("nonsense"), "departure");
  assert.equal(normalizeCruiseSortMode(null), "departure");
  assert.equal(normalizeCruiseSortMode("price"), "price");
});

test("sortCruises deterministic for price mode and stable tie-breakers", () => {
  const a = sortCruises(input, "price").map((x) => x.sailing_id);
  const b = sortCruises(input, "price").map((x) => x.sailing_id);
  assert.deepEqual(a, b);
  assert.deepEqual(a, ["B", "C", "A"]);
});

test("sortCruises deterministic for duration/departure/popular", () => {
  const duration = sortCruises(input, "duration").map((x) => x.sailing_id);
  const departure = sortCruises(input, "departure").map((x) => x.sailing_id);
  const popular = sortCruises(input, "popular").map((x) => x.sailing_id);

  assert.deepEqual(duration, ["A", "B", "C"]);
  assert.deepEqual(departure, ["B", "C", "A"]);
  assert.deepEqual(popular, ["B", "C", "A"]);
});

test("buildCruisePayload summary.sort_mode matches requested mode", async () => {
  const payload = await buildCruisePayload({ type: "port", value: "miami", sortMode: "price" });
  assert.equal(payload.summary?.sort_mode, "price");
});
