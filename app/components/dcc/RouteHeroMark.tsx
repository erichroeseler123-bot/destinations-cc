type RouteHeroMarkProps = {
  eyebrow: string;
  title: string;
  tone?: "cyan" | "amber" | "emerald";
};

function toneClasses(tone: "cyan" | "amber" | "emerald") {
  if (tone === "amber") {
    return {
      ringA: "#f59e0b",
      ringB: "#fbbf24",
      dot: "#fbbf24",
    };
  }
  if (tone === "emerald") {
    return {
      ringA: "#10b981",
      ringB: "#34d399",
      dot: "#34d399",
    };
  }
  return {
    ringA: "#06b6d4",
    ringB: "#22d3ee",
    dot: "#22d3ee",
  };
}

export default function RouteHeroMark({
  eyebrow,
  title,
  tone = "cyan",
}: RouteHeroMarkProps) {
  const palette = toneClasses(tone);

  return (
    <div className="dcc-mark-pulse dcc-hero-enter inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.45)]">
      <svg viewBox="0 0 72 72" className="h-11 w-11" aria-hidden>
        <defs>
          <linearGradient id={`routeRing-${tone}`} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor={palette.ringA} />
            <stop offset="100%" stopColor={palette.ringB} />
          </linearGradient>
        </defs>
        <circle cx="36" cy="36" r="30" fill="none" stroke={`url(#routeRing-${tone})`} strokeWidth="4" />
        <path d="M18 44L30 30L40 38L54 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="54" cy="24" r="4" fill={palette.dot} />
      </svg>
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-300">{eyebrow}</p>
        <p className="text-base font-black leading-none text-white sm:text-lg">{title}</p>
      </div>
    </div>
  );
}
