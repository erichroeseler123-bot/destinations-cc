import Link from "next/link";
import {
  PUBLIC_ATLAS_STATUS_COPY,
  PUBLIC_ATLAS_STATUS_LABELS,
  type PublicAtlasNode,
} from "@/lib/earthos/publicAtlas";

function AtlasIcon({ type }: { type: "arrow" | "globe" | "pin" }) {
  if (type === "arrow") {
    return (
      <svg viewBox="0 0 24 24" className="ml-2 h-3.5 w-3.5" aria-hidden>
        <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "globe") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 12h16M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8M12 4c-2 2.2-3 4.9-3 8s1 5.8 3 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="9" r="2.4" fill="currentColor" />
    </svg>
  );
}

const statusTone: Record<PublicAtlasNode["public_status"], string> = {
  live: "border-emerald-300/35 bg-emerald-300/12 text-emerald-100",
  building: "border-cyan-300/35 bg-cyan-300/12 text-cyan-100",
  field_test: "border-amber-300/35 bg-amber-300/12 text-amber-100",
  future_target: "border-white/18 bg-white/[0.06] text-white/76",
  fallback_market: "border-[#ff9f6e]/35 bg-[#ff9f6e]/12 text-[#ffd2bd]",
};

export function PublicAtlasStatusBadge({ status }: { status: PublicAtlasNode["public_status"] }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone[status]}`}>
      {PUBLIC_ATLAS_STATUS_LABELS[status]}
    </span>
  );
}

export default function PublicAtlasNodeCard({
  node,
  compact = false,
}: {
  node: PublicAtlasNode;
  compact?: boolean;
}) {
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PublicAtlasStatusBadge status={node.public_status} />
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/52">
              {node.node_type.replace(/_/g, " ")}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{node.public_label}</h3>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#f5c66c]/25 bg-[#f5c66c]/10 text-[#f5c66c]">
          <AtlasIcon type="pin" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-white/72">{node.public_description}</p>

      {!compact ? (
        <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/42">
            <AtlasIcon type="globe" />
            Public context
          </div>
          <p className="mt-2 text-sm leading-6 text-white/64">{PUBLIC_ATLAS_STATUS_COPY[node.public_status]}</p>
          <p className="mt-2 text-xs leading-5 text-white/44">{node.disclaimer}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold text-white/48">{node.related_domain}</div>
        <Link
          href={node.public_cta_href}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#f5c66c]/25 bg-[#f5c66c]/12 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#ffe4a3] transition hover:bg-[#f5c66c] hover:text-[#120f0b]"
        >
          {node.public_cta_label}
          <AtlasIcon type="arrow" />
        </Link>
      </div>
    </article>
  );
}
