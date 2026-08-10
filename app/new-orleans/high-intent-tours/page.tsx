import Link from "next/link";

export const metadata = {
  title: "Plan New Orleans Tours by Time, Group & Transportation",
  description: "Choose New Orleans tours based on the decision you actually need to make: time available, family format, transportation, cruise timing, swamp format or combination day trips.",
};

const links = [
  ["/things-to-do-in-new-orleans-today", "Things to do today"],
  ["/new-orleans-tours-tonight", "Tours tonight"],
  ["/4-hours-in-new-orleans", "Only have about four hours"],
  ["/first-time-new-orleans-tours", "First-time visitors"],
  ["/new-orleans-tours-for-families", "Tours for families"],
  ["/best-swamp-tour-with-transportation", "Swamp tours with transportation"],
  ["/new-orleans-tours-with-transportation", "Tours where transportation matters"],
  ["/new-orleans-plantation-and-swamp-tour", "Plantation + swamp combinations"],
  ["/things-to-do-before-a-cruise-new-orleans", "Before a cruise"],
  ["/things-to-do-after-a-cruise-new-orleans", "After a cruise"],
] as const;

export default function Page() {
  return <div className="min-h-screen bg-[var(--nola-bg-charcoal)] px-6 py-16 text-[var(--nola-ivory)]">
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--nola-gold)]">Start with your real constraint</p>
      <h1 className="mt-4 max-w-4xl font-serif text-4xl md:text-6xl">Pick a New Orleans tour based on the decision you need to make</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--nola-text-muted)]">You do not need another giant list of attractions. Start with how much time you have, who is with you, whether transportation matters, and whether you are trying to fit New Orleans around a cruise.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {links.map(([href, label]) => <Link key={href} href={href} className="border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-5 text-lg hover:border-[var(--nola-gold)]">{label} <span aria-hidden="true">→</span></Link>)}
      </div>
    </div>
  </div>;
}
