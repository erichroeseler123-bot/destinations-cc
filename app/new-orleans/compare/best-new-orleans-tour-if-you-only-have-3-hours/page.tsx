import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best New Orleans Tours If You Only Have About 3 Hours",
  description:
    "Compare New Orleans tours that fit a short time window, including city sightseeing, ghost tours and cocktail walking tours with current published durations and check-in requirements.",
  alternates: { canonical: "/compare/best-new-orleans-tour-if-you-only-have-3-hours" },
};

const options = [
  {
    title: "City & Cemetery Sightseeing Tour + Garden District Stroll",
    duration: "3 hours",
    age: "Ages 6+",
    fit: "Best if you want the broadest overview of the city and can devote the full three-hour block.",
    caution: "Because the published tour itself is 3 hours, do not use this as a tight pre-flight or hard-deadline activity without extra buffer.",
    href: "/tours/city-tour-of-new-orleans",
  },
  {
    title: "Ghosts & Spirits Walking Tour",
    duration: "2 hours + 15-minute advance check-in",
    age: "All ages",
    fit: "Best for an evening window, especially if you are already in or near the French Quarter.",
    caution: "It is a walking tour on uneven sidewalks and streets; the operator notes alternate routes may be needed for wheelchairs.",
    href: "/tours/ghosts-spirits-walking-tour",
  },
  {
    title: "Craft Cocktail Walking Tour",
    duration: "2 hours + 15-minute advance check-in",
    age: "21+",
    fit: "Best for adults who want a compact French Quarter experience with cocktails and history.",
    caution: "This is 21+ and involves walking; exact locations and cocktails may change.",
    href: "/tours/cocktail-walking-tour",
  },
  {
    title: "Upgraded Craft Cocktail Walking Tour",
    duration: "2 hours 30 minutes + 15-minute advance check-in",
    age: "21+",
    fit: "Best if you have almost the full three hours and want a longer cocktail experience.",
    caution: "This leaves much less schedule buffer than the 2-hour version.",
    href: "/tours/craft-cocktail-walking-tour",
  },
];

export default function ThreeHourTourGuidePage() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Short-time decision guide</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">Best New Orleans tours if you only have about 3 hours</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">If three hours is a hard ceiling, the safest choices are tours whose published experience is closer to two hours. A tour advertised as exactly three hours may fit on paper, but it leaves no room for check-in, walking to the departure point, traffic, or a late return.</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 md:py-16">
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Best practical rule</p>
          <p className="mt-3 text-xl leading-relaxed">For a true three-hour window, favor a 2-hour walking tour and preserve roughly 45 minutes for check-in and getting to or from the meeting point. Choose a 3-hour city tour only when your schedule has additional buffer beyond those three hours.</p>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Four current options</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {options.map((option) => (
              <div key={option.title} className="border border-[#333] bg-[#1a1a1a] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37]">{option.duration}</p>
                <h3 className="mt-3 font-[var(--font-accent)] text-2xl font-bold">{option.title}</h3>
                <p className="mt-2 text-sm text-[#aaa]">{option.age}</p>
                <p className="mt-5 leading-relaxed text-[#ccc]">{option.fit}</p>
                <p className="mt-4 text-sm leading-relaxed text-[#aaa]"><strong className="text-[#ddd]">Schedule caution:</strong> {option.caution}</p>
                <Link href={option.href} className="mt-6 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4">View tour details →</Link>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Which one should you choose?</h2>
          <div className="mt-6 space-y-4 text-[#ccc] leading-relaxed">
            <p><strong className="text-[#fdfbf7]">First trip and you want to see a lot:</strong> the 3-hour city sightseeing tour gives the broadest overview, but only choose it when three hours is not your absolute door-to-door limit.</p>
            <p><strong className="text-[#fdfbf7]">Evening and staying in the French Quarter:</strong> the 2-hour Ghosts & Spirits tour is easier to fit because the current meeting point is 400 Toulouse Street and check-in is 15 minutes before departure.</p>
            <p><strong className="text-[#fdfbf7]">Adults who want drinks and history:</strong> the standard 2-hour cocktail tour gives you considerably more buffer than the upgraded 2.5-hour version.</p>
            <p><strong className="text-[#fdfbf7]">Before a flight, cruise departure or fixed reservation:</strong> do not treat the advertised duration as a guarantee of your exact door-to-door return time. Leave a meaningful buffer or choose an activity closer to where you are staying.</p>
          </div>
        </section>

        <section className="border border-[#333] bg-[#181818] p-6 md:p-8">
          <h2 className="font-[var(--font-accent)] text-2xl font-bold">What we intentionally did not claim</h2>
          <p className="mt-4 leading-relaxed text-[#ccc]">We are not promising that any tour will end at an exact minute or that a three-hour tour is safe before a flight or cruise. Published durations are planning guidance. Traffic, walking time, check-in and operational changes can affect the real time you need.</p>
        </section>

        <section className="border-t border-[#333] pt-8">
          <h2 className="text-lg font-bold">Sources checked</h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="https://www.graylineneworleans.com/haunted-city-cemetery-tours/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">Gray Line city & ghost tours</a>
            <a href="https://www.graylineneworleans.com/ghosts-spirits/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">Ghosts & Spirits details</a>
            <a href="https://www.graylineneworleans.com/food-drinks-tours/new-orleans-craft-cocktail-walking-tour-2/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">2-hour cocktail tour</a>
            <a href="https://www.graylineneworleans.com/food-drinks-tours/new-orleans-craft-cocktail-walking-tour/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">2.5-hour upgraded cocktail tour</a>
          </div>
        </section>

        <nav className="border-t border-[#2a2a2a] pt-8 text-sm flex flex-wrap gap-5">
          <Link href="/compare" className="text-[#d4af37] underline underline-offset-4">See all tour comparisons</Link>
          <Link href="/help-me-choose" className="text-[#d4af37] underline underline-offset-4">Use Help Me Choose</Link>
          <Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse all tours</Link>
        </nav>
      </div>
    </article>
  );
}
