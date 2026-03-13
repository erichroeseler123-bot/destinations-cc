import Image from "next/image";
import Link from "next/link";
import type { Next48Item } from "@/lib/dcc/next48/types";

type Props = {
  item: Next48Item;
};

function formatStart(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Check time";
  return dt.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function categoryLabel(value: Next48Item["category"]): string {
  if (value === "nightlife") return "Nightlife";
  if (value === "concerts") return "Concert";
  if (value === "sports") return "Sports";
  if (value === "festivals") return "Festival";
  return "Tour";
}

export default function Next48Card({ item }: Props) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/90 overflow-hidden">
      <div className="relative h-36 w-full">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-cyan-300">
          <span>{categoryLabel(item.category)}</span>
          <span className="text-zinc-500">{formatStart(item.startAt)}</span>
        </div>

        <h4 className="text-base font-semibold text-white leading-snug">{item.title}</h4>
        <p className="text-sm text-zinc-300">{item.venueOrArea}</p>
        <p className="text-sm text-zinc-300">{item.whyItMatters}</p>

        <div className="space-y-2 pt-1">
          {item.authorityCta.kind === "internal" ? (
            <Link
              href={item.authorityCta.href}
              className="block w-full rounded-xl bg-cyan-500 px-4 py-2 text-center text-sm font-semibold text-black"
            >
              {item.authorityCta.label}
            </Link>
          ) : (
            <a
              href={item.authorityCta.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block w-full rounded-xl bg-cyan-500 px-4 py-2 text-center text-sm font-semibold text-black"
            >
              {item.authorityCta.label}
            </a>
          )}

          {item.executionCta ? (
            item.executionCta.kind === "internal" ? (
              <Link
                href={item.executionCta.href}
                className="block w-full rounded-xl border border-white/15 px-4 py-2 text-center text-sm font-semibold text-zinc-100"
              >
                {item.executionCta.label}
              </Link>
            ) : (
              <a
                href={item.executionCta.href}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="block w-full rounded-xl border border-white/15 px-4 py-2 text-center text-sm font-semibold text-zinc-100"
              >
                {item.executionCta.label}
              </a>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
