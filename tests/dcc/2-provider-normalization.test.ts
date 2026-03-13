import test from "node:test";
import assert from "node:assert/strict";
import { CruiseSailingSchema } from "@/lib/dcc/cruise/validation";
import { carnivalProvider } from "@/lib/dcc/action/cruiseActionProviders/carnival";
import { royalCaribbeanProvider } from "@/lib/dcc/action/cruiseActionProviders/royalcaribbean";
import { norwegianProvider } from "@/lib/dcc/action/cruiseActionProviders/norwegian";

type MockResp = { ok: boolean; status: number; json: () => Promise<any> };

function mockFetch(payload: any): () => void {
  const original = global.fetch;
  global.fetch = (async () => {
    const response: MockResp = {
      ok: true,
      status: 200,
      json: async () => payload,
    };
    return response as any;
  }) as any;
  return () => {
    global.fetch = original;
  };
}

const row = {
  sailing_id: "X-1",
  line: "Line X",
  ship: "Ship X",
  departure_date: "2026-07-01",
  duration_days: 6,
  embark_port: { port_name: "Miami, USA", arrival: "2026-07-01T12:00:00Z", departure: "2026-07-01T18:00:00Z" },
  disembark_port: { port_name: "Miami, USA", arrival: "2026-07-07T11:00:00Z", departure: "2026-07-07T13:00:00Z" },
  ports: [
    { port_name: "Miami, USA", arrival: "2026-07-01T12:00:00Z", departure: "2026-07-01T18:00:00Z" },
    { port_name: "Miami, USA", arrival: "2026-07-07T11:00:00Z", departure: "2026-07-07T13:00:00Z" },
  ],
  amenities: { dining: [], entertainment: [], activities: [], wellness: [], other: [] },
};

test("each provider normalizes valid rows into CruiseSailing", async () => {
  process.env.CARNIVAL_CRUISE_FEED_URL = "https://example.com/carnival";
  process.env.ROYAL_CARIBBEAN_CRUISE_FEED_URL = "https://example.com/rcl";
  process.env.NORWEGIAN_CRUISE_FEED_URL = "https://example.com/ncl";

  const restore = mockFetch([row]);
  try {
    const out1 = await carnivalProvider.fetchSailings({ timeout_ms: 1000 });
    const out2 = await royalCaribbeanProvider.fetchSailings({ timeout_ms: 1000 });
    const out3 = await norwegianProvider.fetchSailings({ timeout_ms: 1000 });

    for (const out of [out1, out2, out3]) {
      assert.equal(out.length, 1);
      assert.equal(CruiseSailingSchema.safeParse(out[0]).success, true);
    }
  } finally {
    restore();
  }
});

test("bad rows are rejected cleanly and missing optional fields do not crash", async () => {
  process.env.CARNIVAL_CRUISE_FEED_URL = "https://example.com/carnival";
  const restore = mockFetch([
    { line: "Bad Row Missing Required" },
    {
      line: "Good Enough",
      ship: "Ship Y",
      departure_date: "2026-09-01",
      duration_days: 5,
      ports: [
        { port_name: "Seattle, USA", arrival: "2026-09-01T12:00:00Z", departure: "2026-09-01T18:00:00Z" },
        { port_name: "Seattle, USA", arrival: "2026-09-06T11:00:00Z", departure: "2026-09-06T13:00:00Z" },
      ],
      amenities: { dining: [], entertainment: [], activities: [], wellness: [], other: [] },
    },
  ]);

  try {
    const out = await carnivalProvider.fetchSailings({ timeout_ms: 1000 });
    assert.equal(out.length, 1);
    assert.equal(out[0].ship, "Ship Y");
    assert.equal(CruiseSailingSchema.safeParse(out[0]).success, true);
  } finally {
    restore();
  }
});
