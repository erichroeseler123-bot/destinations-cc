import type { Metadata } from 'next';
import Link from 'next/link';
import { NEW_ORLEANS_ORIGIN } from '../tours/pageConfig';

export const metadata: Metadata = {
  title: '$5 French Quarter Orientation | Welcome to New Orleans Tours',
  description: 'Start your New Orleans morning with a 30-minute French Quarter orientation at 8:00 AM or 9:30 AM by the Moonwalk beside Café Du Monde. $5 per person, Welcome Packet included.',
  alternates: { canonical: `${NEW_ORLEANS_ORIGIN}/french-quarter-orientation` },
};

const reserveText = encodeURIComponent('Hi Welcome to New Orleans Tours — I want to reserve the $5 French Quarter Orientation. Please send me the next available 8:00 AM or 9:30 AM date/time.');

export default function FrenchQuarterOrientationPage() {
  return (
    <main className="bg-[#151515] min-h-screen text-[#fdfbf7]">
      <section className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37] mb-4">The smartest first move of your New Orleans day</p>
          <h1 className="font-[var(--font-accent)] text-4xl md:text-6xl font-bold leading-tight">French Quarter Morning Orientation — $5</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">A quick 30-minute orientation before the city gets busy. Get your bearings, pick up the Welcome Packet, and leave with a simple plan for the French Quarter.</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16 space-y-12">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            ['Price', '$5 per person'],
            ['Times', '8:00 AM & 9:30 AM daily'],
            ['Length', '30 minutes'],
            ['Meet', 'Moonwalk by Café Du Monde'],
          ].map(([label, value]) => (
            <div key={label} className="border border-[#333] bg-[#1a1a1a] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">{label}</p>
              <p className="mt-2 text-sm text-[#eee]">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-[var(--font-accent)] text-3xl font-bold mb-5">What you get</h2>
            <ul className="space-y-3 text-[#ccc]">
              <li>• A 30-minute French Quarter orientation and daily briefing.</li>
              <li>• A physical Welcome Packet with maps and practical local tips.</li>
              <li>• Coupons, discount links and offers from participating local businesses.</li>
              <li>• Help understanding where things are and how to plan the rest of your day.</li>
              <li>• Tour and activity recommendations if you want them.</li>
            </ul>
          </div>
          <div className="border border-[#d4af37]/40 bg-[#1a1a1a] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Meeting point</p>
            <h2 className="mt-3 text-2xl font-bold">Moonwalk beside Café Du Monde</h2>
            <p className="mt-4 text-[#ccc] leading-relaxed">Look for the guide with the <strong className="text-white">yellow umbrella</strong> near the riverfront promenade. Coffee and beignets first works perfectly.</p>
          </div>
        </section>

        <section className="border-y border-[#333] py-10">
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Reserve your spot</h2>
          <p className="mt-4 max-w-3xl text-[#ccc]">Online card checkout is not connected yet. For now, reserve directly with Welcome to New Orleans Tours. The orientation is $5 per person; payment is handled at check-in until online checkout is activated.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href={`sms:+15044849687?body=${reserveText}`} className="bg-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#151515] hover:bg-white">Text to Reserve</a>
            <a href="tel:+15044849687" className="border border-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37] hover:text-[#151515]">Call 504-484-9687</a>
          </div>
          <p className="mt-4 text-xs text-[#888]">We will confirm the date, 8:00 AM or 9:30 AM time, number of guests, and meeting instructions.</p>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold mb-4">After the orientation</h2>
          <p className="text-[#ccc] max-w-3xl leading-relaxed">You can head out on your own, use the Welcome Packet, compare tours, or ask Welcome to New Orleans Tours to help you choose what fits your group.</p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse tours</Link>
            <Link href="/compare" className="text-[#d4af37] underline underline-offset-4">Compare tours</Link>
            <Link href="/visitor-rewards" className="text-[#d4af37] underline underline-offset-4">Ask about visitor rewards</Link>
          </div>
        </section>

        <p className="text-xs text-[#777] border-t border-[#2a2a2a] pt-6">This $5 orientation is offered by Welcome to New Orleans Tours. It is separate from third-party tours displayed elsewhere on this site.</p>
      </div>
    </main>
  );
}
