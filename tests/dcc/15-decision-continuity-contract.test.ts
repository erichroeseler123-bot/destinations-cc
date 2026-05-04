import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDecisionContinuationParams,
  buildDecisionContinuationUrl,
} from "@/lib/dcc/contracts/decisionContinuation";
import {
  buildParrPrivateRedRocksUrl,
  buildParrSharedRedRocksUrl,
} from "@/lib/dcc/contracts/dccParrBridge";

test("decision continuation params carry the chosen action forward", () => {
  const params = buildDecisionContinuationParams({
    sourcePage: "/red-rocks-shuttle-vs-uber",
    corridor: "red-rocks-transport",
    cta: "book-the-shuttle",
    action: "book_shared_red_rocks_shuttle",
    option: "shuttle",
    product: "shared-red-rocks-shuttle-seat",
    entryMode: "dcc-first",
    destinationSurface: "operator",
  });

  assert.equal(params.source_page, "/red-rocks-shuttle-vs-uber");
  assert.equal(params.decision_state, "chosen");
  assert.equal(params.decision_corridor, "red-rocks-transport");
  assert.equal(params.decision_action, "book_shared_red_rocks_shuttle");
  assert.equal(params.decision_option, "shuttle");
  assert.equal(params.decision_product, "shared-red-rocks-shuttle-seat");
  assert.equal(params.destination_surface, "operator");
  assert.equal(params.decision_policy, "continue_without_reset");
});

test("decision continuation url appends continuity fields to airport operator links", () => {
  const url = buildDecisionContinuationUrl("https://420friendlyairportpickup.com/?operator=420", {
    sourcePage: "/denver/airport-ride-with-kids",
    corridor: "denver-airport-family",
    cta: "start-family-safe-airport-flow",
    action: "start_family_safe_airport_flow",
    option: "family-safe-private-pickup",
    product: "family-airport-pickup-flow",
    entryMode: "mixed",
  });

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("operator"), "420");
  assert.equal(parsed.searchParams.get("decision_corridor"), "denver-airport-family");
  assert.equal(parsed.searchParams.get("decision_action"), "start_family_safe_airport_flow");
  assert.equal(parsed.searchParams.get("decision_option"), "family-safe-private-pickup");
  assert.equal(parsed.searchParams.get("decision_product"), "family-airport-pickup-flow");
  assert.equal(parsed.searchParams.get("decision_entry"), "mixed");
});

test("decision continuation url supports direct PARR handoff", () => {
  const url = buildDecisionContinuationUrl("https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?src=dcc&operator=parr", {
    sourcePage: "/denver/concert-transportation",
    corridor: "red-rocks-transport",
    cta: "start-private-red-rocks-flow",
    action: "start_private_red_rocks_flow",
    option: "private-red-rocks-transport",
    product: "parr-private",
    entryMode: "mixed",
    destinationSurface: "operator",
  });

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("src"), "dcc");
  assert.equal(parsed.searchParams.get("operator"), "parr");
  assert.equal(parsed.searchParams.get("source_page"), "/denver/concert-transportation");
  assert.equal(parsed.searchParams.get("decision_corridor"), "red-rocks-transport");
  assert.equal(parsed.searchParams.get("decision_action"), "start_private_red_rocks_flow");
  assert.equal(parsed.searchParams.get("decision_option"), "private-red-rocks-transport");
  assert.equal(parsed.searchParams.get("decision_product"), "parr-private");
  assert.equal(parsed.searchParams.get("destination_surface"), "operator");
});

test("red rocks bridge dual-writes decision and legacy lane params for shared PARR handoff", () => {
  const url = buildParrSharedRedRocksUrl({
    sourcePage: "/red-rocks-transportation",
    cta: "primary",
  });

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("src"), "dcc");
  assert.equal(parsed.searchParams.get("source_page"), "/red-rocks-transportation");
  assert.equal(parsed.searchParams.get("decision_corridor"), "red-rocks-transport");
  assert.equal(parsed.searchParams.get("decision_action"), "book_shared_red_rocks_shuttle");
  assert.equal(parsed.searchParams.get("decision_option"), "shuttle");
  assert.equal(parsed.searchParams.get("decision_product"), "shared-red-rocks-shuttle-seat");
  assert.equal(parsed.searchParams.get("requested_lane"), "transport");
  assert.equal(parsed.searchParams.get("resolved_lane"), "shared-red-rocks-shuttle-seat");
  assert.equal(parsed.searchParams.get("product_slug"), "shared-red-rocks-shuttle-seat");
});

test("red rocks bridge preserves Marriott West pickup prefill params for shared PARR handoff", () => {
  const url = buildParrSharedRedRocksUrl({
    sourcePage: "/red-rocks-transportation",
    decision_cta: "golden-marriott-west-push",
    decision_option: "golden_shuttle",
    decision_product: "shared-golden",
    requested_lane: "golden",
    resolved_lane: "shared-golden",
    pickup: "golden",
    pickup_label: "Denver Marriott West",
  });

  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/book/red-rocks-amphitheatre/custom/shared");
  assert.equal(parsed.searchParams.get("decision_cta"), "golden-marriott-west-push");
  assert.equal(parsed.searchParams.get("decision_option"), "golden_shuttle");
  assert.equal(parsed.searchParams.get("decision_product"), "shared-golden");
  assert.equal(parsed.searchParams.get("requested_lane"), "golden");
  assert.equal(parsed.searchParams.get("resolved_lane"), "shared-golden");
  assert.equal(parsed.searchParams.get("pickup"), "golden");
  assert.equal(parsed.searchParams.get("pickupHub"), "golden");
  assert.equal(parsed.searchParams.get("pickupLabel"), "Denver Marriott West");
});

test("red rocks bridge dual-writes decision and legacy lane params for private PARR handoff", () => {
  const url = buildParrPrivateRedRocksUrl({
    sourcePage: "/red-rocks-transportation",
    cta: "secondary",
  });

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("src"), "dcc");
  assert.equal(parsed.searchParams.get("source_page"), "/red-rocks-transportation");
  assert.equal(parsed.searchParams.get("decision_corridor"), "red-rocks-transport");
  assert.equal(parsed.searchParams.get("decision_action"), "book_private_red_rocks_ride");
  assert.equal(parsed.searchParams.get("decision_option"), "private");
  assert.equal(parsed.searchParams.get("decision_product"), "parr-private");
  assert.equal(parsed.searchParams.get("requested_lane"), "private");
  assert.equal(parsed.searchParams.get("resolved_lane"), "parr-private");
  assert.equal(parsed.searchParams.get("product_slug"), "parr-private");
});

test("decision continuation url supports direct GoSno handoff", () => {
  const url = buildDecisionContinuationUrl(
    "https://gosno.co/vail?src=dcc&operator=gosno",
    {
      sourcePage: "/transportation/colorado/denver-to-vail-shuttle-guide",
      corridor: "denver-vail-transfer",
      cta: "start-vail-transfer-flow",
      action: "start_vail_transfer_flow",
      option: "ski-transfer",
      product: "vail-shuttle",
      entryMode: "mixed",
      destinationSurface: "operator",
    },
  );

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("src"), "dcc");
  assert.equal(parsed.searchParams.get("operator"), "gosno");
  assert.equal(parsed.searchParams.get("decision_corridor"), "denver-vail-transfer");
  assert.equal(parsed.searchParams.get("decision_action"), "start_vail_transfer_flow");
  assert.equal(parsed.searchParams.get("destination_surface"), "operator");
});

test("decision continuation url supports Shuttleya argo reservation handoff", () => {
  const url = buildDecisionContinuationUrl(
    "https://shuttleya.com/book/argo-shuttle?src=dcc&operator=argo&route=argo&product=argo-seat",
    {
      sourcePage: "/mighty-argo-shuttle",
      corridor: "argo-day-transport",
      cta: "start-argo-seat-reservation",
      action: "start_argo_seat_reservation",
      option: "argo-day-trip",
      product: "argo-seat",
      entryMode: "mixed",
      destinationSurface: "operator",
      handoff: {
        corridorId: "argo-day-transport",
        recommendationId: "argo-8am-seat",
        handoffId: "handoff-argo-123",
        productId: "argo-seat",
        departureTs: "2026-07-20T08:00:00-06:00",
        returnTs: "2026-07-20T11:00:00-06:00",
        qty: 2,
        pickupLocationId: "union-station",
      },
    },
  );

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("src"), "dcc");
  assert.equal(parsed.searchParams.get("operator"), "argo");
  assert.equal(parsed.searchParams.get("product"), "argo-seat");
  assert.equal(parsed.searchParams.get("decision_corridor"), "argo-day-transport");
  assert.equal(parsed.searchParams.get("decision_action"), "start_argo_seat_reservation");
  assert.equal(parsed.searchParams.get("destination_surface"), "operator");
  assert.equal(parsed.searchParams.get("c_id"), "argo-day-transport");
  assert.equal(parsed.searchParams.get("r_id"), "argo-8am-seat");
  assert.equal(parsed.searchParams.get("h_id"), "handoff-argo-123");
  assert.equal(parsed.searchParams.get("pid"), "argo-seat");
  assert.equal(parsed.searchParams.get("dep_ts"), "2026-07-20T08:00:00-06:00");
  assert.equal(parsed.searchParams.get("ret_ts"), "2026-07-20T11:00:00-06:00");
  assert.equal(parsed.searchParams.get("qty"), "2");
  assert.equal(parsed.searchParams.get("loc_id"), "union-station");
});
