"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { persistDecisionSession } from "../../../lib/session/decisionMode";
import type { UserSession } from "../../../types/session";

type CertaintyMetrics = {
  timeToClickMs: number;
  scrollDepth: number;
};

type CertaintyBlockProps = {
  surface: string;
  eyebrow?: string;
  verdict: string;
  title: string;
  paragraphs: string[];
  proofChips: string[];
  ctaLabel: string;
  href: string;
  microcopy?: string;
  sessionContext: UserSession["context"];
  theme?: "swamp" | "juneau";
  onCtaClick?: (metrics: CertaintyMetrics) => void;
};

const THEMES = {
  swamp: {
    border: "rgba(134,239,172,0.26)",
    bg: "linear-gradient(180deg, rgba(8,18,14,0.96), rgba(7,12,18,0.96))",
    verdictBg: "rgba(134,239,172,0.12)",
    verdictText: "#d9f99d",
    accentBg: "#7dd3fc",
    accentText: "#071018",
  },
  juneau: {
    border: "rgba(125,211,252,0.26)",
    bg: "linear-gradient(180deg, rgba(9,15,31,0.96), rgba(7,11,25,0.96))",
    verdictBg: "rgba(125,211,252,0.12)",
    verdictText: "#bae6fd",
    accentBg: "#7dd3fc",
    accentText: "#071018",
  },
} as const;

function getScrollDepth() {
  if (typeof window === "undefined") return 0;
  const doc = document.documentElement;
  const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(100, Math.round((window.scrollY / scrollable) * 100)));
}

export default function CertaintyBlock({
  surface,
  eyebrow = "Handled path",
  verdict,
  title,
  paragraphs,
  proofChips,
  ctaLabel,
  href,
  microcopy,
  sessionContext,
  theme = "juneau",
  onCtaClick,
}: CertaintyBlockProps) {
  const startedAtRef = useRef<number>(0);
  const palette = useMemo(() => THEMES[theme], [theme]);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  function handleClick() {
    persistDecisionSession({
      decisionMode: "guided",
      context: sessionContext,
    });

    onCtaClick?.({
      timeToClickMs: Math.max(0, Date.now() - (startedAtRef.current || Date.now())),
      scrollDepth: getScrollDepth(),
    });
  }

  return (
    <section
      data-certainty-surface={surface}
      style={{
        borderRadius: 30,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
        padding: "22px 20px",
        display: "grid",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "fit-content",
          minHeight: 34,
          borderRadius: 999,
          padding: "0 14px",
          fontSize: 11,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          background: palette.verdictBg,
          color: palette.verdictText,
        }}
      >
        {verdict}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(1.9rem, 5vw, 3.2rem)",
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
            color: "white",
          }}
        >
          {title}
        </h2>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {proofChips.map((chip) => (
          <span
            key={chip}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <Link
          href={href}
          onClick={handleClick}
          data-cta="certainty-primary"
          data-surface={surface}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 58,
            width: "100%",
            borderRadius: 999,
            padding: "0 24px",
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: palette.accentText,
            background: palette.accentBg,
            boxShadow: "0 18px 45px rgba(125,211,252,0.18)",
          }}
        >
          {ctaLabel}
        </Link>
        {microcopy ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.62)",
              textAlign: "center",
            }}
          >
            {microcopy}
          </p>
        ) : null}
      </div>
    </section>
  );
}
