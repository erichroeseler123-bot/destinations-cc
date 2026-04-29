"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signalMissionAction } from "@/app/dashboard/actions";

type ApprovalPanelProps = {
  missionId: string;
  eventName: string;
};

type PanelState =
  | { tone: "idle"; message: string }
  | { tone: "error"; message: string }
  | { tone: "success"; message: string };

export function ApprovalPanel({ missionId, eventName }: ApprovalPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [panelState, setPanelState] = useState<PanelState>({
    tone: "idle",
    message: `EarthOS is paused on ${eventName}. Review the briefing below before resuming the mission.`,
  });

  async function handleSignal(decision: "approve" | "reject" | "cancel") {
    setPanelState({
      tone: "idle",
      message:
        decision === "approve"
          ? "Sending approval signal..."
          : decision === "reject"
            ? "Sending rejection signal..."
            : "Terminating mission...",
    });

    const body =
      decision === "cancel"
        ? { event: "mission-cancel" as const }
        : {
            event: "erich-approval" as const,
            payload: {
              approved: decision === "approve",
            },
    };

    try {
      const result = await signalMissionAction(missionId, body.event, body.payload);

      if (!result.ok) {
        throw new Error(result.error);
      }

      setPanelState({
        tone: "success",
        message:
          decision === "approve"
            ? "Mission approved. Refreshing mission state."
            : decision === "reject"
              ? "Mission rejected. Refreshing mission state."
              : "Mission terminated. Refreshing mission state.",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setPanelState({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to send signal.",
      });
    }
  }

  return (
    <section className="mt-8 rounded-[1.6rem] border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
      <div className="text-[11px] font-black uppercase tracking-[0.24em]">Operator Action Required</div>
      <h2 className="mt-2 text-2xl font-black">Approval panel</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/80">
        This mission is paused at a durable checkpoint and is waiting on{" "}
        <code className="rounded bg-amber-300/15 px-1 py-0.5 text-amber-100">{eventName}</code>.
      </p>

      <div
        className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
          panelState.tone === "error"
            ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
            : panelState.tone === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-amber-300/20 bg-black/10 text-amber-50/90"
        }`}
      >
        {panelState.message}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => void handleSignal("approve")}
          className="inline-flex min-h-11 items-center rounded-full bg-[#f5c66c] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#120f0b] transition hover:bg-[#ffd989] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve & Resume
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => void handleSignal("reject")}
          className="inline-flex min-h-11 items-center rounded-full border border-amber-300/35 bg-transparent px-6 py-3 text-sm font-bold text-amber-50 transition hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => void handleSignal("cancel")}
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-zinc-300 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Terminate Mission
        </button>
      </div>
    </section>
  );
}
