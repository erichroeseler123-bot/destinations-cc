"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  clearPersistedDecisionSession,
  DECISION_MODE_QUERY_PARAM,
  DECISION_PATH_QUERY_PARAM,
  resolveDecisionState,
} from "@/lib/session/decisionMode";
import type { DecisionMode } from "@/types/session";

type GuidedFlowControllerProps = {
  initialMode: DecisionMode;
  intent: string;
  surface: string;
  guided: React.ReactNode;
  browse: React.ReactNode;
  wallLabel?: string;
  resetLabel?: string;
  browseHint?: string;
  onEnteredGuidedFlow?: (source: "url" | "session" | "default") => void;
};

export default function GuidedFlowController({
  initialMode,
  intent,
  surface,
  guided,
  browse,
  wallLabel = "Or browse individual options",
  resetLabel = "See all options",
  browseHint = "",
  onEnteredGuidedFlow,
}: GuidedFlowControllerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enteredRef = useRef(false);

  const searchKey = searchParams.toString();
  const resolved = useMemo(
    () => resolveDecisionState(intent, new URLSearchParams(searchKey)),
    [intent, searchKey],
  );
  const mode = resolved.mode || initialMode;

  useEffect(() => {
    if (resolved.mode === "guided" && !enteredRef.current) {
      enteredRef.current = true;
      onEnteredGuidedFlow?.(resolved.source);
    }

    if (resolved.mode !== "guided") {
      enteredRef.current = false;
    }
  }, [onEnteredGuidedFlow, resolved.mode, resolved.source]);

  useEffect(() => {
    document.body.classList.toggle("dcc-guided-mode", mode === "guided");
    return () => {
      document.body.classList.remove("dcc-guided-mode");
    };
  }, [mode]);

  const browseResetHref = useMemo(() => {
    const next = new URLSearchParams(searchKey);
    next.delete(DECISION_MODE_QUERY_PARAM);
    next.delete(DECISION_PATH_QUERY_PARAM);
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchKey]);

  function handleReset() {
    clearPersistedDecisionSession(intent);
    router.replace(browseResetHref, { scroll: false });
  }

  if (mode === "browse") {
    return <>{browse}</>;
  }

  return (
    <div data-guided-surface={surface} style={{ display: "grid", gap: 20 }}>
      {guided}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {wallLabel ? (
          <span
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {wallLabel}
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: 0,
            border: 0,
            background: "transparent",
            color: "rgba(186,230,253,0.82)",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.5,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          {resetLabel}
        </button>
      </section>
    </div>
  );
}
