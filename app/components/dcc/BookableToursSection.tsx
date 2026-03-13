import Link from "next/link";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";

type BookableToursSectionProps = {
  title?: string;
  cityName: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  intents: Array<{ label: string; href: string }>;
  eyebrow?: string;
  className?: string;
};

export default function BookableToursSection({
  title = "Book Tours & Activities",
  cityName,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  intents,
  eyebrow = "Bookable Tours",
  className = "",
}: BookableToursSectionProps) {
  return (
    <section className={`rounded-3xl border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)] ${className}`.trim()}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">{eyebrow}</p>
            <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
            <p className="max-w-2xl text-zinc-200">
              {description ||
                `Use DCC to find the right ${cityName} experience fast, then book securely via Viator.`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {intents.slice(0, 6).map((intent) => (
              <Link
                key={`${intent.label}:${intent.href}`}
                href={intent.href}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-zinc-100 hover:bg-white/10"
              >
                {intent.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">Ready to book?</p>
              <p className="mt-1 text-sm text-zinc-300">
                Browse live categories, compare options, and continue to secure checkout with Viator.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400"
              >
                {primaryLabel}
              </Link>
              {secondaryLabel && secondaryHref ? (
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>

            <PoweredByViator
              compact
              disclosure
              body={`DCC helps you decide. Viator helps you book ${cityName} tours, activities, and excursions with secure checkout.`}
              className="bg-white/5"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
