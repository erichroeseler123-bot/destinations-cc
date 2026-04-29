"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishMissionAction } from "@/app/dashboard/actions";

type PublishMissionButtonProps = {
  missionId: string;
  existingPath?: string | null;
};

export function PublishMissionButton({ missionId, existingPath }: PublishMissionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function handlePublish() {
    setMessage("Publishing to network...");

    try {
      const result = await publishMissionAction(missionId);

      if (!result.ok) {
        throw new Error(result.error);
      }

      setMessage("Published to live feed. Refreshing mission state.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handlePublish()}
        className="inline-flex min-h-11 items-center rounded-full border border-emerald-300/35 bg-emerald-500/14 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-emerald-50 transition hover:bg-emerald-500/22 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Publish To Network
      </button>
      {existingPath ? (
        <a
          href={existingPath}
          className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/10"
        >
          Open Live Feed
        </a>
      ) : null}
      {message ? <div className="text-sm text-zinc-400">{message}</div> : null}
    </div>
  );
}
