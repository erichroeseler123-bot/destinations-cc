import type { Metadata } from "next";
import Link from "next/link";
import { COLORADO_TRANSFERS } from "@/lib/coloradoTransfers";

export const metadata: Metadata = {
  title: "420-Friendly Colorado Airport Transfers from DEN",
  description:
    "Private Denver airport transfers for adults 21+ to Colorado mountain destinations, with an optional dispensary stop included at no additional transportation charge.",
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
            Private DEN transportation to Colorado mountain destinations with an optional dispensary stop included at no additional transportation charge.
          </p>
          <p className="hero-copy">
            Pick your destination here, then continue into GoSno for live availability, vehicle options, and final booking.
          </p>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Mountain destinations</p>
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
        <p className="eyebrow">How the 420-friendly option works</p>
        <h2>Transportation first. Optional retail stop second.</h2>
        <ul>
          <li>The underlying trip is a private airport-to-destination transfer fulfilled through GoSno.</li>
          <li>An optional dispensary stop may be included at no additional transportation charge when lawful and practical.</li>
          <li>Passengers make any retail purchases independently from the retailer.</li>
          <li>No cannabis consumption is permitted in the vehicle.</li>
        </ul>
      </section>
    </main>
  );
}
