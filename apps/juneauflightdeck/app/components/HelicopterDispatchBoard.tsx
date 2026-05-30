import Link from "next/link";

type PortSlug = "juneau" | "skagway";

type HelicopterDispatchBoardProps = {
  portSlug: PortSlug;
  sourcePage?: string;
};

const PORT_COPY: Record<
  PortSlug,
  {
    label: string;
    headline: string;
    subhead: string;
    verdict: string;
    portNote: string;
    crossLinkHref: string;
    crossLinkLabel: string;
  }
> = {
  juneau: {
    label: "Juneau shore day",
    headline: "Fly the glacier. Keep a backup.",
    subhead: "Big ice, ship timing, weather pivots, clean next step.",
    verdict: "Start with the glacier flight. Keep whales ready.",
    portNote: "Check pickup, flight time, return buffer, and weather policy.",
    crossLinkHref: "/skagway/helicopter",
    crossLinkLabel: "Need Skagway instead?",
  },
  skagway: {
    label: "Skagway shore day",
    headline: "Match the glacier to the ship.",
    subhead: "Skagway flight options, ship timing, weather backup.",
    verdict: "Use Skagway only when your ship stops there.",
    portNote: "Check meeting point, total duration, and ship return margin.",
    crossLinkHref: "/helicopter",
    crossLinkLabel: "Need Juneau instead?",
  },
};

const HERO_IMAGE = "/images/authority/ports/juneau/hero.webp";
const GLACIER_IMAGE = "/images/authority/attractions/mendenhall-glacier/hero.webp";
const HARBOR_IMAGE = "/images/authority/ports/juneau/section-1.webp";
const WHALE_IMAGE = "/images/authority/ports/juneau/gallery-1.webp";

const TRUST_BADGES = [
  {
    label: "Cruise timing",
    body: "Ship clock first.",
  },
  {
    label: "Weather aware",
    body: "Flight weather changes.",
  },
  {
    label: "Glacier fit",
    body: "Pick the ice level.",
  },
  {
    label: "Whale backup",
    body: "Still feels Alaska.",
  },
];

const TOUR_CARDS = [
  {
    title: "Helicopter Glacier Tour",
    kicker: "Signature Juneau",
    image: GLACIER_IMAGE,
    alt: "Mendenhall Glacier landscape near Juneau, Alaska",
    body: "Big ice, short clock, real Alaska payoff.",
    meta: ["Glacier views", "Weather dependent", "Ship buffer"],
    href: "/helicopter",
    cta: "Compare glacier flights",
  },
  {
    title: "Mendenhall Landing",
    kicker: "Glacier focus",
    image: "/images/authority/attractions/mendenhall-glacier/section-1.webp",
    alt: "Mendenhall Glacier and mountain scenery near Juneau",
    body: "Glacier closeups when landing is the point.",
    meta: ["Ice detail", "Photo led", "Provider terms"],
    href: "/juneau/helicopter",
    cta: "Compare glacier options",
  },
  {
    title: "Whale Watching Backup",
    kicker: "Weather-smart fallback",
    image: WHALE_IMAGE,
    alt: "Juneau harbor and coastal Alaska scenery for whale watching backup plans",
    body: "Lower-risk Alaska when flight weather turns.",
    meta: ["Cruise friendly", "Less flight risk", "Backup"],
    href: "/juneau-whale-watching-tours",
    cta: "Plan whale backup",
  },
  {
    title: "Weather Pivot",
    kicker: "Port-day save",
    image: HARBOR_IMAGE,
    alt: "Juneau waterfront and harbor scenery for cruise excursion planning",
    body: "Know the pivot before the port day slips.",
    meta: ["Weather policy", "Same-day pivot", "Ship first"],
    href: "/juneau/what-to-do-if-helicopter-tour-canceled",
    cta: "Weather plan",
  },
];

const PLANNING_CARDS = [
  {
    label: "Availability",
    title: "Check glacier flights",
    body: "Start here when weather looks workable.",
    href: "/helicopter",
  },
  {
    label: "Backup",
    title: "Compare whale backup",
    body: "Keep one lower-risk Alaska move ready.",
    href: "/what-to-do-in-juneau-cruise-port",
  },
  {
    label: "Weather",
    title: "Read the pivot",
    body: "Know the switch before cancellation.",
    href: "/juneau-whale-watching-tours",
  },
];

export default function HelicopterDispatchBoard({
  portSlug,
}: HelicopterDispatchBoardProps) {
  const copy = PORT_COPY[portSlug];

  return (
    <main className="page-shell dispatch-page">
      <section className="dispatch-hero storefront-hero">
        <div className="storefront-hero-media" aria-hidden="true">
          <img src={HERO_IMAGE} alt="" />
          <div className="storefront-hero-scrim" />
        </div>
        <div className="dispatch-hero-copy">
          <p className="eyebrow">{copy.label} · glacier flights · shore excursions</p>
          <h1>{copy.headline}</h1>
          <p className="dispatch-subhead">{copy.subhead}</p>
          <div className="dispatch-verdict">
            <strong>Best first move</strong>
            <span>{copy.verdict}</span>
          </div>
          <div className="dispatch-pills" aria-label="Booking filters">
            <span>Cruise timing</span>
            <span>Weather policy</span>
            <span>Helicopter glacier tours</span>
            <span>Whale backup</span>
          </div>
          <div className="hero-actions">
            <Link
              className="button button-primary"
              href={portSlug === "juneau" ? "/helicopter" : "/skagway/helicopter"}
            >
              Compare glacier flights
            </Link>
            <Link className="button button-secondary" href={copy.crossLinkHref}>
              {copy.crossLinkLabel}
            </Link>
          </div>
          <p className="storefront-disclosure">
            Final price, pickup, weather policy, and terms stay with the provider.
          </p>
        </div>

        <aside className="dispatch-panel" aria-label="Juneau trip checks">
          <div>
            <span className="dispatch-metric">Ship</span>
            <span className="dispatch-metric-label">Return buffer</span>
          </div>
          <div>
            <span className="dispatch-metric">Wx</span>
            <span className="dispatch-metric-label">Weather read</span>
          </div>
          <div>
            <span className="dispatch-metric">Alt</span>
            <span className="dispatch-metric-label">Backup ready</span>
          </div>
        </aside>
      </section>

      <section className="section-block jfd-tour-section" aria-label="Popular Juneau tour choices">
        <div className="section-heading">
          <p className="eyebrow">Juneau picks</p>
          <h2>Choose the big Alaska move.</h2>
        </div>
        <div className="jfd-tour-grid">
          {TOUR_CARDS.map((card) => (
            <article className="jfd-tour-card" key={card.title}>
              <div className="jfd-tour-image">
                <img src={card.image} alt={card.alt} />
              </div>
              <div className="jfd-tour-copy">
                <p>{card.kicker}</p>
                <h3>{card.title}</h3>
                <span>{card.body}</span>
                <div className="jfd-tour-meta">
                  {card.meta.map((item) => (
                    <small key={item}>{item}</small>
                  ))}
                </div>
                <Link className="button button-card" href={card.href}>
                  {card.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="section-block dispatch-widget-block jfd-availability"
        id="availability"
        aria-label="Juneau availability path"
      >
        <div className="section-heading">
          <p className="eyebrow">Availability path</p>
          <h2>Pick here. Book there.</h2>
        </div>

        <div className="dispatch-widget-grid">
          {PLANNING_CARDS.map((card, index) => (
            <div
              className={`dispatch-widget-card${index === 0 ? " dispatch-widget-card-primary" : ""}`}
              key={card.title}
            >
              <div className="dispatch-widget-heading">
                <span>{card.label}</span>
                <h3>{card.title}</h3>
                <p>{index === 0 ? copy.portNote : card.body}</p>
              </div>
              <Link className="button button-card" href={card.href}>
                {card.title}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="trust-strip jfd-trust-strip" aria-label="Juneau booking trust badges">
        {TRUST_BADGES.map((badge) => (
          <div key={badge.label}>
            <strong>{badge.label}</strong>
            <span>{badge.body}</span>
          </div>
        ))}
      </section>

      <section className="section-block dispatch-rules">
        <div className="section-heading">
          <p className="eyebrow">Before booking</p>
          <h2>Ship clock. Weather. Backup.</h2>
        </div>
        <div className="dispatch-rule-grid">
          <div>
            <strong>Correct port</strong>
            <span>{copy.label} must match your itinerary.</span>
          </div>
          <div>
            <strong>Return margin</strong>
            <span>Leave room for weather and boarding.</span>
          </div>
          <div>
            <strong>Weather terms</strong>
            <span>Helicopter tours can move or cancel.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
