import Link from 'next/link';

type Variant = 'prominent' | 'compact' | 'short' | 'oneline';

export default function FrenchQuarterBoothBonus({ variant = 'prominent' }: { variant?: Variant }) {
  if (variant === 'oneline') {
    return (
      <div className="text-center text-[10px] md:text-xs text-white/60 mt-4 px-6 border-t border-white/10 pt-4 max-w-4xl mx-auto">
        Start the day with the <Link href="/french-quarter-orientation" className="underline hover:text-white transition-colors">$5 French Quarter Orientation</Link> — daily at 8:00 AM and 9:30 AM by the Moonwalk beside Café Du Monde. Or <Link href="/french-quarter-welcome-stop" className="underline hover:text-white transition-colors">ask the New Orleans Concierge Desk for planning help</Link>.
      </div>
    );
  }

  const compactClass = variant === 'compact' ? 'bg-[#FDFBF7] text-[#1a1a1a] border-[#E5E0D8]' : 'bg-[#111] text-white border-[#333]';

  if (variant === 'short' || variant === 'compact') {
    return (
      <div className={`${compactClass} border p-6 mt-6 shadow-sm`}>
        <h4 className="font-bold text-[#d4af37] text-sm uppercase tracking-widest mb-3">New Orleans Concierge Desk</h4>
        <p className="text-sm opacity-80 mb-4 leading-relaxed">Need a quick first step? Our $5 French Quarter morning orientation is 30 minutes and includes a Welcome Packet with maps, local tips, coupons and participating offers.</p>
        <p className="text-xs opacity-70 mb-5">Daily at 8:00 AM and 9:30 AM. Meet at the Moonwalk by Café Du Monde and look for the yellow umbrella.</p>
        <Link href="/french-quarter-orientation" className="block w-full bg-[#d4af37] text-[#111] text-center py-3 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors">See Orientation Details</Link>
      </div>
    );
  }

  return (
    <section className="bg-[#111] border-y border-[#333] py-20 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="border border-[#333] bg-[#171717] p-8">
          <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-3">Start here</p>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">$5 French Quarter Orientation</h2>
          <p className="text-white/80 mb-5 leading-relaxed">A simple 30-minute morning orientation with a Welcome Packet, local pointers, maps, coupons and participating offers.</p>
          <ul className="text-white/70 text-sm space-y-2 mb-6">
            <li>8:00 AM or 9:30 AM daily</li>
            <li>Moonwalk by Café Du Monde</li>
            <li>Look for the yellow umbrella</li>
          </ul>
          <Link href="/french-quarter-orientation" className="inline-block bg-[#d4af37] text-black font-bold px-6 py-3 text-xs uppercase tracking-widest hover:bg-white">Reserve a $5 Spot</Link>
        </div>
        <div className="border border-[#333] bg-[#171717] p-8">
          <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-3">Need more help?</p>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">New Orleans Concierge Desk</h2>
          <p className="text-white/80 mb-6 leading-relaxed">Compare tours, work through timing and transportation, and get help choosing what fits your group.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="tel:+15044849687" className="inline-block bg-[#d4af37] text-black font-bold px-6 py-3 text-xs uppercase tracking-widest text-center hover:bg-white">Call the Desk</a>
            <Link href="/visitor-rewards" className="inline-block border border-[#d4af37] text-[#d4af37] font-bold px-6 py-3 text-xs uppercase tracking-widest text-center hover:bg-[#d4af37] hover:text-black">Visitor Rewards</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
