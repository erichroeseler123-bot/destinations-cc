

type Variant = 'prominent' | 'compact' | 'short' | 'oneline';

export default function FrenchQuarterBoothBonus({ variant = 'prominent' }: { variant?: Variant }) {
  if (variant === 'oneline') {
    return (
      <div className="text-center text-[10px] md:text-xs text-white/50 mt-4 px-6 border-t border-white/10 pt-4 max-w-4xl mx-auto">
        Need help comparing tours? Learn about the <a href="/french-quarter-welcome-stop" className="underline hover:text-white transition-colors">New Orleans Tour Concierge</a>. Meetings are arranged in advance and availability varies. <a href="tel:+15044849687" className="underline hover:text-white transition-colors">Call</a> or <a href="sms:+15044849687" className="underline hover:text-white transition-colors">text to schedule.</a>
      </div>
    );
  }

  if (variant === 'short') {
    return (
      <div className="bg-black/30 p-5 mt-6 border border-[#2a2a2a] rounded-sm shadow-md">
        <h4 className="font-bold text-[#d4af37] text-sm uppercase tracking-widest mb-3">New Orleans Tour Concierge</h4>
        <p className="text-sm text-white/80 mb-3 leading-relaxed font-light">Schedule a relaxed conversation to compare the available tour options. We will agree on a convenient hotel, French Quarter, or nearby public meeting location before meeting.</p>
        <p className="text-[10px] text-white/50 italic mb-4">Meetings are arranged in advance and availability varies.</p>
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:+15044849687" className="block w-full bg-[#1a1a1a] text-white border border-[#333] text-center py-3 text-xs font-bold uppercase tracking-widest hover:border-[#d4af37] hover:text-[#d4af37] transition-colors">
            Call
          </a>
          <a href="sms:+15044849687" className="block w-full bg-[#1a1a1a] text-white border border-[#333] text-center py-3 text-xs font-bold uppercase tracking-widest hover:border-[#d4af37] hover:text-[#d4af37] transition-colors">
            Text
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-[#FDFBF7] border-2 border-[#E5E0D8] p-6 mt-8 shadow-sm">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <span className="text-xl">⚜️</span>
          <h4 className="font-[var(--font-accent)] font-bold text-lg text-[#1a1a1a] uppercase tracking-tight text-center">New Orleans Tour Concierge</h4>
        </div>
        <p className="text-sm text-[#666] mb-5 leading-relaxed text-center">
          Schedule a relaxed conversation to compare the available tour options. Meetings are arranged in advance at a location agreed upon before the meeting.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:+15044849687" className="block w-full border-2 border-[#0B3B24] text-[#0B3B24] bg-transparent hover:bg-[#0B3B24] hover:text-[#FDFBF7] text-center py-3 px-2 text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm">
            Call
          </a>
          <a href="sms:+15044849687" className="block w-full border-2 border-[#0B3B24] text-[#0B3B24] bg-transparent hover:bg-[#0B3B24] hover:text-[#FDFBF7] text-center py-3 px-2 text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm">
            Text
          </a>
        </div>
        <p className="text-[10px] text-[#666] italic mt-4 text-center">Availability varies. Call or text to schedule.</p>
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
            Meet your<br /><span className="text-[#d4af37]">Tour Concierge</span>
          </h2>
        </div>
        <div className="md:w-7/12 md:pl-12 border-t md:border-t-0 md:border-l border-[#333] pt-10 md:pt-0">
          <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed font-light">
            Already in New Orleans? Schedule a relaxed tour-planning conversation at a convenient hotel, French Quarter, or nearby public meeting location. Bring the group, ask questions, and hear the available tour options before deciding.
          </p>
          <ol className="list-decimal list-inside text-white/80 text-sm md:text-base leading-relaxed mb-8 space-y-3 font-light">
            <li>Call or text to schedule.</li>
            <li>Agree on a convenient meeting location in advance.</li>
            <li>Meet and compare the available tour options.</li>
          </ol>
          <div className="bg-black/50 p-6 md:p-8 border border-[#2a2a2a] mb-6 rounded-sm shadow-md">
            <p className="text-white/80 text-sm mb-6 leading-relaxed font-light">
              Meetings are arranged in advance. Availability varies.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:+15044849687" className="inline-block bg-[#d4af37] text-black hover:bg-white font-bold px-8 py-4 text-[11px] md:text-xs uppercase tracking-[0.2em] transition-colors rounded-sm shadow-lg shadow-black/50 text-center">
                Call to Schedule
              </a>
              <a href="sms:+15044849687" className="inline-block border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-bold px-8 py-4 text-[11px] md:text-xs uppercase tracking-[0.2em] transition-colors rounded-sm text-center">
                Text to Schedule
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
