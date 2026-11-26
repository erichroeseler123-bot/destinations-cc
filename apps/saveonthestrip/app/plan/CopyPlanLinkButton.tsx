"use client";

import { useState } from "react";

export function CopyPlanLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="button button-secondary"
      style={{ cursor: "pointer" }}
    >
      {copied ? "Share link copied" : "Copy shareable plan link"}
    </button>
  );
}
