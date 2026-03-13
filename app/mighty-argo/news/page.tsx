import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mighty Argo Cable Car News — Updates + Official Resources",
  description:
    "Authoritative links and updates about the Mighty Argo Cable Car project in Idaho Springs.",
  alternates: { canonical: "/mighty-argo/news" },
};

const LINKS = [
  { label: "Official site (Mighty Argo)", href: "https://mightyargo.com/" },
  { label: "COMBA: Trek Trails @ Virginia Canyon Mountain Park", href: "https://www.comba.org/virginiacanyonmountainpark" },
  { label: "Clear Creek Tourism Bureau: Scenic Gondola overview", href: "https://visitclearcreek.com/activities/scenic-gondola/" },
  { label: "Denver Gazette: Six facts + construction milestones (Sep 2025)", href: "https://www.denvergazette.com/2025/09/30/six-facts-about-the-mighty-argo-cable-car-gondola-being-built-in-idaho-springs/" },
  { label: "Seilbahnen International: Doppelmayr project + Bike Cabs", href: "https://www.simagazin.com/en/si-alpin/topics/cableway-technology/doppelmayr-prestigious-mighty-argo-cable-car/" },
  { label: "Argo Mill & Tunnel: “New attractions” page", href: "https://argomilltour.com/things-to-do-in-colorado/new-attractions/" },
  { label: "City of Idaho Springs: Virginia Canyon Mountain Park", href: "https://www.idahospringsco.com/parks/page/virginia-canyon-mountain-park" },
];

export default function MightyArgoNews() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-6">
        <h1 className="text-4xl font-black">News + official links</h1>
        <p className="text-zinc-300 max-w-2xl">
          This page is intentionally link-first. We keep “facts” on the Stats page and link
          here so updates are easy to maintain.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <ul className="space-y-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a className="underline text-zinc-100 hover:text-white" href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
