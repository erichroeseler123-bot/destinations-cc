import React from "react";
import { computeOperatorMonogramInitials } from "../lib/wtnoDirectoryHelpers";

export interface OperatorIdentityMarkProps {
  name: string;
  size?: "sm" | "md" | "lg";
  variant?: "on-light" | "on-dark" | "overlay";
}

/**
 * Neutral typographic monogram (1–2 uppercase initials inside a warm
 * cypress-and-brass geometric badge). Intentionally never mimics an official
 * operator trademark or company logo.
 */
export default function OperatorIdentityMark({
  name,
  size = "md",
  variant = "on-light",
}: OperatorIdentityMarkProps) {
  const initials = computeOperatorMonogramInitials(name);

  return (
    <span
      aria-hidden="true"
      data-testid="operator-identity-mark"
      data-size={size}
      data-variant={variant}
      className={`wno-operator-monogram wno-operator-monogram-${size} wno-operator-monogram-${variant}`}
    >
      <span className="wno-operator-monogram-inner">{initials}</span>
    </span>
  );
}
