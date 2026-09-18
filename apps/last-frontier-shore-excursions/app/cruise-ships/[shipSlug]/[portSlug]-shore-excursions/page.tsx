import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllAlaskaShips, getShipPortPair, getTrackedTourUrl } from "@/lib/alaska-ships";
import { TrustDisclosure } from "@/components/TrustDisclosure";

const SITE = "https://www.lastfrontiershoreexcursions.com";

type ShipPortRouteProps = {
  params: Promise<{
    shipSlug: string;
    portSlug: string;
  }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  const paramsList: Array<{ shipSlug: string; portSlug: string }> = [];
  const ships = getAllAlaskaShips();

  ships.forEach((ship) => {
    Object.keys(ship.ports).forEach((portKey) => {
      paramsList.push({
        shipSlug: ship.slug,
        portSlug: portKey,
      });
    });
  });

  return paramsList;
}

export async function generateMetadata({ params }: ShipPortRouteProps): Promise<Metadata> {
  const { shipSlug, portSlug } = await params;
  const pair = getShipPortPair(shipSlug, portSlug);

  if (!pair) {
    return {
      title: "Alaska Shore Excursions | Last Frontier",
      description: "Find verified Alaska shore excursions by cruise ship and port.",
    };
  }

  const { ship, port } = pair;
  const title = `Best ${port.portName} Shore Excursions from ${ship.name} (Port Guide & Verified Tours)`;
  const description = `Find verified ${port.portName} shore excursions for ${ship.name} (${ship.cruiseLine}) passengers. Dock notes for ${port.typicalDock}, safe excursion durations, whale watching, helicopters, and scenic rail.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE}/cruise-ships/${ship.slug}/${port.portSlug}-shore-excursions`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE}/cruise-ships/${ship.slug}/${port.portSlug}-shore-excursions`,
      siteName: "Last Frontier Shore Excursions",
    },
  };
}

export default async function ShipPortExcursionsPage({ params }: ShipPortRouteProps) {
  const { shipSlug, portSlug } = await params;
  const pair = getShipPortPair(shipSlug, portSlug);

  if (!pair) {
    notFound();
  }

  const { ship, port } = pair;

  const faqs = [
    {
      question: `Where does the ${ship.name} dock in ${port.portName}?`,
      answer: `The ${ship.name} frequently berths at ${port.typicalDock}. Dock assignments are determined by the local harbor master, and complimentary port shuttles or local buses connect outer berths to central departure staging areas.`
    },
    {
      question: `Can ${ship.name} passengers book independent ${port.portName} shore excursions?`,
      answer: `Yes. Independent shore excursions offer smaller groups and direct local operator rates. Confirm meeting logistics and allow at least ${port.recommendedBufferMinutes} minutes of buffer before your ship's scheduled all-aboard time.`
    },
    {
      question: `How much time do ${ship.name} guests have in ${port.portName}?`,
      answer: `Most ${ship.name} port calls in ${port.portName} last ${port.typicalPortHours}. Tours under ${port.maxTourDurationHours} hours provide the safest window for exploring comfortably.`
    },
    {
      question: `What happens if weather affects our ${port.portName} port call?`,
      answer: `Reputable local tour operators provide full refunds if your ship bypasses the port or arrives with modified hours that prevent tour participation.`
    }
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TravelGuide",
      name: `Best ${port.portName} Shore Excursions from ${ship.name}`,
      description: `Shore excursion guide and dock logistics for ${ship.name} cruise passengers visiting ${port.portName}, Alaska.`,
      url: `${SITE}/cruise-ships/${ship.slug}/${port.portSlug}-shore-excursions`,
      about: {
        "@type": "TouristDestination",
        name: `${port.portName}, Alaska`
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Cruise Ships", item: `${SITE}/cruise-ships` },
        { "@type": "ListItem", position: 3, name: ship.name, item: `${SITE}/cruise-ships/${ship.slug}` },
        { "@type": "ListItem", position: 4, name: `${port.portName} Excursions`, item: `${SITE}/cruise-ships/${ship.slug}/${port.portSlug}-shore-excursions` }
      ]
    }
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Section */}
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">
            <Link href="/cruise-ships" style={{ color: "inherit", textDecoration: "none" }}>Cruise Ships</Link> /{" "}
            <Link href={`/cruise-ships/${ship.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{ship.name}</Link> /{" "}
            {port.portName}
          </p>
          <h1>Best {port.portName} Shore Excursions from {ship.name}</h1>
          <p className="lead">
            Passengers sailing on the <strong>{ship.name}</strong> ({ship.cruiseLine}) have a dedicated port day in {port.portName}. Because port hours, dock assignments, and transit shuttles vary by ship, choosing excursions that match your vessel’s schedule ensures a smooth, worry-free day in Alaska.
          </p>

          {/* Quick Ship Intel Box */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 24, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: 18, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)" }}>
            <div>
              <span style={{ fontSize: 11, color: "#d8e9ed", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Vessel & Class</span>
              <div style={{ fontWeight: 700, color: "white", fontSize: 15 }}>{ship.name} ({ship.shipClass})</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#d8e9ed", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Typical Berth</span>
              <div style={{ fontWeight: 700, color: "white", fontSize: 15 }}>{port.typicalDock}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#d8e9ed", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Port Time Window</span>
              <div style={{ fontWeight: 700, color: "white", fontSize: 15 }}>{port.typicalPortHours}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "#d8e9ed", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Planning Margin</span>
              <div style={{ fontWeight: 700, color: "#ffeedb", fontSize: 15 }}>{port.recommendedBufferMinutes} min buffer recommended</div>
            </div>
          </div>
        </div>
      </section>

      <div className="shell" style={{ padding: "48px 20px" }}>
        {/* Section 1: Curated Excursions */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 24 }}>
            <span className="eyebrow" style={{ color: "var(--accent)" }}>Curated Experiences</span>
            <h2 style={{ fontSize: 32, margin: "6px 0", color: "var(--deep)" }}>Best {ship.name} Excursions in {port.portName}</h2>
            <p style={{ color: "var(--muted)", maxWidth: 780, fontSize: 16 }}>
              These high-rated excursions fit comfortably within the typical {ship.name} port window while leaving adequate transit time before your ship’s all-aboard call.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {port.sampleTours.map((tour, idx) => {
              const trackedBookingUrl = getTrackedTourUrl(tour.title, port.portName, ship.slug);

              return (
                <div
                  key={idx}
                  style={{
                    background: "white",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "var(--card-shadow)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <h3 style={{ fontSize: 20, margin: 0, color: "var(--deep)", lineHeight: 1.3 }}>{tour.title}</h3>
                      <span style={{ fontSize: 12, fontWeight: 700, background: "var(--ice)", color: "var(--forest)", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                        {tour.durationHours} hrs
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700, marginTop: 6 }}>
                      {tour.activityType}
                    </div>
                    <p style={{ color: "var(--ink)", fontSize: 14, lineHeight: 1.5, margin: "12px 0" }}>
                      {tour.highlight}
                    </p>
                    <div style={{ padding: "10px 12px", background: "var(--ice)", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13, color: "var(--muted)" }}>
                      <strong style={{ color: "var(--deep)" }}>Meeting Logistics:</strong> {tour.meetingLogistics}
                    </div>
                  </div>

                  <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                    <a
                      href={trackedBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button small"
                      style={{ width: "100%", display: "block", textAlign: "center" }}
                    >
                      Check Rates & Departures on Viator &rarr;
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Dock & Schedule Logistics */}
        <section style={{ marginBottom: 48, background: "var(--ice)", padding: 32, borderRadius: 12, border: "1px solid var(--line)" }}>
          <span className="eyebrow" style={{ color: "var(--forest)" }}>Schedule Logistics</span>
          <h2 style={{ fontSize: 26, margin: "6px 0 16px", color: "var(--deep)" }}>How Much Time Do You Have in {port.portName}?</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 8, border: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: 16, margin: "0 0 8px", color: "var(--deep)" }}>Dock & Shuttle Notes</h3>
              <p style={{ color: "var(--ink)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                {port.dockLogisticsNotes}
              </p>
            </div>

            <div style={{ background: "white", padding: 20, borderRadius: 8, border: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: 16, margin: "0 0 8px", color: "var(--deep)" }}>Timing Guardrails</h3>
              <ul style={{ color: "var(--ink)", fontSize: 14, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                <li><strong>Max Tour Duration:</strong> Up to {port.maxTourDurationHours} hours recommended.</li>
                <li><strong>Return Buffer:</strong> Allow at least {port.recommendedBufferMinutes} minutes prior to all-aboard.</li>
                <li><strong>Tender Requirement:</strong> {port.tenderRequired ? "Tender boat operations required." : "Direct deepwater dock berthing under standard port schedules."}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Tour Categories */}
        <section style={{ marginBottom: 48 }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>Tour Categories</span>
          <h2 style={{ fontSize: 26, margin: "6px 0 12px", color: "var(--deep)" }}>Popular Excursion Types for {ship.name} Guests</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {port.recommendedExcursionTypes.map((type, i) => (
              <span key={i} style={{ background: "white", border: "1px solid var(--line)", color: "var(--deep)", padding: "6px 14px", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>
                {type}
              </span>
            ))}
          </div>
        </section>

        {/* Section 4: How to Choose */}
        <section style={{ marginBottom: 48 }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>Traveler Advice</span>
          <h2 style={{ fontSize: 26, margin: "6px 0 16px", color: "var(--deep)" }}>How to Choose an Excursion Before Returning to {ship.name}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, color: "var(--ink)", fontSize: 15, lineHeight: 1.6 }}>
            <p>
              1. <strong>Confirm Your Morning Arrival Time:</strong> Cross-reference your ship’s daily program on arrival day. Port hours can shift slightly due to coastal tides or harbor traffic.
            </p>
            <p>
              2. <strong>Account for Meeting Location Logistics:</strong> Independent excursions typically depart from downtown tour lots (such as the Mt. Roberts Tram plaza in Juneau or the Visitors Center in Ketchikan). If {ship.name} is berthed at an outer dock (such as AJ Dock or Ward Cove), budget 15–25 minutes for the port shuttle.
            </p>
            <p>
              3. <strong>Book with Cruise-Friendly Operators:</strong> Choose operators offering free cancellation if weather or navigational issues prevent docking.
            </p>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section style={{ marginBottom: 48 }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>Frequently Asked Questions</span>
          <h2 style={{ fontSize: 26, margin: "6px 0 16px", color: "var(--deep)" }}>{ship.name} {port.portName} Excursion FAQ</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{ background: "white", border: "1px solid var(--line)", borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 6px", color: "var(--deep)" }}>{faq.question}</h3>
                <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & Transparency Disclosure */}
        <div style={{ marginTop: 40 }}>
          <TrustDisclosure />
        </div>
      </div>
    </>
  );
}