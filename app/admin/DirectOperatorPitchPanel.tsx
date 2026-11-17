"use client";

import { useState } from "react";
import {
  DIRECT_OPERATOR_ONBOARDING_URL,
  JUNEAU_TOURS_ONBOARDING_REFERENCE,
  SOUTHEAST_ALASKA_OPERATOR_ONBOARDING_KITS,
  THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS,
} from "@/lib/dcc/commerce/directOperatorActivationKit";

export default function DirectOperatorPitchPanel() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <section
      data-testid="direct-operator-pitch-panel"
      aria-labelledby="direct-operator-pitch-heading"
      className="space-y-5 rounded-2xl border border-emerald-400/30 bg-white/[0.03] p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Turnkey 10% Direct Operator Activation Kits (Juneau · New Orleans · Colorado Transportation)
          </div>
          <h2
            id="direct-operator-pitch-heading"
            className="mt-1 text-2xl font-black text-white"
          >
            1-Click Copy Outreach Pitches &amp; Self-Serve Portal Link
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-300">
            <strong>Zero automatic emails are ever sent.</strong> Copy any flagship
            pitch below when ready to reach out manually, or share the public
            onboarding portal where operators apply into{" "}
            <code>pending_review</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              copyText("portal-url", DIRECT_OPERATOR_ONBOARDING_URL)
            }
            className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 font-bold text-emerald-100 hover:bg-emerald-500/25"
          >
            {copiedKey === "portal-url"
              ? "Copied Onboarding Link!"
              : "Copy /partners/direct-operators URL"}
          </button>
          <a
            href="/partners/direct-operators"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 font-semibold text-zinc-200 hover:bg-white/10"
          >
            Preview Portal ↗
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-zinc-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Live Onboarding Proof Point · {JUNEAU_TOURS_ONBOARDING_REFERENCE.operatorName}
            </span>
            <p className="mt-1 text-zinc-300">
              All Southeast Alaska operator templates below cite our live{" "}
              <strong>{JUNEAU_TOURS_ONBOARDING_REFERENCE.operatorName}</strong> Rezgo
              integration (Operator MoR, supplier-hosted checkout, 10% completed
              non-refunded invoicing, $0 weather/refund fee).
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              copyText(
                "jt-example-url",
                JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl,
              )
            }
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 font-bold text-emerald-100 hover:bg-emerald-500/30"
          >
            {copiedKey === "jt-example-url"
              ? "Copied Juneau Tours Link!"
              : "Copy Juneau Tours Example URL"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS.map((kit) => (
          <div
            key={kit.id}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  {kit.destinationPort} · {kit.bookingSystem}
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-200">
                  {kit.proposedDirectRatePercent}% Direct /{" "}
                  {kit.proposedMachineRatePercent}% Machine · $0 Weather Fee
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                {kit.operatorName}
              </h3>
              <p className="text-xs text-zinc-400">{kit.corridorLabel}</p>
              <div className="text-[11px] text-zinc-300">
                <span className="font-semibold text-zinc-200">Flagship SKUs:</span>{" "}
                {kit.flagshipSkus.join(" · ")}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-zinc-300">
                <div className="font-bold text-zinc-200">Subject:</div>
                <div className="mt-0.5 font-mono text-[11px] text-cyan-200">
                  {kit.emailSubject}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    `${kit.id}-full`,
                    `Subject: ${kit.emailSubject}\n\n${kit.emailBody}`,
                  )
                }
                className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/25"
              >
                {copiedKey === `${kit.id}-full`
                  ? "Copied Subject + Body!"
                  : "Copy Full Pitch"}
              </button>
              <button
                type="button"
                onClick={() => copyText(`${kit.id}-subject`, kit.emailSubject)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
              >
                {copiedKey === `${kit.id}-subject`
                  ? "Copied Subject"
                  : "Copy Subject"}
              </button>
              <button
                type="button"
                onClick={() => copyText(`${kit.id}-body`, kit.emailBody)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
              >
                {copiedKey === `${kit.id}-body` ? "Copied Body" : "Copy Body"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-white/10 pt-5">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
          Southeast Alaska Canonical Profile + Direct Onboarding Templates ({SOUTHEAST_ALASKA_OPERATOR_ONBOARDING_KITS.length} Copy-Only Drafts)
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {SOUTHEAST_ALASKA_OPERATOR_ONBOARDING_KITS.map((kit) => (
            <div
              key={kit.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <div className="space-y-1.5">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  {kit.portsLabel} · {kit.bookingPlatform}
                </div>
                <h3 className="text-base font-black text-white">{kit.operatorName}</h3>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-zinc-300">
                  <div className="font-bold text-zinc-200">Subject:</div>
                  <div className="mt-0.5 font-mono text-[11px] text-cyan-200">
                    {kit.emailSubject}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      `${kit.id}-full`,
                      `Subject: ${kit.emailSubject}\n\n${kit.emailBody}`,
                    )
                  }
                  className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/25"
                >
                  {copiedKey === `${kit.id}-full`
                    ? "Copied Subject + Body!"
                    : "Copy Full Pitch"}
                </button>
                <a
                  href={kit.canonicalProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                >
                  Profile ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
