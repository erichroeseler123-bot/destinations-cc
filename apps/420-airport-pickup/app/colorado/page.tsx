import type { Metadata } from "next";
import Link from "next/link";
import { COLORADO_TRANSFERS } from "@/lib/coloradoTransfers";

export const metadata: Metadata = {
  title: "420-Friendly Colorado Airport Transfers from DEN",
  description:
    "Private Denver airport transfers for adults 21+ to Colorado Springs and mountain destinations, with an optional lawful dispensary stop when practical for the route and timing.",
  alternates: { canonical: "/colorado" },
};

export default function ColoradoTransfersPage() {
  return (
    <main className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Colorado private transfers · adults 21+</p>
          <h1>Go beyond Denver without giving up the 420-friendly arrival.</h1>
          <p className="arrival-line">
            Private DEN transportation to Colorado Springs and mountain destinations with an optional lawful dispensary stop when practical for the route and timing.
          </p>
          <p className="hero-copy">
            Pick your destination here, then continue into GoSno for the applicable live route or quote flow. Flying into Colorado Springs Airport instead? Use the dedicated COS hub.
          </p>
          <div className="cta-row">
            <Link className="button-secondary" href="/colorado-springs-airport">Flying into COS?</Link>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">DEN destinations</p>
        <h2>Choose where you are headed.</h2>
        <div className="trust-grid">
          {COLORADO_TRANSFERS.map((transfer) => (
            <div className="trust-item" key={transfer.slug}>
              <strong>{transfer.destination}</strong>
              <p className="muted">{transfer.summary}</p>
              <p><Link href={`/colorado/${transfer.slug}`}>View {transfer.destination} transfer</Link></p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Colorado Springs Airport</p>
        <h2>COS is now part of the 420-friendly transportation surface.</h2>
        <p className="muted">
          The COS hub includes Colorado Springs-area pickup plus existing GoSno corridors to Breckenridge, Vail, Beaver Creek, Keystone, Copper Mountain, Winter Park, Aspen, Snowmass, and Steamboat Springs.
        </p>
        <div className="cta-row">
          <Link className="button" href="/colorado-springs-airport">Browse COS transportation</Link>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">How the 420-friendly option works</p>
        <h2>Transportation first. Optional retail stop second.</h2>
        <ul>
          <li>The underlying trip is a private airport-to-destination transfer fulfilled through GoSno.</li>
          <li>An optional dispensary stop may be included when lawful and practical.</li>
          <li>Passengers make any retail purchases independently from the retailer.</li>
          <li>No cannabis consumption is permitted in the vehicle.</li>
        </ul>
      </section>
    </main>
  );
}
