import Link from 'next/link';

type Variant = 'prominent' | 'compact' | 'short' | 'oneline';

export default function FrenchQuarterBoothBonus({ variant = 'prominent' }: { variant?: Variant }) {
  if (variant === 'oneline') {
    return (
      <div className="text-center text-[10px] md:text-xs text-[#5A4535] mt-4 px-6 border-t border-[#E2D7C3] pt-4 max-w-4xl mx-auto">
        Need help comparing tours?{' '}
        <Link href="/french-quarter-welcome-stop" className="underline hover:text-[#2C1810] transition-colors">
          Schedule Tour Help with the New Orleans Tour Concierge
        </Link>
        . Meetings are arranged in advance at an agreed location, and availability varies.{' '}
        <a href="tel:+15044849687" className="underline hover:text-[#2C1810] transition-colors">
          Call
        </a>{' '}
        or{' '}
        <a href="sms:+15044849687" className="underline hover:text-[#2C1810] transition-colors">
          text.
        </a>
      </div>
    );
  }

  if (variant === 'short') {
    return (
      <div className="bg-[#FAF5EC] p-5 mt-6 border border-[#E2D7C3] rounded-sm shadow-md text-[#2C1810]">
        <h4 className="font-bold text-[#C8831A] text-sm uppercase tracking-widest mb-3">New Orleans Tour Concierge</h4>
        <p className="text-sm text-[#5A4535] mb-3 leading-relaxed font-light">
          Schedule a relaxed tour-planning conversation at a convenient hotel, French Quarter, or nearby public meeting location. Bring the group, ask questions, and hear the available tour options before deciding.
        </p>
        <p className="text-[10px] text-[#5A4535] italic mb-4">
          Meetings are arranged in advance at a location agreed upon before the appointment, and availability varies.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+15044849687"
            className="block w-full bg-[#FAF5EC] text-[#2C1810] border border-[#C8831A] text-center py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#C8831A] hover:text-[#FAF5EC] transition-colors"
          >
            Call
          </a>
          <a
            href="sms:+15044849687"
            className="block w-full bg-[#FAF5EC] text-[#2C1810] border border-[#C8831A] text-center py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#C8831A] hover:text-[#FAF5EC] transition-colors"
          >
            Text
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-[#FAF5EC] border-2 border-[#E2D7C3] p-6 mt-8 shadow-sm text-[#2C1810]">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <span className="text-xl">⚜️</span>
          <h4 className="font-[var(--font-accent)] font-bold text-lg text-[#2C1810] uppercase tracking-tight text-center">
            New Orleans Tour Concierge
          </h4>
        </div>
        <p className="text-sm text-[#5A4535] mb-5 leading-relaxed text-center">
          Schedule a relaxed tour-planning conversation to compare available tour options. Meetings are arranged in advance at a location agreed upon before the appointment.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+15044849687"
            className="block w-full border-2 border-[#2C5E3B] text-[#2C5E3B] bg-transparent hover:bg-[#2C5E3B] hover:text-[#FAF5EC] text-center py-3 px-2 text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm"
          >
            Call
          </a>
          <a
            href="sms:+15044849687"
            className="block w-full border-2 border-[#2C5E3B] text-[#2C5E3B] bg-transparent hover:bg-[#2C5E3B] hover:text-[#FAF5EC] text-center py-3 px-2 text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm"
          >
            Text
          </a>
        </div>
        <p className="text-[10px] text-[#5A4535] italic mt-4 text-center">
          Availability varies. Call or text to schedule tour help arranged in advance.
        </p>
      </div>
    );
  }

  // Prominent (for homepage or major surfaces)
  return (
    <section className="bg-[#F5EEDB] border-y border-[#E2D7C3] py-20 px-6 text-[#2C1810]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
        <div className="md:w-5/12 text-center md:text-left">
          <span className="text-[#C8831A] text-4xl mb-6 block">⚜️</span>
          <h2 className="text-4xl md:text-5xl lg:text-5xl font-serif font-bold text-[#4A1A6B] mb-4 uppercase leading-tight tracking-tight">
            Meet your<br /><span className="text-[#C8831A]">Tour Concierge</span>
          </h2>
        </div>
        <div className="md:w-7/12 md:pl-12 border-t md:border-t-0 md:border-l border-[#E2D7C3] pt-10 md:pt-0">
          <p className="text-[#5A4535] mb-6 text-sm md:text-base leading-relaxed font-light">
            Already in New Orleans? Schedule a relaxed tour-planning conversation at a convenient hotel, French Quarter, or nearby public meeting location. Bring the group, ask questions, and hear the available tour options before deciding.
          </p>
          <ol className="list-decimal list-inside text-[#5A4535] text-sm md:text-base leading-relaxed mb-8 space-y-3 font-light">
            <li>Call or text to schedule tour help.</li>
            <li>Agree on a convenient meeting location in advance.</li>
            <li>Meet and compare the available tour options.</li>
          </ol>
          <div className="bg-[#FAF5EC] p-6 md:p-8 border border-[#E2D7C3] mb-6 rounded-sm shadow-md">
            <p className="text-[#2C1810] text-sm mb-6 leading-relaxed font-light">
              Meetings are arranged in advance at a location agreed upon before the appointment. Availability varies.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:+15044849687"
                className="inline-block bg-[#C8831A] text-[#FAF5EC] hover:bg-[#4A1A6B] font-bold px-8 py-4 text-[11px] md:text-xs uppercase tracking-[0.2em] transition-colors rounded-sm shadow text-center"
              >
                Call to Schedule
              </a>
              <a
                href="sms:+15044849687"
                className="inline-block border border-[#C8831A] text-[#C8831A] hover:bg-[#C8831A] hover:text-[#FAF5EC] font-bold px-8 py-4 text-[11px] md:text-xs uppercase tracking-[0.2em] transition-colors rounded-sm text-center"
              >
                Text to Schedule
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
