"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PlanningLink = { href: string; label: string };

const HOME_LINKS: PlanningLink[] = [
  { href: "/guides/plan-new-orleans-tours", label: "Plan by time, group or transportation" },
  { href: "/guides/things-to-do-in-new-orleans-today", label: "Things to do today" },
  { href: "/guides/one-day-in-new-orleans-tours", label: "Only have one day" },
  { href: "/guides/first-time-new-orleans-tours", label: "First visit" },
];

const CATEGORY_LINKS: Record<string, PlanningLink[]> = {
  "/city-tours": [
    { href: "/guides/city-tour-vs-swamp-tour-new-orleans", label: "City tour vs swamp tour" },
    { href: "/guides/first-time-new-orleans-tours", label: "Best starting points for a first visit" },
    { href: "/guides/4-hours-in-new-orleans", label: "Tour planning with about four hours" },
  ],
  "/swamp-tours": [
    { href: "/compare/covered-swamp-boat-vs-airboat", label: "Covered boat vs airboat" },
    { href: "/guides/best-swamp-tour-with-transportation", label: "Swamp tours with transportation" },
    { href: "/guides/city-tour-vs-swamp-tour-new-orleans", label: "City tour vs swamp tour" },
  ],
  "/plantation-tours": [
    { href: "/compare/whitney-vs-oak-alley", label: "Whitney vs Oak Alley" },
    { href: "/guides/whitney-plantation-tour-from-new-orleans", label: "Whitney from New Orleans" },
    { href: "/guides/oak-alley-plantation-tour-from-new-orleans", label: "Oak Alley from New Orleans" },
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

  return (
    <aside className="border-t border-white/10 bg-[#110e14] px-6 py-10 text-[#fdfbf7]" aria-label="Planning help">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">Still deciding?</p>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl">Use the decision guide that matches your trip</h2>
          </div>
          <Link href="/guides/plan-new-orleans-tours" className="text-sm font-bold text-[#d4af37] hover:text-white">See all planning paths →</Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="border border-white/15 bg-white/[0.03] px-4 py-4 text-sm leading-5 hover:border-[#d4af37]">
              {link.label} →
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
