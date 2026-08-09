import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Can Kids Ride Airboats in New Orleans? Age Rules & Better Options",
  description:
    "See current New Orleans airboat age rules, small vs large airboat capacity, safety restrictions, and the all-ages covered swamp boat alternative for families.",
  alternates: { canonical: "/guides/can-kids-ride-airboats-new-orleans" },
};

export default function KidsAirboatGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Family decision guide</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">Can kids ride airboats in New Orleans?</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">Some can, but the minimum age depends on the operator and product. The Gray Line small and large airboat tours checked here currently require guests to be <strong className="text-white">age 5 or older</strong>. Their covered Swamp & Bayou pontoon tour is listed for <strong className="text-white">all ages</strong>.</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 md:py-16">
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Fast answer</p>
          <p className="mt-3 text-xl leading-relaxed">If everyone in your group is 5+, an airboat may be an option. If you have a child under 5, start with an all-ages covered/pontoon swamp tour instead of assuming an airboat will accept them.</p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="border border-[#333] bg-[#1a1a1a] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37]">Small airboat</p>
            <h2 className="mt-3 text-2xl font-bold">Ages 5+</h2>
            <p className="mt-4 leading-relaxed text-[#bbb]">The transported Gray Line small airboat is listed for 6–12 passengers and can travel up to about 40 mph.</p>
            <Link className="mt-5 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4" href="/tours/small-airboat-swamp-adventure">View small airboat →</Link>
          </div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37]">Large airboat</p>
            <h2 className="mt-3 text-2xl font-bold">Ages 5+</h2>
            <p className="mt-4 leading-relaxed text-[#bbb]">The transported Gray Line large airboat is listed for roughly 15–27 passengers and uses the same 5+ minimum age.</p>
            <Link className="mt-5 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4" href="/tours/large-airboat-swamp-adventure">View large airboat →</Link>
          </div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37]">Covered pontoon</p>
            <h2 className="mt-3 text-2xl font-bold">All ages</h2>
            <p className="mt-4 leading-relaxed text-[#bbb]">Gray Line's Swamp & Bayou tour is currently listed for all ages and is a calmer alternative for mixed-age families.</p>
            <Link className="mt-5 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4" href="/tours/swamp-bayou-tour">View covered swamp tour →</Link>
          </div>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Age is not the only thing to check</h2>
          <div className="mt-6 space-y-4 leading-relaxed text-[#ccc]">
            <p><strong className="text-white">Noise:</strong> airboats are loud. If a child is very sensitive to noise, the faster format may be less comfortable even when they meet the age rule.</p>
            <p><strong className="text-white">Open-air exposure:</strong> airboats are exposed to sun, wind and spray. The operator says guests may get wet.</p>
            <p><strong className="text-white">Medical restrictions:</strong> the Gray Line airboat listings say the ride is not recommended for guests who are pregnant or who have certain neck, back, heart or other medical concerns.</p>
            <p><strong className="text-white">Mobility equipment:</strong> the checked airboat listings do not allow wheelchairs or strollers on the airboat. That can matter as much as age for a family group.</p>
          </div>
        </section>

        <section className="overflow-x-auto">
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Which swamp format fits your family?</h2>
          <table className="mt-6 w-full min-w-[700px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-[#444] text-[#d4af37]"><th className="p-3">Family situation</th><th className="p-3">Better starting point</th><th className="p-3">Why</th></tr></thead>
            <tbody className="text-[#ccc]">
              <tr className="border-b border-[#333]"><td className="p-3">Child under 5</td><td className="p-3 font-bold text-white">Covered/pontoon boat</td><td className="p-3">The checked airboats are 5+; the checked pontoon is all ages.</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3">Kids 5+ who want excitement</td><td className="p-3 font-bold text-white">Airboat</td><td className="p-3">Faster, open-air format with more wind/noise/spray.</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3">Noise-sensitive child</td><td className="p-3 font-bold text-white">Covered/pontoon boat</td><td className="p-3">Usually a gentler starting point than a high-powered airboat.</td></tr>
              <tr><td className="p-3">Family wants a smaller boat</td><td className="p-3 font-bold text-white">Small airboat</td><td className="p-3">The checked small-airboat listing carries 6–12 rather than 15–27.</td></tr>
            </tbody>
          </table>
        </section>

        <section className="border border-[#333] bg-[#181818] p-6 md:p-8">
          <h2 className="font-[var(--font-accent)] text-2xl font-bold">Do not apply this age rule to every operator</h2>
          <p className="mt-4 leading-relaxed text-[#ccc]">The 5+ rule on this page is based on the current Gray Line small and large airboat listings. Other New Orleans-area swamp operators can set different age, height, medical or participation rules. Always check the exact product you are booking.</p>
        </section>

        <section className="border-t border-[#333] pt-8">
          <h2 className="text-lg font-bold">Official sources checked</h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/swamp-tours/small-airboat-swamp-adventure-tour/">Small airboat</a>
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/">Large airboat</a>
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/">Swamp & Bayou pontoon</a>
          </div>
        </section>

        <nav className="border-t border-[#2a2a2a] pt-8 text-sm flex flex-wrap gap-5">
          <Link href="/compare/covered-swamp-boat-vs-airboat" className="text-[#d4af37] underline underline-offset-4">Covered boat vs airboat</Link>
          <Link href="/compare/small-vs-large-airboat" className="text-[#d4af37] underline underline-offset-4">Small vs large airboat</Link>
          <Link href="/guides/new-orleans-swamp-tour-without-a-car" className="text-[#d4af37] underline underline-offset-4">Swamp tours without a car</Link>
        </nav>
      </div>
    </article>
  );
}
