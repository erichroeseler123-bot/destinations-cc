import test from "node:test";
import assert from "node:assert/strict";
import { buildDecisionFunnelPayload, mapLegacyDecisionEventName } from "@/lib/analytics";
import { CorridorEventPayloadSchema } from "@/lib/dcc/telemetry/corridorEvents";
import {
  countAcceptedVerdicts,
  countDecisionAttempts,
  countRoutingLeaks,
  type DecisionEventLike,
} from "@/lib/dcc/telemetry/decisionIntelligence";
import { withTrackedLinkContext } from "@/app/components/analytics/TrackedLink";

function event(overrides: Partial<DecisionEventLike>): DecisionEventLike {
  return {
    corridorId: "denver-to-mountains",
    eventName: "landing_viewed",
    sourcePage: "/denver-to-mountains",
    targetPath: null,
    clickedProductSlug: null,
    routeTarget: null,
    metadata: {},
    ...overrides,
  };
}

test("canonical decision-attempt events are accepted by the corridor schema", () => {
  for (const eventName of ["landing_viewed", "verdict_shown"] as const) {
    const parsed = CorridorEventPayloadSchema.safeParse({
      corridor_id: "denver-to-mountains",
      event_name: eventName,
      source_page: "/denver-to-mountains",
    });

    assert.equal(parsed.success, true, `${eventName} should be accepted`);
  }
});

test("decision attempts count landing and verdict events only", () => {
  const events = [
    event({ eventName: "landing_viewed" }),
    event({ eventName: "verdict_shown" }),
    event({ eventName: "handoff_viewed" }),
    event({ eventName: "shortlist_rendered" }),
  ];

  assert.equal(countDecisionAttempts(events), 2);
});

test("legacy page and verdict events map into canonical decision attempts", () => {
  assert.equal(mapLegacyDecisionEventName("dcc_page_view"), "landing_viewed");
  assert.equal(mapLegacyDecisionEventName("plan_rendered"), "verdict_shown");
  assert.equal(mapLegacyDecisionEventName("shortlist_rendered"), "shortlist_rendered");

  const pageViewPayload = buildDecisionFunnelPayload("dcc_page_view", {
    surface: "swamp-tours",
    page: "/new-orleans/swamp-tours/best-swamp-tours",
  });
  const planPayload = buildDecisionFunnelPayload("plan_rendered", {
    corridor: "partyatredrocks",
    page: "/red-rocks-transportation",
    target_path: "/red-rocks-transportation",
  });
  const shortlistPayload = buildDecisionFunnelPayload("shortlist_rendered", {
    corridor: "partyatredrocks",
    page: "/red-rocks-transportation",
  });

  assert.equal(pageViewPayload?.event_name, "landing_viewed");
  assert.equal(planPayload?.event_name, "verdict_shown");
  assert.equal(shortlistPayload, null);
});

test("accepted verdicts count primary outbound events", () => {
  const events = [
    event({ eventName: "product_opened", targetPath: "/book" }),
    event({ eventName: "cta_clicked_primary", targetPath: "/book" }),
    event({ eventName: "operator_cta_clicked", targetPath: "/book" }),
    event({ eventName: "cta_clicked_alternative", targetPath: "/fallback" }),
  ];

  assert.equal(countAcceptedVerdicts(events), 3);
});

test("legacy CTA events map into canonical accepted-verdict events", () => {
  assert.equal(mapLegacyDecisionEventName("dcc_primary_cta_click"), "cta_clicked_primary");
  assert.equal(mapLegacyDecisionEventName("plan_accepted"), "cta_clicked_primary");
  assert.equal(mapLegacyDecisionEventName("recommendation_clicked"), "operator_cta_clicked");

  const ctaPayload = buildDecisionFunnelPayload("dcc_primary_cta_click", {
    surface: "swamp-tours",
    page: "/new-orleans/swamp-tours/best-swamp-tours",
    target_path: "https://welcometotheswamp.com/plan",
  });
  const planAcceptedPayload = buildDecisionFunnelPayload("plan_accepted", {
    corridor: "partyatredrocks",
    page: "/red-rocks-transportation",
    target_path: "https://partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
  });
  const recommendationPayload = buildDecisionFunnelPayload("recommendation_clicked", {
    corridor: "partyatredrocks",
    page: "/red-rocks-transportation",
    target_path: "https://partyatredrocks.com/book/red-rocks-amphitheatre/private",
  });

  assert.equal(ctaPayload?.event_name, "cta_clicked_primary");
  assert.equal(planAcceptedPayload?.event_name, "cta_clicked_primary");
  assert.equal(recommendationPayload?.event_name, "operator_cta_clicked");
});

test("TrackedLink context preserves href as target path for corridor events", () => {
  const enriched = withTrackedLinkContext(
    {
      name: "dcc_primary_cta_click",
      props: {
        surface: "dcc",
        corridor: "swamp-tours",
      },
    },
    "/plan?src=dcc",
  );

  assert.equal(enriched.props.href, "/plan?src=dcc");
  assert.equal(enriched.props.target_path, "/plan?src=dcc");
  assert.equal(enriched.props.target_url, "/plan?src=dcc");
});

test("accepted events without route context are route leaks", () => {
  const events = [
    event({ eventName: "product_opened" }),
    event({ eventName: "operator_cta_clicked", targetPath: "/book" }),
    event({ eventName: "cta_clicked_primary", routeTarget: "red-rocks-shared-operator" }),
    event({ eventName: "product_opened", metadata: { route_key: "western-wisconsin" } }),
  ];

  assert.equal(countRoutingLeaks(events), 1);
});

test("handoff ledger-style rows alone do not count as decision attempts", () => {
  const events = [
    event({ eventName: "handoff_viewed" }),
    event({ eventName: "booking_opened" }),
    event({ eventName: "checkout_started" }),
  ];

  assert.equal(countDecisionAttempts(events), 0);
});
