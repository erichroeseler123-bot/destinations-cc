"use client";

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { toHandoffSearchParams } from "@/lib/satellite-runtime/handoff";
import type { SatelliteHandoffContext, SatelliteTelemetryInput } from "@/lib/satellite-runtime/types";

const CORRIDOR_ID = "feastly-dinner-night";
const SATELLITE_ID = "feastly";
const BRAND_ID = "FEASTLY";
const DECISION_ACTION = "checkout_started";
const DECISION_OPTION = "pick_team";
const DECISION_PRODUCT = "private_group_dining";
const SESSION_KEY = "dcc_session_id";

function randomId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function getSessionId() {
  if (typeof window === "undefined") return undefined;

  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const next = randomId("dcc_session");
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

function buildFeastlyHandoff(input: {
  handoffId: string;
  sourcePage: string;
  destinationUrl: string;
}): SatelliteHandoffContext {
  const dccBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.destinationcommandcenter.com";

  return {
    satelliteId: SATELLITE_ID,
    brandId: BRAND_ID,
    dccBaseUrl,
    dccHandoffId: input.handoffId,
    decision_corridor: CORRIDOR_ID,
    decision_action: DECISION_ACTION,
    decision_option: DECISION_OPTION,
    decision_product: DECISION_PRODUCT,
    source_url: input.sourcePage,
    destination_url: input.destinationUrl,
  };
}

function appendTrackingParams(
  href: string,
  input: {
    handoffId: string;
    sourcePage: string;
    cta: string;
  },
) {
  try {
    const url = new URL(href, typeof window !== "undefined" ? window.location.origin : undefined);
    const handoff = buildFeastlyHandoff({
      handoffId: input.handoffId,
      sourcePage: input.sourcePage,
      destinationUrl: url.toString(),
    });
    const handoffParams = toHandoffSearchParams(handoff);

    handoffParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    url.searchParams.set("dcc_source", "destination_command_center");
    url.searchParams.set("dcc_corridor", CORRIDOR_ID);
    url.searchParams.set("source_page", input.sourcePage);
    url.searchParams.set("cta", input.cta);
    return url.toString();
  } catch {
    return href;
  }
}

function postCorridorEvent(input: {
  eventName: "dcc_mapping_click" | "cta_clicked_primary";
  sourcePage: string;
  targetPath: string;
  handoffId: string;
  sessionId?: string;
  cta: string;
}) {
  void fetch("/api/internal/corridor-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      corridor_id: CORRIDOR_ID,
      event_name: input.eventName,
      handoff_id: input.handoffId,
      session_id: input.sessionId,
      source_page: input.sourcePage,
      landing_path: input.sourcePage,
      target_path: input.targetPath,
      route_target: input.targetPath,
      requested_lane: "feastly",
      resolved_lane: "feastly",
      fit_signal: "wisconsin-dells-group-food",
      metadata: {
        action: "feastly_cta_clicked",
        cta: input.cta,
        provider: "feastlyspread",
        target_domain: "feastlyspread.com",
      },
    }),
  }).catch(() => undefined);
}

export default function FeastlyTrackedCtaLink({
  href,
  sourcePage,
  cta,
  className,
  children,
  emitTelemetryAction,
  checkoutAction,
}: {
  href: string;
  sourcePage: string;
  cta: string;
  className?: string;
  children: ReactNode;
  emitTelemetryAction?: (input: SatelliteTelemetryInput) => Promise<void>;
  checkoutAction?: (handoff: SatelliteHandoffContext) => Promise<void>;
}) {
  const [sessionId, setSessionId] = useState<string>();
  const [handoffId, setHandoffId] = useState<string>();

  useEffect(() => {
    setSessionId(getSessionId());
    setHandoffId(randomId("feastly_handoff"));
  }, []);

  const trackedHref = useMemo(() => {
    if (!handoffId) return href;
    return appendTrackingParams(href, {
      handoffId,
      sourcePage,
      cta,
    });
  }, [cta, handoffId, href, sourcePage]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (checkoutAction) {
      event.preventDefault();
    }

    const resolvedHandoffId = handoffId || randomId("feastly_handoff");
    const targetPath = appendTrackingParams(href, {
      handoffId: resolvedHandoffId,
      sourcePage,
      cta,
    });
    const handoff = buildFeastlyHandoff({
      handoffId: resolvedHandoffId,
      sourcePage,
      destinationUrl: targetPath,
    });
    event.currentTarget.href = targetPath;

    trackEvent("dcc_exit_clicked", {
      surface: "feastly",
      corridor: CORRIDOR_ID,
      page: sourcePage,
      page_type: "feeder",
      target_path: targetPath,
      action: "feastly_cta_clicked",
      cta,
      handoff_id: resolvedHandoffId,
      provider: "feastlyspread",
    });

    postCorridorEvent({
      eventName: "dcc_mapping_click",
      sourcePage,
      targetPath,
      handoffId: resolvedHandoffId,
      sessionId,
      cta,
    });

    postCorridorEvent({
      eventName: "cta_clicked_primary",
      sourcePage,
      targetPath,
      handoffId: resolvedHandoffId,
      sessionId,
      cta,
    });

    void emitTelemetryAction?.({
      ...handoff,
      event_name: "feastly_checkout_intent",
      event_payload: {
        cta,
        session_id: sessionId,
        provider: "feastlyspread",
        target_path: targetPath,
        legacy_event_names: ["dcc_mapping_click", "cta_clicked_primary"],
      },
    }).catch(() => undefined);

    void checkoutAction?.(handoff).catch(() => {
      window.location.assign(targetPath);
    });
  }

  return (
    <a href={trackedHref} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
