import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllAlaskaShips, getShipBySlug } from "@/lib/alaska-ships";

const SITE = "https://www.lastfrontiershoreexcursions.com";

type ShipPageProps = {
  params: Promise<{ shipSlug: string }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return getAllAlaskaShips().map((ship) => ({
    shipSlug: ship.slug,
  }));
}

export async function generateMetadata({ params }: ShipPageProps): Promise<Metadata> {
  const { shipSlug } = await params;
  const ship = getShipBySlug(shipSlug);

  if (!ship) {
    return {
      title: "Alaska Cruise Ship Shore Excursions | Last Frontier",
      description: "Find verified Alaska shore excursions by cruise ship and port.",
    };
  }

  const portNames = Object.values(ship.ports).map((p) => p.portName).join(", ");
  return {
    title: `${ship.name} Alaska Shore Excursions (${ship.cruiseLine} Port Guides)`,
    description: `Complete port guides and verified shore excursions for ${ship.name} guests visiting ${portNames}. Dock logistics, safe tour durations, and transfer notes.`,
    alternates: { canonical: `${SITE}/cruise-ships/${ship.slug}` },
    openGraph: {
      title: `${ship.name} Alaska Shore Excursions | Last Frontier`,
      description: `Complete port guides and verified shore excursions for ${ship.name} guests visiting ${portNames}.`,
      url: `${SITE}/cruise-ships/${ship.slug}`,
      siteName: "Last Frontier Shore Excursions",
    },
  };
}

export default async function ShipOverviewPage({ params }: ShipPageProps) {
  const { shipSlug } = await params;
  const ship = getShipBySlug(shipSlug);

  if (!ship) {
    notFound();
  }

  const portsList = Object.values(ship.ports);

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: `${ship.name} Alaska Shore Excursions`,
    description: ship.summaryDescription,
    provider: {
      "@type": "Organization",
      name: ship.cruiseLine,
    },
    itinerary: {
      "@type": "ItemList",
      itemListElement: portsList.map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${ship.name} at ${p.portName}`,
        url: `${SITE}/cruise-ships/${ship.slug}/${p.portSlug}-shore-excursions`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="hero">
        <div className="shell">
          <p className="eyebrow">
            <Link href="/cruise-ships" style={{ color: "inherit", textDecoration: "none" }}>Cruise Ships</Link> / {ship.cruiseLine}
          </p>
          <h1>{ship.name} Alaska Shore Excursions</h1>
          <p className="lead">{ship.summaryDescription}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <span style={{ fontSize: 13, background: "rgba(255,255,255,0.15)", color: "white", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
              {ship.shipClass}
            </span>
            <span style={{ fontSize: 13, background: "rgba(255,255,255,0.15)", color: "white", padding: "4px 12px", borderRadius: 20 }}>
              Capacity: {ship.passengerCapacity.toLocaleString()} guests
            </span>
            <span style={{ fontSize: 13, background: "rgba(255,255,255,0.15)", color: "white", padding: "4px 12px", borderRadius: 20 }}>
              Homeports: {ship.homeportOptions.join(", ")}
            </span>
          </div>
        </div>
      </section>

      <div className="shell" style={{ padding: "48px 20px" }}>
        <div style={{ marginBottom: 32 }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>Verified Port Calls</span>
          <h2 style={{ fontSize: 32, margin: "8px 0", color: "var(--deep)" }}>Choose Your {ship.name} Port Day</h2>
          <p style={{ color: "var(--muted)", maxWidth: 700, fontSize: 16 }}>
            Select your port of call to view verified dock notes, transit advice, and excursion durations calibrated for {ship.name} passengers.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {portsList.map((port) => (
            <Link
              key={port.portSlug}
              href={`/cruise-ships/${ship.slug}/${port.portSlug}-shore-excursions`}
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
                  <h3 style={{ fontSize: 22, margin: 0, color: "var(--deep)" }}>{port.portName} Shore Excursions</h3>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--forest)", background: "var(--ice)", padding: "3px 8px", borderRadius: 6 }}>
                    {port.portRegion}
                  </span>
                </div>
                <p style={{ marginTop: 12, color: "var(--ink)", fontSize: 14, lineHeight: 1.5 }}>
                  <strong>Typical Berth:</strong> {port.typicalDock}
                </p>
                <p style={{ marginTop: 4, color: "var(--ink)", fontSize: 14, lineHeight: 1.5 }}>
                  <strong>Time in Port:</strong> {port.typicalPortHours}
                </p>
              </div>

              <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12, color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
                View {port.portName} Excursions for {ship.name} &rarr;
              </div>
            </Link>
          ))}
        </div>

        <section style={{ marginTop: 64, background: "var(--ice)", padding: 32, borderRadius: 12, border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: 24, margin: "0 0 12px", color: "var(--deep)" }}>The Last Frontier Planning Standard for {ship.name}</h2>
          <p style={{ color: "var(--ink)", lineHeight: 1.6, fontSize: 15 }}>
            Every excursion recommendation on Last Frontier is evaluated against our <strong>45-Minute Planning Standard</strong>:
            tour end time + meeting logistics buffer + 45 minutes must conclude before your ship’s scheduled all-aboard call.
          </p>
          <p style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: 14, marginTop: 8 }}>
            Note: Berth locations and port times are assigned by local harbor masters and may adjust based on weather or sea conditions. Always check your daily ship planner on arrival.
          </p>
        </section>
      </div>
    </>
  );
}