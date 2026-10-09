import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ALASKA_CRUISE_FLEET,
  getShipBySlug,
  calculateSailingContext,
} from "../../../lib/alaskaCruiseFleet";
import {
  buildShipWaitlistMetadata,
  buildShipFaqSchema,
} from "../../../lib/metadataMatrix";
import HelicopterWaitlistForm from "../../components/HelicopterWaitlistForm";
import SeatScannerTicker from "../../components/SeatScannerTicker";
import LiveSeatDropsBadge from "../../components/LiveSeatDropsBadge";

interface ShipWaitlistPageProps {
  params: Promise<{
    shipSlug: string;
  }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return ALASKA_CRUISE_FLEET.map((ship) => ({
    shipSlug: ship.slug,
  }));
}

export async function generateMetadata({ params }: ShipWaitlistPageProps): Promise<Metadata> {
  const { shipSlug } = await params;
  const ship = getShipBySlug(shipSlug);

  if (!ship) {
    return {
      title: "Alaska Cruise Ship Helicopter Waitlist | Juneau Flight Deck",
      description: "Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.",
    };
  }

  return buildShipWaitlistMetadata({ ship });
}

export default async function ShipWaitlistPage({ params }: ShipWaitlistPageProps) {
  const { shipSlug } = await params;
  const ship = getShipBySlug(shipSlug);

  if (!ship) {
    notFound();
  }

  const faqJsonLd = buildShipFaqSchema(ship);
  const context = calculateSailingContext(ship.slug, "2026-07-14");

  return (
    <main className="page-shell py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="site-shell max-w-5xl mx-auto px-4">
        <SeatScannerTicker />

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-full px-3.5 py-1 text-xs font-semibold text-sky-300 uppercase tracking-wider mb-3">
            <span>⚓ {ship.cruiseLine}</span>
            <span>•</span>
            <span>{ship.typicalScheduledBerth.split("(")[0].trim()}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
            {ship.shipName} Juneau Helicopter Excursions &amp; Availability Assistance
          </h1>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-4">
            Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, availability assistance for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Link
              href="/helicopter"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors"
            >
              Compare &amp; Book Open Tours →
            </Link>
            <Link
              href="/temsco-vs-coastal-vs-northstar-juneau"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-colors"
            >
              Compare Operators
            </Link>
            <a
              href="#waitlist-form"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-sky-300 font-semibold text-sm border border-sky-500/30 transition-colors"
            >
              Request Availability Help
            </a>
          </div>
        </div>

        {/* Live Urgency Badge */}
        <div className="mb-8">
          <LiveSeatDropsBadge showLink={false} />
        </div>

        {/* Dynamic Ship Port Schedule & Flight Window Box */}
        {context && (
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 mb-8 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3 mb-4">
              <span className="font-bold text-white text-base flex items-center gap-2">
                <span>⏱️</span> {ship.shipName} Juneau Port Timing Guide
              </span>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs px-2.5 py-0.5 rounded-full font-mono">
                Typical Scheduled Port Call
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Scheduled Juneau Berth</span>
                <strong className="text-white block">{context.juneauBerth}</strong>
                <small className="text-xs text-slate-400">Subject to CBJ harbor master assignment</small>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Typical Port Hours</span>
                <strong className="text-white block">{context.juneauPortHours}</strong>
                <small className="text-xs text-slate-400">Verify against your ship daily program</small>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Safety Return Buffer</span>
                <strong className="text-emerald-400 block">90–120 Min Target</strong>
                <small className="text-xs text-slate-400">Back before ship all-aboard call</small>
              </div>
            </div>

            {/* Skagway Next-Day Arbitrage Notice */}
            {ship.callsAtSkagway && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-amber-400 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    <span>💡</span> Skagway Glacier Alternative (If on your sailing)
                  </strong>
                  <p className="text-xs text-slate-300 mt-1 mb-0">
                    If your sailing visits Skagway ({ship.skagwayHours} at {ship.skagwayBerth}), TEMSCO Skagway operates dog mushing camps on the <strong>Denver Glacier</strong>.
                    You can enter your Skagway date in the form below to request help for both ports.
                  </p>
                </div>
                <Link
                  href="/skagway/helicopter"
                  className="button button-secondary text-xs py-1.5 px-3 flex-shrink-0"
                >
                  View Skagway Flights →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* The Intake Form (Pre-populated to this ship) */}
        <div id="waitlist-form" className="mb-12">
          <HelicopterWaitlistForm defaultPort="juneau" />
        </div>

        {/* Trust & Safe Return Manifesto */}
        <section className="section-block p-8 md:p-10 mb-12" aria-labelledby="safe-return-heading">
          <div className="section-heading mb-6">
            <p className="eyebrow">Local Juneau Dispatch Standards</p>
            <h2 id="safe-return-heading" className="text-2xl md:text-3xl font-bold text-white">
              Why {ship.shipName} Guests Book With Juneau Flight Deck
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <strong className="text-amber-400 block mb-1 text-sm">Operator Refund Protection</strong>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reservations carry flexible operator cancellation policies (24–48 hours) and 100% full refund for weather cancellations.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <strong className="text-amber-400 block mb-1 text-sm">Pier Shuttle Pickups</strong>
              <p className="text-xs text-slate-300 leading-relaxed">
                Shuttles meet you outside cruise terminal security gates with a 15-minute transfer to the heliport.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <strong className="text-amber-400 block mb-1 text-sm">Port Day Backup Option</strong>
              <p className="text-xs text-slate-300 leading-relaxed">
                If helicopter seats remain full, our dispatch team offers verified live availability for top-rated Auke Bay whale watching.
              </p>
            </div>
          </div>
        </section>

        {/* Browse Other Fleet Ships */}
        <section className="section-block p-6 md:p-8 mb-12">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Compare Other Alaska Cruise Ships
          </h3>
          <div className="flex flex-wrap gap-2">
            {ALASKA_CRUISE_FLEET.filter((s) => s.slug !== ship.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/helicopter-waitlist/${s.slug}`}
                className="text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition"
              >
                {s.shipName} ({s.cruiseLine.split(" ")[0]})
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
