import {
  LIVE_PULSE_SIGNAL_CATALOG,
  LIVE_PULSE_TRUST_WEIGHTS,
  type LivePulseConfidence,
  type LivePulseSignal,
} from "@/lib/dcc/livePulse/types";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function recencyWeight(signal: LivePulseSignal, now: Date): number {
  const created = new Date(signal.createdAt).getTime();
  const expires = new Date(signal.expiresAt).getTime();
  const total = Math.max(1, expires - created);
  const remaining = Math.max(0, expires - now.getTime());
  return clamp01(remaining / total);
}

function corroborationWeight(corroborationCount: number): number {
  if (corroborationCount <= 1) return 0.22;
  if (corroborationCount === 2) return 0.46;
  if (corroborationCount === 3) return 0.66;
  if (corroborationCount === 4) return 0.82;
  return 1;
}

export function deriveConfidenceLevel(
  trustTier: LivePulseSignal["trustTier"],
  corroborationCount: number
): LivePulseConfidence {
  const trustWeight = LIVE_PULSE_TRUST_WEIGHTS[trustTier] || 0.25;
  const corroboration = corroborationWeight(corroborationCount);
  const confidenceRaw = trustWeight * 0.6 + corroboration * 0.4;

  if (confidenceRaw >= 0.78) return "high";
  if (confidenceRaw >= 0.5) return "medium";
  return "low";
}

export function scoreLivePulseSignal(
  signal: LivePulseSignal,
  corroborationCount: number,
  now: Date
): number {
  const trust = LIVE_PULSE_TRUST_WEIGHTS[signal.trustTier] || 0.25;
  const catalog = LIVE_PULSE_SIGNAL_CATALOG[signal.signalType];
  const recency = recencyWeight(signal, now);
  const corroboration = corroborationWeight(corroborationCount);

  const base =
    trust * 0.34 +
    recency * 0.25 +
    catalog.severityWeight * 0.23 +
    corroboration * 0.18;

  // Bias against low-trust crowd-only noise even if recent.
  const lowTrustPenalty = signal.trustTier === "unverified" ? 0.16 : signal.trustTier === "community" ? 0.08 : 0;

  // Operational signals should outrank vibe chatter for decision support.
  const operationalBoost = catalog.category === "operational" ? 0.08 : -0.02;

  return Number(clamp01(base + operationalBoost - lowTrustPenalty).toFixed(4));
}

export function isSignalActive(signal: LivePulseSignal, now: Date): boolean {
  if (signal.status !== "active") return false;
  const start = new Date(signal.startTime).getTime();
  const end = new Date(signal.expiresAt).getTime();
  const nowMs = now.getTime();
  return start <= nowMs && end > nowMs;
}

export function defaultEndTime(createdAt: Date, signalType: LivePulseSignal["signalType"]): Date {
  const item = LIVE_PULSE_SIGNAL_CATALOG[signalType];
  return new Date(createdAt.getTime() + item.defaultDurationMinutes * 60 * 1000);
}
