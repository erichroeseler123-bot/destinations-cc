import type { PublicMaterialChangeEntry } from "@/lib/dcc/stewardship";

interface PublicMaterialChangeTimelineProps {
  entries: PublicMaterialChangeEntry[];
}

export default function PublicMaterialChangeTimeline({
  entries,
}: PublicMaterialChangeTimelineProps) {
  if (!entries.length) return null;

  return (
    <section
      aria-label="Evidence Steward Material Change Timeline"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
      data-testid="public-material-change-timeline"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Evidence Steward Ledger · Public Material Change Timeline
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Neutral audit log of factual claim reviews. Stewards update underlying claim evidence; the deterministic engine recalculates corridor outcomes.
          </p>
        </div>
        <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-mono text-zinc-300">
          {entries.length} Verified Ledger {entries.length === 1 ? "Entry" : "Entries"}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {entries.map((entry) => (
          <div
            key={entry.entryId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs"
            data-entry-id={entry.entryId}
            data-template-code={entry.publicSummaryTemplateCode}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-200">
                  {entry.publicSummaryTemplateCode}
                </span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {entry.resolvedClaimId}
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-100">
                {entry.renderedPublicSummary}
              </p>
            </div>

            <div className="text-right text-[11px] text-zinc-400">
              <p className="font-semibold text-zinc-200">{entry.auditedByRole}</p>
              <p>{entry.auditTimestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
