"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PlanningLink = { href: string; label: string };

const HOME_LINKS: PlanningLink[] = [
  { href: "/guides/plan-new-orleans-tours", label: "Plan my trip" },
  { href: "/guides/things-to-do-in-new-orleans-today", label: "Today" },
  { href: "/guides/one-day-in-new-orleans-tours", label: "One day" },
  { href: "/guides/first-time-new-orleans-tours", label: "First visit" },
];

const CATEGORY_LINKS: Record<string, PlanningLink[]> = {
  "/city-tours": [
    { href: "/guides/city-tour-vs-swamp-tour-new-orleans", label: "City tour vs swamp tour" },
    { href: "/guides/first-time-new-orleans-tours", label: "Best starting points for a first visit" },
    { href: "/guides/4-hours-in-new-orleans", label: "Tour planning with about four hours" },
  ],
  "/swamp-tours": [
    { href: "/guides/best-new-orleans-swamp-tour", label: "Best swamp tour for your group" },
    { href: "/compare/covered-swamp-boat-vs-airboat", label: "Covered boat vs airboat" },
    { href: "/airboat-tours", label: "Browse airboat tour formats" },
    { href: "/covered-swamp-boat-tours", label: "Browse covered swamp boats" },
    { href: "/guides/how-far-are-swamp-tours-from-new-orleans", label: "How far are the swamps?" },
    { href: "/guides/new-orleans-without-a-car", label: "Planning without a car" },
    { href: "/guides/best-swamp-tour-with-transportation", label: "Swamp tours with transportation" },
  ],
  "/plantation-tours": [
    { href: "/compare/whitney-vs-oak-alley", label: "Whitney vs Oak Alley" },
    { href: "/guides/whitney-plantation-tour-from-new-orleans", label: "Whitney from New Orleans" },
    { href: "/guides/oak-alley-plantation-tour-from-new-orleans", label: "Oak Alley from New Orleans" },
  ],
  "/jazz-music-tours": [
    { href: "/guides/jazz-cruise-dinner-or-sightseeing", label: "Dinner, jazz or sightseeing cruise?" },
    { href: "/guides/daytime-vs-evening-jazz-cruise-new-orleans", label: "Daytime vs evening jazz cruise" },
    { href: "/guides/tonight", label: "What fits tonight" },
    { href: "/riverboat-cruises", label: "Compare river cruises" },
  ],
  "/tours": [
    { href: "/guides/plan-new-orleans-tours", label: "Plan by need instead of browsing everything" },
    { href: "/guides/new-orleans-morning-tours", label: "Morning tour options" },
    { href: "/guides/new-orleans-afternoon-tours", label: "Afternoon tour options" },
    { href: "/guides/new-orleans-tours-tonight", label: "Tonight" },
  ],
};

const PRODUCT_GUIDES: Record<string, PlanningLink[]> = {
  "city-tour-of-new-orleans": [
    { href: "/guides/city-tour-vs-swamp-tour-new-orleans", label: "Compare city tour vs swamp tour" },
    { href: "/guides/first-time-new-orleans-tours", label: "First-time visitor planning" },
  ],
  "covered-tour-boat": [
    { href: "/compare/covered-swamp-boat-vs-airboat", label: "Compare covered boat vs airboat" },
    { href: "/guides/best-swamp-tour-with-transportation", label: "Swamp transportation planning" },
  ],
  "ragin-cajun-airboat-options": [
    { href: "/compare/covered-swamp-boat-vs-airboat", label: "Compare airboat vs covered boat" },
    { href: "/guides/can-kids-ride-airboats-new-orleans", label: "Airboats with kids" },
  ],
  "daytime-jazz-cruise": [
    { href: "/guides/daytime-vs-evening-jazz-cruise-new-orleans", label: "Daytime vs evening jazz cruise" },
    { href: "/guides/new-orleans-afternoon-tours", label: "Afternoon planning" },
  ],
  "evening-jazz-cruise": [
    { href: "/guides/daytime-vs-evening-jazz-cruise-new-orleans", label: "Daytime vs evening jazz cruise" },
    { href: "/guides/new-orleans-tours-for-couples", label: "Ideas for couples" },
  ],
  "whitney-plantation-tour": [
    { href: "/guides/whitney-plantation-tour-from-new-orleans", label: "Plan Whitney from New Orleans" },
    { href: "/compare/whitney-vs-oak-alley", label: "Whitney vs Oak Alley" },
  ],
  "oak-alley-plantation-tour-grey-line": [
    { href: "/guides/oak-alley-plantation-tour-from-new-orleans", label: "Plan Oak Alley from New Orleans" },
    { href: "/compare/whitney-vs-oak-alley", label: "Oak Alley vs Whitney" },
  ],
  "craft-cocktail-walking-tour": [
    { href: "/guides/new-orleans-bachelorette-party-tours", label: "Bachelorette group planning" },
    { href: "/guides/new-orleans-tours-for-couples", label: "Ideas for couples" },
  ],
  "ghosts-spirits-walking-tour": [
    { href: "/guides/new-orleans-bachelorette-party-tours", label: "Bachelorette group planning" },
    { href: "/guides/new-orleans-tours-tonight", label: "Compare tonight's options" },
  ],
};

function resolveLinks(pathname: string): PlanningLink[] | null {
  if (pathname === "/") return HOME_LINKS;
  if (CATEGORY_LINKS[pathname]) return CATEGORY_LINKS[pathname];
  if (pathname.startsWith("/tours/")) {
    const slug = pathname.split("/")[2] || "";
    return PRODUCT_GUIDES[slug] || [
      { href: "/guides/plan-new-orleans-tours", label: "Plan by time, group or transportation" },
      { href: "/compare", label: "Compare tour options" },
    ];
  }
  return null;
}

export default function ContextualPlanningPaths() {
  const pathname = usePathname();
  const links = resolveLinks(pathname);
  if (!links) return null;

  if (pathname === "/") {
    return (
      <aside className="border-y border-[#3a2b17] bg-[#0d0a0d] px-6 py-4 text-[#fdfbf7]" aria-label="Planning help">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-baseline gap-3">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Not sure yet?</p>
            <p className="font-serif text-lg text-[#f3eadc]">Pick a planning shortcut.</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Homepage planning shortcuts">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-10 items-center gap-2 border border-white/10 bg-white/[0.025] px-4 py-2 text-xs font-semibold text-[#e8dfd0] transition hover:border-[#d4af37]/70 hover:bg-[#d4af37]/[0.05] hover:text-white"
              >
                {link.label}<span className="text-[#d4af37]">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <aside className="border-t border-[#3a2b17] bg-[linear-gradient(180deg,#120d12,#0c090c)] px-6 py-7 text-[#fdfbf7]" aria-label="Planning help">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Still deciding?</p>
            <h2 className="mt-1 font-serif text-xl leading-tight md:text-2xl">Use the guide that matches your trip</h2>
          </div>
          <Link href="/guides/plan-new-orleans-tours" className="text-xs font-bold uppercase tracking-[0.08em] text-[#d4af37] hover:text-white">All planning paths →</Link>
        </div>
        <div className={`mt-4 grid gap-2 ${links.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex min-h-14 items-center justify-between gap-3 border border-white/10 bg-white/[0.025] px-4 py-3 text-sm leading-5 transition hover:-translate-y-0.5 hover:border-[#d4af37]/70 hover:bg-[#d4af37]/[0.05]"
            >
              <span>{link.label}</span>
              <span className="shrink-0 text-[#d4af37] transition group-hover:translate-x-0.5">→</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
