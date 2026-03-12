import Link from "next/link";
import type { PageAction } from "@/src/lib/page-actions";

export default function PageActionBar({
  title = "Plan this stop",
  actions,
}: {
  title?: string;
  actions: PageAction[];
}) {
  if (!actions.length) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/12 bg-white/6 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Action stack</p>
          <h2 className="mt-2 text-xl font-bold text-white">{title}</h2>
        </div>
        <nav aria-label={title} className="flex flex-wrap gap-3">
          {actions.map((action) =>
            action.kind === "external" ? (
              <a
                key={`${action.label}-${action.href}`}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center rounded-full border border-white/12 bg-black/25 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/12"
                aria-label={action.label}
              >
                {action.label}
              </a>
            ) : (
              <Link
                key={`${action.label}-${action.href}`}
                href={action.href}
                className="inline-flex items-center rounded-full border border-white/12 bg-black/25 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/12"
                aria-label={action.label}
              >
                {action.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </section>
  );
}
