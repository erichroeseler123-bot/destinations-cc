import Link from "next/link";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import RealityEvidenceSection from "@/app/components/dcc/RealityEvidenceSection";
import TripPlanningSnapshot from "@/app/components/dcc/TripPlanningSnapshot";
import type { ResolvedPortAuthorityConfig } from "@/src/data/port-authority-config";
import { buildPortExcursionHref, buildPortTrackedHref } from "@/src/lib/port-analytics";

type PortView = {
  slug: string;
  name: string;
  area?: string;
  region?: string;
  city?: string;
  country?: string;
  tags?: string[];
  passenger_volume?: number;
};

type PortAuthorityTemplateProps = {
  port: PortView;
  config: ResolvedPortAuthorityConfig;
};

function formatCountry(country?: string): string {
  if (!country) return "Unknown";
  const normalized = country.toUpperCase();
  const map: Record<string, string> = {
    US: "United States",
    BS: "Bahamas",
    MX: "Mexico",
    GR: "Greece",
    HN: "Honduras",
    KY: "Cayman Islands",
    LC: "St. Lucia",
    BB: "Barbados",
    ES: "Spain",
  };
  return map[normalized] || country;
}

function toursHref(query: string): string {
  return `/tours?q=${encodeURIComponent(query)}`;
}

const PORT_HERO_IMAGES: Record<string, { src: string; alt: string }> = {
  juneau: {
    src: "/images/authority/ports/juneau/hero.webp",
    alt: "Mendenhall Glacier and mountain coastline near Juneau Cruise Port, Alaska",
  },
  skagway: {
    src: "/images/authority/ports/skagway/hero.webp",
    alt: "Skagway cruise harbor and White Pass mountain corridor in Alaska",
  },
  ketchikan: {
    src: "/images/authority/ports/ketchikan/hero.webp",
    alt: "Ketchikan cruise waterfront and Tongass Narrows in Alaska",
  },
  "icy-strait-point": {
    src: "/images/travel-markets/last-frontier/icy-strait-whale-watching-boats.jpg",
    alt: "Whale-watching vessels in Port Frederick near Icy Strait Point, Hoonah, Alaska",
  },
  sitka: {
    src: "/images/travel-markets/last-frontier/sitka-harbor.jpg",
    alt: "Sitka Sound harbor and coastal mountains in Sitka, Alaska",
  },
  haines: {
    src: "/images/travel-markets/last-frontier/haines-chilkoot-lake.jpg",
    alt: "Chilkoot Lake and Lynn Canal mountains near Haines, Alaska",
  },
  seward: {
    src: "/images/travel-markets/last-frontier/seward-kenai-fjords.jpg",
    alt: "Resurrection Bay and Kenai Fjords coastline at Seward Cruise Port, Alaska",
  },
  whittier: {
    src: "/images/travel-markets/last-frontier/whittier-prince-william-sound-glaciers.jpg",
    alt: "Tidewater glaciers in Prince William Sound near Whittier, Alaska",
  },
  cozumel: {
    src: "/images/travel-markets/cozumel/cozumel-cruise-terminal.jpg",
    alt: "Cruise ship terminal pier and clear Caribbean reef water in Cozumel, Mexico",
  },
  "key-west": {
    src: "/images/travel-markets/key-west/key-west-cruise-port.jpg",
    alt: "Key West harbor waterfront and cruise pier in the Florida Keys",
  },
  nassau: {
    src: "/images/travel-markets/nassau/prince-george-wharf-cruise-port.jpg",
    alt: "Cruise ships berthed at Prince George Wharf in Nassau, Bahamas",
  },
  "port-canaveral": {
    src: "/images/travel-markets/port-canaveral/port-canaveral-cruise-ship.jpg",
    alt: "Cruise ship departing Port Canaveral along Florida's Space Coast",
  },
  "port-everglades": {
    src: "/images/travel-markets/port-everglades/port-everglades-cruise-ship.jpg",
    alt: "Cruise ship berthed at Port Everglades in Fort Lauderdale, Florida",
  },
  "fort-lauderdale": {
    src: "/images/travel-markets/port-everglades/port-everglades-cruise-ship.jpg",
    alt: "Cruise ship berthed at Port Everglades in Fort Lauderdale, Florida",
  },
  miami: {
    src: "/images/travel-markets/portmiami/portmiami-cruise-ship.jpg",
    alt: "Cruise ship berthed along Biscayne Bay at PortMiami, Florida",
  },
  portmiami: {
    src: "/images/travel-markets/portmiami/portmiami-cruise-ship.jpg",
    alt: "Cruise ship berthed along Biscayne Bay at PortMiami, Florida",
  },
  "new-orleans": {
    src: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    alt: "Mississippi Riverfront port corridor and riverboat in New Orleans, Louisiana",
  },
};

export default function PortAuthorityTemplate({
  port,
  config,
}: PortAuthorityTemplateProps) {
  const plainPortName = port.name.replace(/^Port of\s+/i, "");
  const portHeroImage = PORT_HERO_IMAGES[port.slug] || null;
  const region = port.area || port.region || "Cruise region";
  const country = formatCountry(port.country);
  const excursionBrowseHref =
    config.excursionCtaHref || toursHref(`${plainPortName} shore excursions`);
  const excursionBrowseLabel = config.excursionCtaLabel || `Browse ${plainPortName} Tours`;
  const transferHref =
    config.transferCtaHref || toursHref(`${plainPortName} cruise transfer`);
  const transferLabel = config.transferCtaLabel || "Browse Port Transfers";

  return (
    <main className="max-w-6xl mx-auto px-6 py-14 space-y-10">
      <header className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_18px_70px_rgba(0,0,0,0.35)]">
        {portHeroImage ? (
          <img
            src={portHeroImage.src}
            alt={portHeroImage.alt}
            width={1400}
            height={800}
            loading="eager"
            className="h-56 w-full object-cover object-center border-b border-white/10 sm:h-72"
          />
        ) : null}
        <div className="p-8">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            {config.isFallback ? "Port Reference · Sailing Fit Unverified" : "Port Authority Node"}
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">{config.heroTitle || `${port.name} Cruise Port`}</h1>
          <p className="max-w-3xl text-lg text-zinc-200">{config.summary}</p>
          <p className="max-w-3xl text-sm text-zinc-400">{config.cruiseRelevance}</p>
          {config.isFallback ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-4 text-sm text-cyan-100">
              Browse shore excursions and port category links below. Terminal-specific transfer timing for {plainPortName} is not yet pre-loaded, so options are shown for browsing as <strong>Sailing fit unverified</strong> until you confirm your ship window.
              <div className="mt-3 flex flex-wrap gap-4">
                <a href={`/go/dcc-to-cruise-promenade?port=${encodeURIComponent(port.slug)}`} className="font-semibold text-cyan-200 hover:text-white underline underline-offset-4">
                  Plan {plainPortName} with your group →
                </a>
                <Link href="/ports" className="font-semibold text-white/80 hover:text-white">
                  Browse all ports →
                </Link>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-cyan-200">
              {config.isFallback ? "Port reference" : "Port guide & excursions"}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{country}</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">{region}</span>
            {port.tags?.length ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                {port.tags.join(" • ")}
              </span>
            ) : null}
          </div>
        </div>
        </div>
      </header>

      {config.tripPlanningSnapshot?.length ? (
        <TripPlanningSnapshot
          title={`${plainPortName} planning snapshot`}
          intro={`Quick context for how ${plainPortName} usually works on a real cruise day before you choose transportation or excursion lanes.`}
          items={config.tripPlanningSnapshot}
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Port Snapshot</p>
            <h2 className="text-2xl font-bold">Cruise-day basics</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Country / Region</div>
              <div className="mt-2 font-semibold text-zinc-100">{country} • {region}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Tender or Dock</div>
              <div className="mt-2 font-semibold text-zinc-100">{config.tenderDock}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Common Excursion Length</div>
              <div className="mt-2 font-semibold text-zinc-100">{config.excursionLength}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Best-known Nearby Area</div>
              <div className="mt-2 font-semibold text-zinc-100">{config.nearbyTown}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Cruise Season Signal</div>
              <div className="mt-2 font-semibold text-zinc-100">{config.cruiseSeason}</div>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Book Shore Excursions & Activities</p>
            <h2 className="text-2xl font-bold">Bookable port intent</h2>
            <p className="text-zinc-300">
              Browse the main excursion categories cruise travelers actually buy from this port, then hand off into Viator checkout.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {config.excursionCategories.map((item) => (
              <Link
                key={item.label}
                href={buildPortTrackedHref({
                  href: buildPortExcursionHref(plainPortName, item),
                  port: port.slug,
                  lane: "authority",
                  sourceSection: "port_excursions_category",
                  intentQuery: item.viatorQuery || `${plainPortName} ${item.label}`,
                  categoryLabel: item.label,
                })}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-zinc-100 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/cruises/shore-excursions"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-100 hover:bg-emerald-500/20"
            >
              Open shore excursions guide
            </Link>
            {config.tenderDock.toLowerCase().includes("tender") ? (
              <Link
                href="/cruises/tendering"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 font-semibold text-cyan-100 hover:bg-cyan-500/20"
              >
                Open tendering guide
              </Link>
            ) : null}
            <Link
              href={buildPortTrackedHref({
                href: excursionBrowseHref,
                port: port.slug,
                lane: "authority",
                sourceSection: "port_excursions_primary",
                intentQuery: `${plainPortName} shore excursions`,
              })}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400"
            >
              {excursionBrowseLabel}
            </Link>
            <Link
              href={buildPortTrackedHref({
                href: transferHref,
                port: port.slug,
                lane: "authority",
                sourceSection: "port_excursions_secondary",
                intentQuery: `${plainPortName} cruise transfer`,
              })}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              {transferLabel}
            </Link>
          </div>

          <PoweredByViator
            compact
            disclosure
            body={`DCC helps you narrow the right ${plainPortName} excursions and transfers faster. When you book, the handoff goes through Viator.`}
            className="mt-5 bg-white/5"
          />
        </section>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300">What This Port Is Known For</p>
          <h2 className="mt-2 text-2xl font-bold">High-signal reasons travelers care</h2>
          <ul className="mt-5 space-y-3 text-zinc-300">
            {config.knownFor.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Nearby Attractions / Zones</p>
          <h2 className="mt-2 text-2xl font-bold">Where cruise-day movement clusters</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {config.nearbyZones.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-rose-300">Cruise Logistics</p>
        <h2 className="mt-2 text-2xl font-bold">Timing and operational reality</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {config.logistics.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-300">
              {item}
            </div>
          ))}
        </div>
      </section>

      {config.realityCheckEvidence?.length ? (
        <RealityEvidenceSection
          title={`${plainPortName} reality checks`}
          intro={`Use recent traveler footage, route references, maps, and official notices to compare the marketed version of ${plainPortName} with the actual crowd, timing, transfer, and excursion reality.`}
          summaryPoints={config.realityCheckSummary}
          items={config.realityCheckEvidence}
          disclaimer="Illustrative reference only. Conditions vary by ship, berth, operator, weather, crowd level, and sailing date."
        />
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-300">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold">Common cruise-port questions</h2>
        <div className="mt-5 space-y-3">
          {config.faq.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-white/10 bg-black/20 p-5">
              <summary className="cursor-pointer list-none font-semibold text-zinc-100">
                {item.question}
              </summary>
              <p className="mt-3 text-sm text-zinc-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Internal Links</p>
        <h2 className="mt-2 text-2xl font-bold">Continue through the network</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {config.cruisePortHref ? (
            <Link
              href={config.cruisePortHref}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              Cruise schedule view
            </Link>
          ) : null}
          {config.relatedLinks.map((item) => (
            <Link
              key={`${item.label}:${item.href}`}
              href={buildPortTrackedHref({
                href: item.href,
                port: port.slug,
                lane: "authority",
                sourceSection: "port_related_links",
              })}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
