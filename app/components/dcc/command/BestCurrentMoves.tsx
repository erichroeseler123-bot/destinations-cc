import { commandTone } from "@/app/components/dcc/command/commandTone";
import type { BestMoveModel } from "@/lib/dcc/command/types";

export function BestCurrentMoves({ moves }: { moves: BestMoveModel[] }) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Best current moves</div>
        <h2 className="text-2xl font-black uppercase text-white">Tactical recommendations</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {moves.map((move) => (
          <article
            key={move.id}
            className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.84),rgba(12,11,10,0.92))] p-5"
          >
            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${commandTone(move.status)}`}>
              {move.status}
            </span>
            <h3 className="mt-4 text-lg font-black uppercase text-white">{move.title}</h3>
            <p className="mt-3 text-sm text-[#f8f4ed]/72">{move.context}</p>
            <p className="mt-3 text-sm text-white">{move.recommendation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
