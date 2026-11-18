import React from "react";
import { VERIFIED_OPERATORS, type OperatorKey } from "@/lib/verifiedOperatorPricing";

export interface OperatorIdentityMarkProps {
  operator: OperatorKey;
  size?: "sm" | "md";
  tone?: "dark" | "light";
}

/**
 * Neutral typographic monogram badge (`TH`, `CH`, `NT`, `WA`, `JT`, `TA`).
 * Strictly typographic—never imitates or reproduces proprietary operator logos.
 */
export default function OperatorIdentityMark({
  operator,
  size = "md",
  tone = "dark",
}: OperatorIdentityMarkProps) {
  const info = VERIFIED_OPERATORS[operator];
  const px = size === "sm" ? 28 : 34;
  const fontSize = size === "sm" ? "0.68rem" : "0.74rem";

  return (
    <span
      aria-hidden="true"
      title={`${info.name} (independent editorial reference)`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
        flexShrink: 0,
        borderRadius: 8,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize,
        fontWeight: 800,
        letterSpacing: "0.06em",
        background:
          tone === "light"
            ? "rgba(7, 22, 38, 0.9)"
            : "rgba(158, 217, 255, 0.12)",
        border:
          tone === "light"
            ? "1px solid rgba(7, 22, 38, 0.2)"
            : "1px solid rgba(158, 217, 255, 0.32)",
        color: tone === "light" ? "#f6dca6" : "#e0f2fe",
        userSelect: "none",
      }}
    >
      {info.monogram}
    </span>
  );
}
