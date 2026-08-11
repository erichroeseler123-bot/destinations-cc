import type { Metadata } from 'next';
import Link from 'next/link';
import { NEW_ORLEANS_ORIGIN } from '../tours/pageConfig';

export const metadata: Metadata = {
  title: '$5 French Quarter Orientation | New Orleans Concierge Desk',
  description: 'Start your New Orleans morning with a 30-minute French Quarter orientation at 8:00 AM or 9:30 AM by the Moonwalk beside Café Du Monde. $5 per person, Welcome Packet included.',
  alternates: { canonical: `${NEW_ORLEANS_ORIGIN}/french-quarter-orientation` },
};

const reserveText = encodeURIComponent('Hi New Orleans Concierge Desk — I want to reserve the $5 French Quarter Orientation. Please send me the next available 8:00 AM or 9:30 AM date/time.');
const viatorBookingUrl = 'https://www.viator.com/MptUrl?p=AOMuBd88egjTNqGFfktRHfPzzfANtm8Zoeew5MGSiLGTRQ19BcVhY2DoQtRHFLagzEGaw7HY43Lf6SAw3oN31fuOeJ5oTvJ5vHdO6bbQ%2FB%2FaLFHYcbbISpTCXehJUMz70diZyh0Q2IoEdbLfTkcbj%2FO%2BP4jOzlq6N1iDVtKkjo8rA6NGevtjO0Ncb5lIHH7L96ZWKIMbNZJUliQ9b6mRJPo0sFQfuS1TFq2EIY7ybnP59PfpGs4b1RhQ5z8LTPjxGDfC23RDaALAFdvSceadW4c8MfQcsqgoryW%2Fcpkpe9vD15825BQn1lkGN29%2FczXTtCe1j32%2B5GdhqOPwJN%2BDtICmUgCv7V050vjeD7jWck%2FuBCvcPRUrsszTUqEGLu9DiB5QKFLiMGP1CKmQ%2BBBt4U5WlFa8uAEKh0rhwtisfDnK9j8BfJayfPg2bwbAs%2Fcmlg%3D%3D';

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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Online booking is live</p>
          <h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">Reserve your spot</h2>
          <p className="mt-4 max-w-3xl text-[#ccc]">Book the New Orleans Orientation Pass online through Viator for instant confirmation, or text/call the Concierge Desk if you want help choosing a date or planning the rest of your visit.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href={viatorBookingUrl} target="_blank" rel="noopener noreferrer" className="bg-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#151515] hover:bg-white">Book Online — $5</a>
            <a href={`sms:+15044849687?body=${reserveText}`} className="border border-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37] hover:text-[#151515]">Text for Help</a>
            <a href="tel:+15044849687" className="border border-[#555] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#eee] hover:border-[#d4af37] hover:text-[#d4af37]">Call 504-484-9687</a>
          </div>
          <p className="mt-4 text-xs text-[#888]">Final availability and booking terms are shown by Viator before checkout. If you contact us directly, we can help with date/time questions and meeting instructions.</p>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold mb-4">After the orientation</h2>
          <p className="text-[#ccc] max-w-3xl leading-relaxed">You can head out on your own, use the Welcome Packet, compare tours, or ask the New Orleans Concierge Desk to help you choose what fits your group.</p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse tours</Link>
            <Link href="/compare" className="text-[#d4af37] underline underline-offset-4">Compare tours</Link>
            <Link href="/visitor-rewards" className="text-[#d4af37] underline underline-offset-4">Ask about visitor rewards</Link>
          </div>
        </section>

        <p className="text-xs text-[#777] border-t border-[#2a2a2a] pt-6">This $5 orientation is offered by New Orleans Concierge Desk. The online booking is processed by Viator. Third-party tours displayed elsewhere on this site are booked with their respective operators.</p>
      </div>
    </main>
  );
}
