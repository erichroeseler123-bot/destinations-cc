import type { Metadata } from 'next';
import Link from 'next/link';
import { NEW_ORLEANS_ORIGIN } from '../../tours/pageConfig';

export const metadata: Metadata = {
  title: 'Visitor Rewards | New Orleans Concierge Desk',
  description: 'Ask New Orleans Concierge Desk whether a current promotional visitor reward is available. Full sponsor, eligibility, presentation and redemption terms are provided before participation.',
  alternates: { canonical: `${NEW_ORLEANS_ORIGIN}/guides/visitor-rewards` },
};

const inquiryText = encodeURIComponent('Hi New Orleans Concierge Desk — I want to ask whether a current Visitor Reward promotion is available and receive the full eligibility and presentation terms.');

export default function VisitorRewardsPage() {
  return (
    <main className="bg-[#151515] min-h-screen text-[#fdfbf7]">
      <section className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37] mb-4">Optional promotional offers</p><h1 className="font-[var(--font-accent)] text-4xl md:text-6xl font-bold">Ask About Visitor Rewards</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">Some visitors may be eligible for third-party promotional rewards connected with a timeshare sales presentation. Ask the Concierge Desk for the current written offer and qualification rules before deciding whether to participate.</p></div></section>
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-16 space-y-10">
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-7"><p className="font-bold text-white">Important disclosure</p><p className="mt-3 text-[#ccc] leading-relaxed"><strong className="text-white">These promotions are used for the purpose of soliciting sales of timeshare interests.</strong> Participation may require meeting eligibility rules and attending a timeshare sales presentation. You do not need to participate in a promotion to use the New Orleans Concierge Desk, book tours, or attend the $5 French Quarter Orientation.</p></section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">How to inquire</h2><p className="mt-4 text-[#ccc] leading-relaxed">Contact us and ask for the current written Visitor Reward promotion. Before you agree to participate, the sponsoring company should provide the exact reward, retail or cash value where applicable, eligibility requirements, complete promotion rules, presentation requirement, sponsor identity, and redemption terms.</p><div className="mt-7 flex flex-col sm:flex-row gap-3"><a href={`sms:+15044849687?body=${inquiryText}`} className="bg-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#151515] hover:bg-white">Text About Visitor Rewards</a><a href="tel:+15044849687" className="border border-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37] hover:text-[#151515]">Call the Concierge Desk</a></div></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-xl font-bold">Why the exact reward is not listed here yet</h2><p className="mt-3 text-sm leading-relaxed text-[#aaa]">Promotional reward terms can vary by sponsor and campaign. We only publish specific reward values or resort-stay claims after we have the current written rules needed to describe the offer accurately.</p></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link href="/guides/french-quarter-orientation" className="text-[#d4af37] underline underline-offset-4">$5 French Quarter Orientation</Link><Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse tours</Link><Link href="/french-quarter-welcome-stop" className="text-[#d4af37] underline underline-offset-4">Concierge help</Link></nav>
      </div>
    </main>
  );
}
