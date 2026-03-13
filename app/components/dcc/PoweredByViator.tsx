"use client";

type PoweredByViatorProps = {
  title?: string;
  body?: string;
  bullets?: string[];
  disclosure?: boolean;
  compact?: boolean;
  className?: string;
};

const DEFAULT_TITLE = "Powered by Viator";
const DEFAULT_BODY =
  "DCC helps you find the best tours, activities, and excursions for your trip. When you're ready to book, you can book with DCC via Viator, a trusted tour and activities partner with years of experience in the travel industry, secure checkout, and a broad range of experiences worldwide.";

export default function PoweredByViator({
  title = DEFAULT_TITLE,
  body = DEFAULT_BODY,
  bullets,
  disclosure = false,
  compact = false,
  className = "",
}: PoweredByViatorProps) {
  return (
    <section
      className={`rounded-2xl border border-emerald-400/20 bg-emerald-500/5 ${compact ? "p-4" : "p-6"} ${className}`.trim()}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">{title}</p>
      <p className={`mt-2 text-zinc-200 ${compact ? "text-sm" : "text-base"}`}>{body}</p>

      {bullets?.length ? (
        <ul className="mt-4 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      {disclosure ? (
        <p className="mt-4 text-xs text-zinc-400">
          DCC may earn a commission if you book through partner links, at no extra cost to you.
        </p>
      ) : null}
    </section>
  );
}
