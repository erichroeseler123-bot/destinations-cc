import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  COLORADO_TRANSFERS,
  buildGoSnoHref,
  getColoradoTransfer,
} from "@/lib/coloradoTransfers";

export function generateStaticParams() {
  return COLORADO_TRANSFERS.map((transfer) => ({ slug: transfer.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const transfer = getColoradoTransfer(slug);
  if (!transfer) return {};

  const title = `420-Friendly DEN to ${transfer.destination} Private Transfer`;
  const description = `Private Denver airport transportation to ${transfer.destination} for adults 21+, with an optional lawful dispensary stop when practical for the route and timing.`;

  return {
    title,
    description,
    alternates: { canonical: `/colorado/${transfer.slug}` },
    openGraph: {
      title,
      description,
      url: `https://420friendlyairportpickup.com/colorado/${transfer.slug}`,
      type: "website",
    },
  };
}

export default async function ColoradoTransferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const transfer = getColoradoTransfer(slug);
  if (!transfer) notFound();

  const bookingHref = buildGoSnoHref(transfer);
  const isQuote = transfer.handoffMode === "quote";

  return (
    <main className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Private Colorado transfer · adults 21+</p>
          <h1>DEN to {transfer.destination}, with the arrival handled your way.</h1>
          <p className="arrival-line">
            Private airport transportation with an optional lawful dispensary stop when practical for the route and timing.
          </p>
          <p className="hero-copy">
            The transportation is fulfilled through GoSno. If you want the optional retail stop, it can be included when lawful and practical for the confirmed trip.
          </p>
          <div className="cta-row">
            <a className="button" href={bookingHref}>{isQuote ? `Request ${transfer.destination} quote` : `Check ${transfer.destination} transportation`}</a>
            <Link className="button-secondary" href="/colorado">See all Colorado destinations</Link>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">What is included</p>
        <h2>One private transfer. Optional 21+ stop.</h2>
        <div className="trust-grid">
          <div className="trust-item">
            <strong>Private DEN pickup</strong>
            <p className="muted">Start at Denver International Airport and continue privately to {transfer.destination}.</p>
          </div>
          <div className="trust-item">
            <strong>Optional dispensary stop</strong>
            <p className="muted">Included when the stop is lawful and practical for the confirmed route and schedule.</p>
          </div>
          <div className="trust-item">
            <strong>GoSno fulfillment</strong>
            <p className="muted">{isQuote ? "This corridor is confirmed by GoSno through a custom quote before booking." : "Availability, vehicle options, final pricing, and booking terms are handled by GoSno."}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Important</p>
        <h2>The stop is an amenity, not the product.</h2>
        <ul>
          <li>Adults 21+ only for retail cannabis purchases.</li>
          <li>Any purchase is made independently by the passenger from the retailer.</li>
          <li>The transportation provider does not sell cannabis.</li>
          <li>No cannabis consumption is permitted in the vehicle.</li>
          <li>Route, road, weather, timing, retailer availability, and applicable law can affect whether a stop is practical.</li>
        </ul>
      </section>

      <section className="panel">
        <p className="eyebrow">Continue with GoSno</p>
        <h2>{isQuote ? `Request a private transfer quote to ${transfer.destination}.` : `Ready for ${transfer.destination}?`}</h2>
        <p className="muted">{isQuote ? "The quote form is prefilled with DEN and Colorado Springs so GoSno can confirm the actual route, vehicle, availability, and price." : "Open the dedicated GoSno route page for current availability, vehicle options, and final pricing."}</p>
        <div className="cta-row">
          <a className="button" href={bookingHref}>{isQuote ? "Request GoSno quote" : "Continue to GoSno"}</a>
        </div>
      </section>
    </main>
  );
}
