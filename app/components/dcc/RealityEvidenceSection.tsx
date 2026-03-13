export type RealityEvidenceItem = {
  title: string;
  url: string;
  source: string;
  type: "video" | "photo" | "map" | "satellite" | "webcam" | "official-notice" | "traveler-tip";
  whyItMatters: string;
  timestamp?: string;
  tags?: string[];
};

type Props = {
  title?: string;
  intro?: string;
  summaryPoints?: string[];
  items: RealityEvidenceItem[];
  disclaimer?: string;
};

function formatTypeLabel(type: RealityEvidenceItem["type"]) {
  return type.replace(/-/g, " ");
}

export default function RealityEvidenceSection({
  title = "Reality Check",
  intro = "Use recent evidence to compare marketing claims against what the place or route actually feels like on the ground.",
  summaryPoints = [],
  items,
  disclaimer = "Illustrative reference only. Conditions vary by date, operator, weather, crowd level, and seasonal changes.",
}: Props) {
  if (!items.length) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Reality Check</p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm text-zinc-400">{intro}</p>

      {summaryPoints.length ? (
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-200">What people get wrong</p>
          <ul className="mt-3 space-y-2 text-sm text-amber-50">
            {summaryPoints.map((point) => (
              <li key={point}>• {point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <a
            key={`${item.url}:${item.title}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.source}</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                {formatTypeLabel(item.type)}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{item.title}</h3>
            <p className="mt-3 text-sm text-zinc-300">{item.whyItMatters}</p>
            {item.timestamp ? <p className="mt-3 text-xs text-amber-200">Jump point: {item.timestamp}</p> : null}
            {item.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={`${item.url}:${tag}`}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-4 text-sm font-semibold text-cyan-200">Open evidence →</p>
          </a>
        ))}
      </div>

      <p className="mt-5 text-xs text-zinc-500">{disclaimer}</p>
    </section>
  );
}
