import Link from "next/link";

type PortSlug = "juneau" | "skagway";

type HelicopterDispatchBoardProps = {
  portSlug: PortSlug;
  sourcePage: string;
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
    headline: "Book the Alaska flight day that earns the port stop.",
    subhead:
      "Glacier flights, Mendenhall scenery, whale-watching backups, and cruise-safe timing help in one clean storefront.",
    verdict:
      "Start with a helicopter glacier tour if weather and ship timing work. Keep whale watching ready as the stronger backup when flight conditions tighten.",
    portNote:
      "For Juneau, confirm pickup location, flight time, and return buffer against your ship schedule before paying.",
    crossLinkHref: "/skagway/helicopter",
    crossLinkLabel: "Need Skagway instead?",
  },
  skagway: {
    label: "Skagway shore day",
    headline: "Find the Skagway glacier flight that fits the ship clock.",
    subhead:
      "Skagway helicopter excursions available today or tomorrow, narrowed to premium glacier-style options.",
    verdict:
      "Use Skagway when that is the port on your itinerary. Do not book a Juneau operator unless your cruise actually stops in Juneau with enough time.",
    portNote:
      "For Skagway, verify meeting point, total duration, and ship return margin before paying.",
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
    body: "Check meeting point, flight window, and ship return buffer before paying.",
  },
  {
    label: "Weather aware",
    body: "Helicopter routes can move or cancel. Keep a strong backup in view.",
  },
  {
    label: "Glacier fit",
    body: "Pick flightseeing, landing, or dogsled-style options based on the day you actually have.",
  },
  {
    label: "Backup plan",
    body: "Whale watching stays close to the Alaska feeling when flight weather does not cooperate.",
  },
];

const TOUR_CARDS = [
  {
    title: "Helicopter Glacier Tour",
    kicker: "Signature Juneau",
    image: GLACIER_IMAGE,
    alt: "Mendenhall Glacier landscape near Juneau, Alaska",
    body: "The premium first check when you want the big Alaska moment and your ship schedule has enough room.",
    meta: ["Glacier views", "Weather dependent", "Confirm return buffer"],
    href: "/helicopter",
    cta: "Compare glacier flights",
  },
  {
    title: "Mendenhall Glacier Landing / Walk",
    kicker: "Glacier focus",
    image: "/images/authority/attractions/mendenhall-glacier/section-1.webp",
    alt: "Mendenhall Glacier and mountain scenery near Juneau",
    body: "Use this lane when the glacier is the point of the day and you want the strongest visual payoff.",
    meta: ["Photo led", "Glacier terrain", "Terms on provider page"],
    href: "/juneau/helicopter",
    cta: "Compare glacier options",
  },
  {
    title: "Whale Watching Backup",
    kicker: "Weather-smart fallback",
    image: WHALE_IMAGE,
    alt: "Juneau harbor and coastal Alaska scenery for whale watching backup plans",
    body: "The clean backup when helicopter weather gets unstable but you still want one real Alaska excursion.",
    meta: ["Cruise friendly", "Less flight risk", "Good backup"],
    href: "/juneau-whale-watching-tours",
    cta: "Plan whale backup",
  },
  {
    title: "If Weather Cancels",
    kicker: "Port-day save",
    image: HARBOR_IMAGE,
    alt: "Juneau waterfront and harbor scenery for cruise excursion planning",
    body: "Know what to switch to before the day gets away from you. The best backup is decided before cancellation.",
    meta: ["Weather policy", "Same-day pivot", "Ship clock first"],
    href: "/juneau/what-to-do-if-helicopter-tour-canceled",
    cta: "Weather cancellation plan",
  },
];

const PLANNING_CARDS = [
  {
    label: "Flight lane",
    title: "Check helicopter options",
    body: "Use this when the weather looks workable and the ship schedule leaves enough room for a glacier flight.",
    href: "/helicopter",
  },
  {
    label: "Cruise port",
    title: "Compare the shore day",
    body: "Use the port guide if you are still deciding between glacier, whale watching, and a lower-risk town day.",
    href: "/what-to-do-in-juneau-cruise-port",
  },
  {
    label: "Weather backup",
    title: "Plan whale backup",
    body: "Keep a whale-watching plan ready when helicopter weather starts to look unstable.",
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
            Current price, availability, pickup details, cancellation policy, and final terms continue on the provider booking page.
          </p>
        </div>

        <aside className="dispatch-panel" aria-label="Cruise-safe timing checklist">
          <div>
            <span className="dispatch-metric">Ship</span>
            <span className="dispatch-metric-label">Return buffer checked before checkout</span>
          </div>
          <div>
            <span className="dispatch-metric">Wx</span>
            <span className="dispatch-metric-label">Weather policy read before paying</span>
          </div>
          <div>
            <span className="dispatch-metric">Alt</span>
            <span className="dispatch-metric-label">Whale backup ready if flights cancel</span>
          </div>
        </aside>
      </section>

      <section className="trust-strip jfd-trust-strip" aria-label="Juneau booking trust badges">
        {TRUST_BADGES.map((badge) => (
          <div key={badge.label}>
            <strong>{badge.label}</strong>
            <span>{badge.body}</span>
          </div>
        ))}
      </section>

      <section className="section-block jfd-tour-section" aria-label="Popular Juneau tour choices">
        <div className="section-heading">
          <p className="eyebrow">Popular Juneau choices</p>
          <h2>Start with the trip that fits your ship day.</h2>
          <p>
            These are not fake live-price cards. Use them to pick the right lane, then confirm current price,
            availability, pickup details, and terms on the provider page.
          </p>
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

      <section className="section-block dispatch-widget-block" aria-label="Juneau booking planning options">
        <div className="section-heading">
          <p className="eyebrow">Booking plan</p>
          <h2>Pick the next move before opening a provider page.</h2>
          <p>
            Final price, availability, pickup details, cancellation policy, and provider terms stay on
            the booking page. Use this storefront to choose the right Juneau lane first.
          </p>
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

      <section className="section-block dispatch-rules">
        <div className="section-heading">
          <p className="eyebrow">Before checkout</p>
          <h2>Only book it if these three things line up</h2>
        </div>
        <div className="dispatch-rule-grid">
          <div>
            <strong>Correct port</strong>
            <span>{copy.label} must match the ship stop on your itinerary.</span>
          </div>
          <div>
            <strong>Enough return margin</strong>
            <span>Leave buffer for weather, transport, and cruise boarding cutoff.</span>
          </div>
          <div>
            <strong>Weather policy understood</strong>
            <span>Helicopter tours can move or cancel. Read the operator policy before paying.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
