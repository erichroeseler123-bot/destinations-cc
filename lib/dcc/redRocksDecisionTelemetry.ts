"use client";

const CORRIDOR_EVENT_ENDPOINT = "/api/internal/corridor-events";
const SESSION_KEY = "dcc_red_rocks_decision_session_v1";
const FLOW_STATE_KEY = "dcc_red_rocks_plan_state_v1";
const CORRIDOR_ID = "partyatredrocks";
const DEFAULT_CARD_SLUG = "shared-red-rocks-shuttle-seat";
const DEFAULT_RECOMMENDATION_ID = "red-rocks-shared-default";

export const RED_ROCKS_RESULT_IDS = [
  "shared-red-rocks-shuttle-seat",
  "parr-private",
  "fallback-self-manage",
] as const;

export type RedRocksClickedOption = "must_do" | "alternative" | "fallback";
export type RedRocksAbandonmentReason = "no_cta_click" | "fallback_selected" | "external_exit";

type RedRocksFlowState = {
  sourcePage: string;
  renderStartedAtMs: number;
  interacted: boolean;
  abandonmentTracked: boolean;
  modifiedFields: string[];
  selectedProductSlug: string | null;
};

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `anon-${Date.now()}`;
  }
}

function postCorridorEvent(payload: Record<string, unknown>) {
  void fetch(CORRIDOR_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

function buildDecisionMetadata(overrides: Record<string, unknown> = {}) {
  return {
    page_path: "/red-rocks-transportation",
    selected_intent: "red-rocks-transportation",
    decision_corridor: "red_rocks",
    result_ids: [...RED_ROCKS_RESULT_IDS],
    primary_result_id: RED_ROCKS_RESULT_IDS[0],
    recommendation_id: DEFAULT_RECOMMENDATION_ID,
    ...overrides,
  };
}

function readFlowState() {
  try {
    const raw = window.sessionStorage.getItem(FLOW_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RedRocksFlowState>;
    if (
      typeof parsed.sourcePage !== "string"
      || typeof parsed.renderStartedAtMs !== "number"
      || typeof parsed.interacted !== "boolean"
      || typeof parsed.abandonmentTracked !== "boolean"
    ) {
      return null;
    }

    return {
      sourcePage: parsed.sourcePage,
      renderStartedAtMs: parsed.renderStartedAtMs,
      interacted: parsed.interacted,
      abandonmentTracked: parsed.abandonmentTracked,
      modifiedFields: Array.isArray(parsed.modifiedFields)
        ? parsed.modifiedFields.filter((value): value is string => typeof value === "string")
        : [],
      selectedProductSlug: typeof parsed.selectedProductSlug === "string" ? parsed.selectedProductSlug : null,
    } satisfies RedRocksFlowState;
  } catch {
    return null;
  }
}

function writeFlowState(state: RedRocksFlowState) {
  try {
    window.sessionStorage.setItem(FLOW_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore telemetry state persistence failures.
  }
}

function updateFlowState(patch: Partial<RedRocksFlowState>) {
  const current = readFlowState();
  if (!current) return;
  writeFlowState({
    ...current,
    ...patch,
  });
}

function buildBasePayload(sourcePage: string, overrides: Record<string, unknown> = {}) {
  return {
    corridor_id: CORRIDOR_ID,
    session_id: getSessionId(),
    source_page: sourcePage,
    landing_path: window.location.pathname,
    default_card_slug: DEFAULT_CARD_SLUG,
    ...overrides,
  };
}

function getTimeToCheckoutStartMs() {
  const flowState = readFlowState();
  if (!flowState) return null;
  const delta = Date.now() - flowState.renderStartedAtMs;
  return Number.isFinite(delta) && delta >= 0 ? delta : null;
}

export function hasRedRocksDecisionInteraction(sourcePage?: string) {
  const flowState = readFlowState();
  if (!flowState) return false;
  if (sourcePage && flowState.sourcePage !== sourcePage) return false;
  return flowState.interacted || flowState.abandonmentTracked;
}

export function trackRedRocksDecisionShortlist(sourcePage: string) {
  const timestamp = new Date().toISOString();
  writeFlowState({
    sourcePage,
    renderStartedAtMs: Date.now(),
    interacted: false,
    abandonmentTracked: false,
    modifiedFields: [],
    selectedProductSlug: DEFAULT_CARD_SLUG,
  });

  postCorridorEvent({
    ...buildBasePayload(sourcePage, {
      target_path: window.location.pathname,
      route_target: "red-rocks-transportation",
    }),
    event_name: "landing_viewed",
    occurred_at: timestamp,
    metadata: buildDecisionMetadata({
      clicked_option: null,
      paired_legacy_event: "shortlist_generated",
      timestamp,
    }),
  });

  postCorridorEvent({
    ...buildBasePayload(sourcePage, {
      target_path: window.location.pathname,
      route_target: "red-rocks-transportation",
    }),
    event_name: "shortlist_generated",
    metadata: buildDecisionMetadata({
      clicked_option: null,
      timestamp,
    }),
  });

  postCorridorEvent({
    ...buildBasePayload(sourcePage, {
      target_path: window.location.pathname,
      route_target: "red-rocks-transportation",
    }),
    event_name: "verdict_shown",
    occurred_at: timestamp,
    metadata: buildDecisionMetadata({
      clicked_option: null,
      default_card_slug: DEFAULT_CARD_SLUG,
      paired_legacy_event: "plan_rendered",
      timestamp,
    }),
  });

  postCorridorEvent({
    ...buildBasePayload(sourcePage, {
      target_path: window.location.pathname,
      route_target: "red-rocks-transportation",
    }),
    event_name: "plan_rendered",
    occurred_at: timestamp,
    metadata: buildDecisionMetadata({
      clicked_option: null,
      default_card_slug: DEFAULT_CARD_SLUG,
      timestamp,
    }),
  });
}

export function trackRedRocksPlanAbandoned(input: {
  sourcePage: string;
  reason: RedRocksAbandonmentReason;
  targetPath?: string;
}) {
  const flowState = readFlowState();
  if (flowState && flowState.abandonmentTracked) return;

  const timestamp = new Date().toISOString();
  postCorridorEvent({
    ...buildBasePayload(input.sourcePage, {
      target_path: input.targetPath || window.location.pathname,
      route_target: input.reason === "fallback_selected"
        ? "review_fallback_red_rocks_transport"
        : "red-rocks-transportation",
      clicked_product_slug: flowState?.selectedProductSlug || undefined,
    }),
    event_name: "plan_abandoned",
    occurred_at: timestamp,
    metadata: buildDecisionMetadata({
      reason: input.reason,
      modified_fields: flowState?.modifiedFields || [],
      timestamp,
    }),
  });

  if (flowState) {
    updateFlowState({
      abandonmentTracked: true,
      interacted: true,
    });
  }
}

export function trackRedRocksDecisionClick(input: {
  sourcePage: string;
  clickedOption: RedRocksClickedOption;
  clickedProductSlug: string;
  targetPath: string;
  destinationUrl: string;
  action: string;
  bookOpened?: boolean;
}) {
  const timestamp = new Date().toISOString();
  const flowState = readFlowState();
  const modifiedFields = input.clickedOption === "alternative" ? ["product"] : [];
  const timeToCheckoutStartMs = input.bookOpened ? getTimeToCheckoutStartMs() : null;
  let bookingAvenue: string | null = null;
  let executionBrand: string | null = null;
  try {
    const destination = new URL(input.destinationUrl, window.location.origin);
    bookingAvenue = destination.searchParams.get("booking_avenue");
    executionBrand = destination.searchParams.get("execution_brand");
  } catch {
    // Keep click telemetry non-blocking if the target URL is malformed.
  }

  const basePayload = {
    ...buildBasePayload(input.sourcePage, {
      target_path: input.targetPath,
      route_target: input.action,
      clicked_product_slug: input.clickedProductSlug,
      booking_avenue: bookingAvenue || undefined,
      execution_brand: executionBrand || undefined,
    }),
    metadata: buildDecisionMetadata({
      clicked_option: input.clickedOption,
      destination_url: input.destinationUrl,
      booking_avenue: bookingAvenue,
      execution_brand: executionBrand,
      modified_fields: modifiedFields,
      previous_product_slug: flowState?.selectedProductSlug || DEFAULT_CARD_SLUG,
      timestamp,
    }),
  };

  postCorridorEvent({
    ...basePayload,
    event_name: "recommendation_clicked",
    occurred_at: timestamp,
  });

  if (input.clickedOption === "alternative") {
    postCorridorEvent({
      ...basePayload,
      event_name: "operator_cta_clicked",
      occurred_at: timestamp,
      metadata: buildDecisionMetadata({
        clicked_option: input.clickedOption,
        destination_url: input.destinationUrl,
        booking_avenue: bookingAvenue,
        execution_brand: executionBrand,
        modified_fields: modifiedFields,
        paired_legacy_event: "recommendation_clicked",
        previous_product_slug: flowState?.selectedProductSlug || DEFAULT_CARD_SLUG,
        timestamp,
      }),
    });
  }

  if (input.clickedOption === "must_do") {
    postCorridorEvent({
      ...basePayload,
      event_name: "plan_accepted",
      occurred_at: timestamp,
      metadata: buildDecisionMetadata({
        clicked_option: input.clickedOption,
        destination_url: input.destinationUrl,
        booking_avenue: bookingAvenue,
        execution_brand: executionBrand,
        default_card_slug: DEFAULT_CARD_SLUG,
        timestamp,
      }),
    });

    postCorridorEvent({
      ...basePayload,
      event_name: "cta_clicked_primary",
      occurred_at: timestamp,
      metadata: buildDecisionMetadata({
        clicked_option: input.clickedOption,
        destination_url: input.destinationUrl,
        booking_avenue: bookingAvenue,
        execution_brand: executionBrand,
        default_card_slug: DEFAULT_CARD_SLUG,
        paired_legacy_event: "plan_accepted",
        timestamp,
      }),
    });
  }

  if (input.clickedOption === "alternative") {
    postCorridorEvent({
      ...basePayload,
      event_name: "plan_modified",
      occurred_at: timestamp,
      metadata: buildDecisionMetadata({
        clicked_option: input.clickedOption,
        destination_url: input.destinationUrl,
        booking_avenue: bookingAvenue,
        execution_brand: executionBrand,
        modified_fields: ["product"],
        timestamp,
      }),
    });
  }

  if (input.clickedOption === "fallback") {
    trackRedRocksPlanAbandoned({
      sourcePage: input.sourcePage,
      reason: "fallback_selected",
      targetPath: input.targetPath,
    });
  }

  if (input.bookOpened) {
    postCorridorEvent({
      ...basePayload,
      event_name: "booking_opened",
      occurred_at: timestamp,
    });

    postCorridorEvent({
      ...basePayload,
      event_name: "checkout_started",
      occurred_at: timestamp,
      metadata: buildDecisionMetadata({
        clicked_option: input.clickedOption,
        destination_url: input.destinationUrl,
        booking_avenue: bookingAvenue,
        execution_brand: executionBrand,
        modified_fields: modifiedFields,
        product_slug: input.clickedProductSlug,
        time_to_checkout_start_ms: timeToCheckoutStartMs,
        timestamp,
      }),
    });
  }

  updateFlowState({
    sourcePage: input.sourcePage,
    interacted: true,
    abandonmentTracked: input.clickedOption === "fallback",
    modifiedFields: modifiedFields.length > 0 ? modifiedFields : (flowState?.modifiedFields || []),
    selectedProductSlug: input.clickedProductSlug,
  });
}

export function trackRedRocksCheckoutCompleted(input: {
  sourcePage?: string;
  productSlug: string;
  targetPath?: string;
}) {
  const flowState = readFlowState();
  const sourcePage = input.sourcePage || flowState?.sourcePage || "/red-rocks-transportation";
  const timestamp = new Date().toISOString();

  postCorridorEvent({
    ...buildBasePayload(sourcePage, {
      target_path: input.targetPath || window.location.pathname,
      route_target: "red-rocks-checkout",
      clicked_product_slug: input.productSlug,
    }),
    event_name: "checkout_completed",
    occurred_at: timestamp,
    metadata: buildDecisionMetadata({
      product_slug: input.productSlug,
      modified_fields: flowState?.modifiedFields || [],
      timestamp,
    }),
  });
}

export function trackRedRocksCheckoutFailed(input: {
  sourcePage?: string;
  productSlug: string;
  targetPath?: string;
  error?: string | null;
}) {
  const flowState = readFlowState();
  const sourcePage = input.sourcePage || flowState?.sourcePage || "/red-rocks-transportation";
  const timestamp = new Date().toISOString();

  postCorridorEvent({
    ...buildBasePayload(sourcePage, {
      target_path: input.targetPath || window.location.pathname,
      route_target: "red-rocks-checkout",
      clicked_product_slug: input.productSlug,
    }),
    event_name: "checkout_failed",
    occurred_at: timestamp,
    metadata: buildDecisionMetadata({
      product_slug: input.productSlug,
      modified_fields: flowState?.modifiedFields || [],
      error: input.error || null,
      timestamp,
    }),
  });
}
