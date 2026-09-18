import "server-only";

import { Resend } from "resend";

export type ResolvedResendKey = {
  key: string;
  source: "DCC_RESEND_API_KEY" | "RESEND_API_KEY";
};

/**
 * Clean, explicit resolution of the Resend API key.
 * Checks DCC_RESEND_API_KEY first (primary integration key), then RESEND_API_KEY.
 */
export function getResendApiKey(): ResolvedResendKey | null {
  const dccKey = process.env.DCC_RESEND_API_KEY?.trim();
  if (dccKey) {
    return { key: dccKey, source: "DCC_RESEND_API_KEY" };
  }

  const standardKey = process.env.RESEND_API_KEY?.trim();
  if (standardKey) {
    return { key: standardKey, source: "RESEND_API_KEY" };
  }

  return null;
}

export function createResendClient(): { resend: Resend; source: "DCC_RESEND_API_KEY" | "RESEND_API_KEY" } | null {
  const resolved = getResendApiKey();
  if (!resolved) return null;
  return {
    resend: new Resend(resolved.key),
    source: resolved.source,
  };
}
