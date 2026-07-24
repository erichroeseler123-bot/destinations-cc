

type Variant = 'prominent' | 'compact' | 'short' | 'oneline';

export default function FrenchQuarterBoothBonus({ variant = 'prominent' }: { variant?: Variant }) {
  if (variant === 'oneline') {
    return (
      <div className="text-center text-[10px] md:text-xs text-white/50 mt-4 px-6 border-t border-white/10 pt-4 max-w-4xl mx-auto">
        Book any featured tour through our site and get free local coupons and advice at our <a href="/french-quarter-welcome-stop" className="underline hover:text-white transition-colors">French Quarter Welcome Stop</a>. <a href="tel:+15044849687" className="underline hover:text-white transition-colors">Call for today's location.</a>
      </div>
    );
  }

  if (variant === 'short') {
    return (
      <div className="bg-black/30 p-5 mt-6 border border-[#2a2a2a] rounded-sm shadow-md">
        <h4 className="font-bold text-[#d4af37] text-sm uppercase tracking-widest mb-3">French Quarter Welcome Stop</h4>
        <p className="text-sm text-white/80 mb-3 leading-relaxed font-light">Book your selected tour through our site and you can also call to meet us at our French Quarter Welcome Stop for free coupons, a quick orientation and local planning help.</p>
        <p className="text-[10px] text-white/50 italic mb-4">Location and availability vary by day. Call before visiting.</p>
        <a href="tel:+15044849687" className="block w-full bg-[#1a1a1a] text-white border border-[#333] text-center py-3 text-xs font-bold uppercase tracking-widest hover:border-[#d4af37] hover:text-[#d4af37] transition-colors">
          Call for today's location
        </a>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-[#FDFBF7] border-2 border-[#E5E0D8] p-6 mt-8 shadow-sm">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <span className="text-xl">⚜️</span>
          <h4 className="font-[var(--font-accent)] font-bold text-lg text-[#1a1a1a] uppercase tracking-tight text-center">French Quarter Welcome Stop</h4>
        </div>
        <p className="text-sm text-[#666] mb-5 leading-relaxed text-center">
          Book this featured tour through our site and you can call to meet us at our French Quarter Welcome Stop for free local coupons, a quick orientation, local advice and help planning the rest of your visit.
        </p>
        <a href="tel:+15044849687" className="block w-full border-2 border-[#0B3B24] text-[#0B3B24] bg-transparent hover:bg-[#0B3B24] hover:text-[#FDFBF7] text-center py-3 px-2 text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm">
          Call for today's location
        </a>
        <p className="text-[10px] text-[#666] italic mt-4 text-center">Location and availability vary by day. Call before visiting.</p>
      </div>
    );
  }

  // Prominent (for homepage)
  return (
    <section className="bg-[#111] border-y border-[#333] py-20 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
        <div className="md:w-5/12 text-center md:text-left">
          <span className="text-[#d4af37] text-4xl mb-6 block">⚜️</span>
          <h2 className="text-4xl md:text-5xl lg:text-5xl font-serif font-bold text-white mb-4 uppercase leading-tight tracking-tight">
            Book a tour,<br />get more at our<br /><span className="text-[#d4af37]">Welcome Stop</span>
          </h2>
        </div>
        <div className="md:w-7/12 md:pl-12 border-t md:border-t-0 md:border-l border-[#333] pt-10 md:pt-0">
          <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed font-light">
            Customers who book a featured tour through our site receive the optional Welcome Stop benefit:
          </p>
          <ol className="list-decimal list-inside text-white/80 text-sm md:text-base leading-relaxed mb-8 space-y-3 font-light">
            <li>Book a featured tour through our site.</li>
            <li>Call for today’s Welcome Stop location.</li>
            <li>Pick up free local coupons.</li>
            <li>Get local advice and a quick orientation.</li>
            <li>Get help planning the rest of the visit.</li>
          </ol>
          <div className="bg-black/50 p-6 md:p-8 border border-[#2a2a2a] mb-6 rounded-sm shadow-md">
            <p className="text-white/80 text-sm mb-6 leading-relaxed font-light">
              This extra help is free with any tour booked through our site.
            </p>
            <a href="tel:+15044849687" className="inline-block bg-[#d4af37] text-black hover:bg-white font-bold px-8 py-4 text-[11px] md:text-xs uppercase tracking-[0.2em] transition-colors rounded-sm shadow-lg shadow-black/50 text-center w-full md:w-auto">
              Call for today's location
            </a>
          </div>
          <p className="text-white/40 text-xs italic font-light">
            Location and availability vary by day. Call before visiting.
          </p>
        </div>
      </div>
    </section>
  );
}
