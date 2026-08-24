import type { Metadata } from "next";
import Link from "next/link";
import { COS_TRANSFERS, buildCosGoSnoHref } from "@/lib/cosTransfers";

export const metadata: Metadata = {
  title: "420-Friendly Colorado Springs Airport Transportation | COS",
  description:
    "Private transportation from Colorado Springs Airport (COS) for adults 21+, including Colorado Springs and mountain destinations with optional lawful dispensary-stop planning when practical.",
  alternates: { canonical: "/colorado-springs-airport" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "420-Friendly Colorado Springs Airport Transportation",
    description:
      "Private COS airport transportation with Colorado Springs and mountain-route options plus optional lawful 21+ retail-stop planning when practical.",
    url: "https://420friendlyairportpickup.com/colorado-springs-airport",
    type: "website",
  },
};

export default function ColoradoSpringsAirportPage() {
  return (
    <main className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Colorado Springs Airport · COS · adults 21+</p>
          <h1>Land at COS. Keep the rest of Colorado private.</h1>
          <p className="arrival-line">
            Private transportation from Colorado Springs Airport to Colorado Springs and mountain destinations, with an optional lawful dispensary stop when practical for the route and timing.
          </p>
          <p className="hero-copy">
            GoSno already supports configured COS-to-mountain corridors. Local Colorado Springs trips are handled by quote so the route, vehicle, availability, and price can be confirmed before you commit.
          </p>
          <div className="cta-row">
            <a className="button" href={buildCosGoSnoHref(COS_TRANSFERS[0])}>Request COS → Colorado Springs</a>
            <Link className="button-secondary" href="/colorado">See DEN transfers</Link>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">COS private transfers</p>
        <h2>Choose where you are headed from Colorado Springs Airport.</h2>
        <p className="muted">
          Mountain-route availability, vehicles, final pricing, and booking terms are controlled by GoSno. The optional retail stop is an amenity, not the transportation product.
        </p>
        <div className="trust-grid" style={{ marginTop: 24 }}>
          {COS_TRANSFERS.map((transfer) => {
            const href = buildCosGoSnoHref(transfer);
            const cta = transfer.handoffMode === "quote" ? "Request a quote" : `Check ${transfer.destination} route`;
            return (
              <div className="trust-item" key={transfer.slug}>
                <strong>COS → {transfer.destination}</strong>
                <p className="muted">{transfer.summary}</p>
                <p><a href={href}>{cta}</a></p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">How the 420-friendly option works</p>
        <h2>Airport transportation first. Optional lawful retail stop second.</h2>
        <ul>
          <li>Private vehicle transportation from Colorado Springs Airport.</li>
          <li>A dispensary stop may be included when lawful and practical for the confirmed route and timing.</li>
          <li>Passengers make any retail purchase independently from the retailer.</li>
          <li>The transportation provider does not sell cannabis.</li>
          <li>No cannabis consumption is permitted in the vehicle.</li>
        </ul>
      </section>

      <section className="panel">
        <p className="eyebrow">Before you travel</p>
        <h2>Road and operating conditions still control the trip.</h2>
        <p className="muted">
          Weather, traffic, closures, mountain-road restrictions, retailer availability, property access, and applicable law can affect routing, timing, and whether an optional stop is practical. Use the GoSno booking or quote flow as the authority for the actual trip.
        </p>
      </section>
    </main>
  );
}
