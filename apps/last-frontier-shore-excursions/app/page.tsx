import Link from "next/link";
import { cookies } from "next/headers";
import { PORTS } from "@/lib/ports";
import { AFFILIATE_CATALOG } from "@/lib/affiliate/catalog";
import { buildAffiliateUrl, buildDccHandoffAffiliateUrl } from "@/lib/affiliate/links";
import { HERO_IMAGE } from "@/lib/images";
import { CruiseWindowCalculator } from "@/components/CruiseWindowCalculator";
import { TrustDisclosure } from "@/components/TrustDisclosure";
import {
  LfseExperienceShowcase,
  type LfseStandardizedCardItem,
} from "@/components/LfseExperienceShowcase";
import { buildAddToCruisePromenadeUrl } from "../../../lib/dcc/shared/addToCruisePromenadeUrl";
import styles from "./home.module.css";

const FEATURED_BOOKABLE_IDS = [
  "331813P1", // Juneau Small-Group Whale Watching
  "5338PRTSGYCITY", // Skagway White Pass Summit Scenic Railway
  "6459PRTKTNMISTY", // Ketchikan Misty Fjords Floatplane
  "472133P4", // Sitka Sound Sea Otter & Marine Wildlife Quest
  "14707P1", // Icy Strait Point / Point Adolphus Whale Watching
] as const;

const PORT_DISPLAY_NAMES: Record<string, string> = {
  juneau: "Juneau",
  skagway: "Skagway",
  ketchikan: "Ketchikan",
  sitka: "Sitka",
  "icy-strait-point": "Icy Strait Point",
};

const PORT_DESTINATIONS: Record<string, string> = {
  "331813P1": "Juneau · Auke Bay & Favorite Channel",
  "5338PRTSGYCITY": "Skagway · White Pass Summit (2,865 ft)",
  "6459PRTKTNMISTY": "Ketchikan · Misty Fjords National Monument",
  "472133P4": "Sitka · Sitka Sound & Kelp Forests",
  "14707P1": "Icy Strait Point · Point Adolphus Feeding Grounds",
};

const PORT_FIT_NOTES: Record<string, string> = {
  "331813P1": "Fits 6.5+ hour Juneau port calls · Includes 20m shuttle + 2-hour all-aboard buffer",
  "5338PRTSGYCITY": "Fits 5.5+ hour Skagway port calls · Direct Railroad Dock boarding + 2-hour buffer",
  "6459PRTKTNMISTY": "Fits 5.5+ hour Ketchikan port calls · Add 20m shuttle margin if docked at Ward Cove",
  "472133P4": "Fits 5.5+ hour Sitka port calls · Direct Old Sitka Cruise Terminal boarding + 2-hour buffer",
  "14707P1": "Fits 6+ hour Hoonah port calls · Excursion Hub departure + 2-hour all-aboard buffer",
};

const FAQS = [
  {
    q: "How does Last Frontier verify if an excursion fits my cruise ship's port window?",
    a: "We apply a recommended 2-hour (120-minute) all-aboard return buffer on top of the full activity duration and local dock transfer time—including the 20-minute shuttle from Ward Cove in Ketchikan, the continuous shuttle from AJ Dock in Juneau, and Old Sitka shuttle transfers. Departures leaving less than 2-hour return buffer before all-aboard are flagged as reduced buffer (not recommended).",
  },
  {
    q: "What is the difference between Bookable Now, Inquiry-Only, and Commercially Held listings?",
    a: "Bookable Now tours take you straight to an exact Viator or GetYourGuide product page with live seat calendars. Inquiry-Only options connect you with a human planner for sold-out flightseeing dates or multi-cabin private vans. Commercially Held tours have self-service checkout paused while seasonal pier buffers or partner agreements are re-verified.",
  },
  {
    q: "Who processes my payment and issues my shore excursion tickets?",
    a: "Last Frontier Shore Excursions never collects credit cards on this site. You complete checkout directly with the named booking platform (such as Viator or GetYourGuide) or local Alaska operator, who issues your mobile voucher and manages cancellations.",
  },
  {
    q: "What happens if my ship docks at Ward Cove (Ketchikan) or AJ Dock (Juneau)?",
    a: "Ships at Ward Cove sit 7 miles north of downtown Ketchikan and require a complimentary 20-minute shuttle each way. Ships at AJ Dock sit 1 mile south of downtown Juneau with a 10–15 minute shuttle. Use the Port Window Check above to select your exact berth before booking.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = searchParams ? await searchParams : {};
  let cookieCtx: string | undefined;
  try {
    const cookieStore = await cookies();
    cookieCtx =
      cookieStore.get("lfse_trip_ctx")?.value ||
      cookieStore.get("dcc_trip_ctx")?.value ||
      undefined;
  } catch {
    cookieCtx = undefined;
  }
  const rawCtx =
    (typeof sp.ctx === "string" ? sp.ctx : undefined) ||
    (typeof sp.dcc_ctx === "string" ? sp.dcc_ctx : undefined) ||
    cookieCtx ||
    null;
  const carriedDate = typeof sp.date === "string" ? sp.date : null;
  const rawParty =
    (typeof sp.partySize === "string" ? sp.partySize : undefined) ||
    (typeof sp.guests === "string" ? sp.guests : undefined);
  const carriedPartySize =
    rawParty && Number.isFinite(Number(rawParty)) ? Number(rawParty) : null;
  const carriedShip = typeof sp.ship === "string" ? sp.ship : null;

  const ctxQuery = rawCtx
    ? `?ctx=${encodeURIComponent(rawCtx)}`
    : carriedDate || carriedPartySize
    ? `?${new URLSearchParams({
        ...(carriedDate ? { date: carriedDate } : {}),
        ...(carriedPartySize ? { partySize: String(carriedPartySize) } : {}),
      }).toString()}`
    : "";

  const bookableCards: LfseStandardizedCardItem[] = FEATURED_BOOKABLE_IDS.map((pid) => {
    const item = AFFILIATE_CATALOG.find((c) => c.productId === pid)!;
    const partnerUrl = buildAffiliateUrl(
      item.source,
      item.officialUrl,
      item.attributionCampaign,
      item.title,
      item.isExactProduct,
    );
    const handoffHref = buildDccHandoffAffiliateUrl({
      source: item.source,
      destinationUrl: partnerUrl,
      productCode: item.productId || item.activitySlug,
      campaign: item.attributionCampaign,
      contextId: rawCtx,
      intendedDate: carriedDate,
      partySize: carriedPartySize,
    });
    const addToCpHref = buildAddToCruisePromenadeUrl({
      title: item.title,
      port: item.portSlug,
      ship: carriedShip || null,
      durationMinutes: item.durationMinutes,
      fitStatus: "strong_fit",
      operator: item.provider,
      productCode: item.productId || item.activitySlug,
      sourceSite: "lastfrontiershoreexcursions.com",
    });
    const partnerLabel = item.source === "viator" ? "Viator" : "GetYourGuide";
    return {
      id: item.productId || item.attributionCampaign,
      category: "bookable",
      statusBadge: "Bookable Now",
      portName: PORT_DISPLAY_NAMES[item.portSlug] || item.portSlug,
      portSlug: item.portSlug,
      activitySlug: item.activitySlug,
      productId: item.productId || undefined,
      attributionCampaign: item.attributionCampaign,
      image: item.permittedImages[0]?.url || HERO_IMAGE.url,
      imageAlt: item.permittedImages[0]?.caption || item.title,
      whatItIs: item.title,
      whereItGoes: PORT_DESTINATIONS[pid] || `${PORT_DISPLAY_NAMES[item.portSlug]} Shore Excursion`,
      dateAvailability: `May–Sep Alaska season (${item.datesAndTimeSlots.slice(0, 3).join(", ")})`,
      duration: item.duration,
      pickupLocation: item.meetingPoint,
      priceLabel: `From $${item.priceFrom}`,
      priceSubtext: "per person · check live rate",
      scheduleFit: PORT_FIT_NOTES[pid] || `Includes ${item.transferBufferMinutes}m transfer + 2-hour return buffer`,
      checkoutProcessor: `${partnerLabel} (${item.provider})`,
      ctaLabel: `Check Availability on ${partnerLabel} →`,
      ctaHref: handoffHref,
      ctaExternal: true,
      ctaSponsored: true,
      providerName: item.provider,
      addToCpHref,
    };
  });

  const inquiryAndHeldCards: LfseStandardizedCardItem[] = [
    {
      id: "inquiry-juneau-flight-concierge",
      category: "inquiry",
      statusBadge: "Inquiry-Only",
      portName: "Juneau",
      portSlug: "juneau",
      image: "/images/alaska/glacier-flightseeing.jpg",
      imageAlt: "Helicopter landing on the Juneau Icefield",
      whatItIs: "Juneau Glacier Helicopter & Dog Sled Concierge",
      whereItGoes: "Juneau · Herbert, Norris, or Mendenhall Glacier Icefield",
      dateAvailability: "May–Sep custom flight windows & sold-out ship-day checks",
      duration: "2.25 to 3.25 hours dock-to-dock",
      pickupLocation: "Downtown Juneau Cruise Pier / Tramway Shuttle",
      priceLabel: "From $439",
      priceSubtext: "per guest · verified before payment",
      scheduleFit: "Matched manually to your ship's exact arrival & all-aboard window",
      checkoutProcessor: "Human flight desk via Juneau Flight Deck (no card taken on request)",
      ctaLabel: "Request flight availability →",
      ctaHref: `https://juneauflightdeck.com/${ctxQuery}`,
      ctaExternal: true,
    },
    {
      id: "inquiry-multi-cabin-private-shore",
      category: "inquiry",
      statusBadge: "Inquiry-Only",
      portName: "All 5 Ports",
      portSlug: "juneau",
      image: "/images/alaska/white-pass-train.jpg",
      imageAlt: "White Pass narrow-gauge railway climbing coastal mountains above Skagway, Alaska",
      whatItIs: "Multi-Cabin Private Van & Custom Port-Day Planning",
      whereItGoes: "Juneau, Skagway, Ketchikan, Sitka & Icy Strait Point",
      dateAvailability: "By ship date for families & multi-cabin groups (6–24+ guests)",
      duration: "Custom 3 to 6 hours around your gangway window",
      pickupLocation: "Coordinated for Franklin, AJ Dock, Ward Cove, Railroad, or Old Sitka",
      priceLabel: "Custom quote",
      priceSubtext: "free port-window review",
      scheduleFit: "Built specifically around multi-generational pace & 2-hour return buffer",
      checkoutProcessor: "Direct local Alaska operator after itinerary confirmation",
      ctaLabel: "Request custom group plan →",
      ctaHref: "/contact",
      ctaExternal: false,
    },
    {
      id: "held-ketchikan-crab-vessel",
      category: "held",
      statusBadge: "Commercially Held",
      portName: "Ketchikan",
      portSlug: "ketchikan",
      image: "/images/portfolio/ketchikan-fishing-vessel.webp",
      imageAlt: "Commercial fishing vessel in Ketchikan harbor waters",
      whatItIs: "Bering Sea Crab Fishermen's Tour (Aleutian Ballad)",
      whereItGoes: "Ketchikan · Protected Waters of Tongass Narrows",
      dateAvailability: "Self-service checkout currently paused pending seasonal verification",
      duration: "3.0 hours (plus dock transfer buffer)",
      pickupLocation: "Downtown Ketchikan Berth vs. Ward Cove 20m shuttle under review",
      priceLabel: "Checkout paused",
      priceSubtext: "commercial & shuttle hold",
      scheduleFit: "Held while Ward Cove shuttle timing & partner attribution are re-verified",
      checkoutProcessor: "Online checkout paused · Ask our desk for verified Ketchikan alternatives",
      ctaLabel: "Ask for Ketchikan alternatives →",
      ctaHref: "/contact",
      ctaExternal: false,
    },
  ];

  const allShowcaseItems = [...bookableCards, ...inquiryAndHeldCards];

  return (
    <main className={styles.page}>
      {/* SECTION 2: Strong Destination Hero with One Primary Action */}
      <section className={styles.hero}>
        <img
          src={HERO_IMAGE.url}
          alt={HERO_IMAGE.alt}
          width={1600}
          height={900}
          loading="eager"
          className={styles.heroMedia}
        />
        <div className={styles.heroScrim} />

        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div>
              <div className={styles.heroBadges}>
                <span className={styles.pillIce}>2-Hour All-Aboard Buffer</span>
                <span className={styles.pillNavy}>Juneau · Skagway · Ketchikan · Sitka · Icy Strait</span>
              </div>

              <h1 className={styles.heroTitle}>
                Alaska shore excursions built around{" "}
                <span className={styles.heroTitleAccent}>your ship&apos;s port window.</span>
              </h1>

              <p className={styles.heroLead}>
                Check whether a tour truly fits your arrival, dock shuttle, and all-aboard time—with clear meeting points, real return buffers, and honest distinction between instant partner checkout, concierge requests, and paused listings.
              </p>

              {(carriedShip || carriedDate || carriedPartySize) && (
                <div className={styles.carriedContextPill}>
                  <strong>Trip window loaded:</strong>
                  {carriedShip ? <span>Ship: {carriedShip}</span> : null}
                  {carriedDate ? <span>· Date: {carriedDate}</span> : null}
                  {carriedPartySize ? <span>· Party of {carriedPartySize}</span> : null}
                </div>
              )}

              <div className={styles.heroCtaRow}>
                <a href="#calculator" className={styles.primaryBtn}>
                  Check my ship&apos;s port window ↓
                </a>
              </div>

              <div className={styles.heroSublinks}>
                <a href="#excursions">Browse featured shore excursions</a>
                <span>·</span>
                <Link href="/cruise-ships">Find my cruise ship schedule</Link>
              </div>
            </div>

            <aside className={styles.heroPortCard} aria-label="Jump to Alaska cruise port">
              <span className={styles.heroPortCardKicker}>Jump straight to your port</span>
              <ul className={styles.heroPortList}>
                <li>
                  <Link href="/ports/juneau">
                    <span>Juneau (Whales, Mendenhall &amp; Glaciers)</span>
                    <span className={styles.heroPortMeta}>6 tours →</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ports/skagway">
                    <span>Skagway (White Pass Rail &amp; Yukon)</span>
                    <span className={styles.heroPortMeta}>3 tours →</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ports/ketchikan">
                    <span>Ketchikan (Misty Fjords &amp; Totems)</span>
                    <span className={styles.heroPortMeta}>3 tours →</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ports/sitka">
                    <span>Sitka (Sea Otters &amp; Raptor Center)</span>
                    <span className={styles.heroPortMeta}>2 tours →</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ports/icy-strait-point">
                    <span>Icy Strait Point (Point Adolphus Whales)</span>
                    <span className={styles.heroPortMeta}>1 tour →</span>
                  </Link>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* SECTION 3: Three-Step "How It Works" + Live Port-Window Calculator */}
      <section id="calculator" className={styles.sectionWhite}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>How It Works</p>
            <h2 className={styles.sectionTitle}>Know you&apos;ll make all-aboard before you book</h2>
            <p className={styles.sectionLead}>
              Tour duration alone is misleading when your ship berths at Ward Cove, AJ Dock, or Old Sitka. Test your exact times in seconds.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>1</span>
                <span className={styles.stepKicker}>Ship &amp; Berth</span>
              </div>
              <h3>Enter arrival, all-aboard &amp; dock</h3>
              <p>
                Select your berth so shuttle transfers—like Ketchikan&apos;s 20-minute Ward Cove bus or Juneau&apos;s AJ Dock loop—are counted automatically.
              </p>
            </article>

            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>2</span>
                <span className={styles.stepKicker}>2-Hour Buffer Rule</span>
              </div>
              <h3>Verify a 2-hour gangway buffer</h3>
              <p>
                Every recommended option must finish, complete return transit, and put you back at the pier at least 2-hour return buffer (2 hours) before all-aboard.
              </p>
            </article>

            <article className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span className={styles.stepNum}>3</span>
                <span className={styles.stepKicker}>Clear Booking Path</span>
              </div>
              <h3>Book direct or request group help</h3>
              <p>
                Reserve verified products directly on Viator or GetYourGuide, save picks to your Cruise Promenade board, or ask our desk for custom group plans.
              </p>
            </article>
          </div>

          <CruiseWindowCalculator portSlug="juneau" defaultDurationMinutes={210} />
        </div>
      </section>

      {/* SECTION 4: Featured Experiences — Standardized 9-Detail Cards Separating Bookable, Inquiry-Only & Held */}
      <section id="excursions" className={styles.sectionIce}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.eyebrow}>Featured Shore Excursions</p>
              <h2 className={styles.sectionTitle}>Clear timing, pier pickup &amp; booking status</h2>
              <p className={styles.sectionLead}>
                We separate excursions you can book immediately with verified partners from concierge-only requests and commercially paused listings.
              </p>
            </div>
            <Link href="/tours" style={{ color: "#0b192c", fontWeight: 800, fontSize: "14.5px", textDecoration: "underline" }}>
              Compare all 15 bookable catalog excursions →
            </Link>
          </div>

          <LfseExperienceShowcase items={allShowcaseItems} />

          <div style={{ marginTop: 24 }}>
            <TrustDisclosure />
          </div>
        </div>
      </section>

      {/* SECTION 5: Clear Trust, Port-Timing Information & 5 Alaska Ports */}
      <section id="ports" className={styles.sectionWhite}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Port Logistics &amp; Booking Boundaries</p>
            <h2 className={styles.sectionTitle}>Built for real Alaska dock conditions</h2>
            <p className={styles.sectionLead}>
              Every Southeast Alaska port has different dock shuttles, weather backups, and gangway bottlenecks. Start with your port below.
            </p>
          </div>

          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <strong>2-Hour All-Aboard Standard</strong>
              <p>
                Tour end time plus return shuttle transit plus 2 hours (2-hour return buffer) must fall before your ship&apos;s published all-aboard time; tighter windows are flagged as reduced buffer (not recommended).
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>Ward Cove &amp; AJ Dock Shuttles</strong>
              <p>
                NCL/Oceania/Regent ships at Ward Cove need 20 minutes each way into Ketchikan; AJ Dock in Juneau requires a 10–15 minute port shuttle.
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>Weather-Smart Backups</strong>
              <p>
                Helicopter and floatplane flights depend on ceiling visibility. Keep whale boats, White Pass rail, or totem walks in mind as low-ceiling backups.
              </p>
            </div>
            <div className={styles.trustCard}>
              <strong>Transparent Partner Checkout</strong>
              <p>
                We are an independent planning guide, not a cruise line or merchant of record. Viator, GetYourGuide, or your local operator handles checkout and tickets.
              </p>
            </div>
          </div>

          <div className={styles.portsGrid}>
            {PORTS.map((port) => (
              <Link key={port.slug} href={`/ports/${port.slug}`} className={styles.portCard}>
                <img
                  src={port.image}
                  alt={port.imageAlt}
                  width={400}
                  height={265}
                  loading="lazy"
                  className={styles.portCardImg}
                />
                <div className={styles.portCardBody}>
                  <span className={styles.portCardHours}>{port.typicalPortHours.split("(")[0].trim()}</span>
                  <h3>{port.name}</h3>
                  <p>{port.hook}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: Simple FAQ */}
      <section id="faq" className={styles.sectionIce}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Common Questions</p>
            <h2 className={styles.sectionTitle}>Before you book an independent shore excursion</h2>
          </div>

          <div className={styles.faqList}>
            {FAQS.map((item) => (
              <details key={item.q} className={styles.faqItem}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
