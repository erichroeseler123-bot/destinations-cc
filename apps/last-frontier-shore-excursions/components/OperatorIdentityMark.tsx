import React from "react";

const STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "&",
  "in",
  "at",
  "to",
  "for",
  "company",
  "corp",
  "corporation",
  "llc",
  "inc",
]);

export function deriveOperatorInitials(name: string): string {
  const cleaned = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Za-z0-9\s-]/g, " ")
    .trim();
  const tokens = cleaned
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t.toLowerCase()));

  if (tokens.length === 0) {
    return (cleaned.slice(0, 2) || "AK").toUpperCase();
  }
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
}

export interface OperatorIdentityMarkProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Intentionally neutral 1–2 letter maritime-alpine editorial monogram.
 * Never claims or mimics an official company trademark/logo.
 */
export function OperatorIdentityMark({
  name,
  size = "md",
}: OperatorIdentityMarkProps) {
  const initials = deriveOperatorInitials(name);
  return (
    <span
      className={`lfse-operator-monogram lfse-operator-monogram--${size}`}
      aria-hidden="true"
      data-testid="operator-identity-mark"
    >
      <span className="lfse-operator-monogram-inner">{initials}</span>
    </span>
  );
}
