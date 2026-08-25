import Link from "next/link";
import RestaurantOrientationAd from "./RestaurantOrientationAd";
import CinematicPageHero from "./CinematicPageHero";
import {
  eventCategory,
  formatLiveEventDate,
  getNewOrleansLiveEvents,
  type NewOrleansEventWindow,
} from "../lib/liveEvents";

type Props = {
  window?: NewOrleansEventWindow;
  title: string;
  eyebrow: string;
  intro: string;
};

const fallbackIdeas = [
  {
    href: "/guides/where-to-eat#new-orleans-staples",
    eyebrow: "Start with dinner",
    title: "Pick the meal first",
    description: "Choose a New Orleans staple or Dining Partner, then build the rest of the evening around where you already plan to be.",
    cta: "Find dinner",
  },
  {
    href: "/tours",
    eyebrow: "Bookable tonight",
    title: "Browse evening-friendly tours",
    description: "Compare river cruises, ghosts and spirits, cocktail walks, and other experiences that can work after the daytime sightseeing is done.",
    cta: "Browse tours",
  },
  {
    href: "/help-me-choose",
    eyebrow: "Too many choices?",
    title: "Tell us what kind of night you want",
    description: "Use the chooser to narrow the options by your group, pace, interests, timing, and how much structure you actually want.",
    cta: "Help me choose",
  },
] as const;

export default async function LiveNightGuide({
  window = "all",
  title,
  eyebrow,
  intro,
}: Props) {
  const { events, configured } = await getNewOrleansLiveEvents(window);
  const showFallback = !configured || events.length === 0;

  return (
    <main className="min-h-screen bg-[#080708] text-[#fdfbf7]">
      <CinematicPageHero
        eyebrow={eyebrow}
        title={title}
        script={window === "tonight" ? "after dark" : window === "weekend" ? "make a weekend of it" : "what's happening"}
        intro={intro}
        image="/images/wikimedia/originals/french-quarter-night.jpg"
        actions={[
          { href: "/guides/whats-happening", label: "What's Happening", detail: "Broader live view" },
          { href: "/guides/tonight", label: "Tonight", detail: "Evening ideas", primary: window === "tonight" },
          { href: "/guides/where-to-eat#new-orleans-staples", label: "Dinner First", detail: "Build the night around it" },
        ]}
      />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-9 flex flex-wrap gap-3 text-sm">
          <Link href="/guides/whats-happening" className="rounded-md border border-[#d4af37]/35 bg-[#111014] px-4 py-2 hover:border-[#d4af37]">What’s happening</Link>
          <Link href="/guides/tonight" className="rounded-md border border-[#d4af37]/35 bg-[#111014] px-4 py-2 hover:border-[#d4af37]">Tonight</Link>
          <Link href="/guides/this-weekend" className="rounded-md border border-[#d4af37]/35 bg-[#111014] px-4 py-2 hover:border-[#d4af37]">This weekend</Link>
        </div>

        <section className="grid items-start gap-7 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-[18px] border border-[#d4af37]/45 bg-[linear-gradient(180deg,#151217,#0c0b0d)] p-7 shadow-2xl shadow-black/20 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Make a night of it</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff8ec]">Dinner first.</h2>
            <p className="mt-4 leading-7 text-[#d6cec3]">Pick dinner around the event instead of treating the night as two separate decisions. Our dining guide includes free New Orleans staples and clearly labeled Dining Partners.</p>
            <Link href="/guides/where-to-eat#new-orleans-staples" className="mt-6 inline-flex rounded-md bg-[#d4af37] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#151515]">Find dinner first</Link>
            <p className="mt-5 text-xs leading-relaxed text-[#91887e]">Event availability, start times, ticket prices, venue policies, and ticket terms are controlled by the event/ticket provider and can change.</p>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">Live around New Orleans</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-[#fff8ec] sm:text-4xl">Things tourists might otherwise miss</h2>
              </div>
              <span className="text-xs text-[#91887e]">Live event feed</span>
            </div>

            {showFallback ? (
              <div>
                <div className="rounded-[14px] border border-[#d4af37]/28 bg-[#141116] px-5 py-4 text-sm leading-6 text-[#d3cabf]">
                  {configured
                    ? "No matching live listings are showing for this time window right now. You can still build a good night with the planning paths below."
                    : "The live event feed is unavailable right now. Instead of leaving you at a dead end, use one of these three ways to plan tonight."}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {fallbackIdeas.map((idea) => (
                    <Link
                      key={idea.href}
                      href={idea.href}
                      className="group flex min-h-[220px] flex-col rounded-[16px] border border-[#d4af37]/22 bg-[linear-gradient(155deg,#18151a,#0d0b0e)] p-6 transition hover:-translate-y-1 hover:border-[#d4af37]"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">{idea.eyebrow}</p>
                      <h3 className="mt-3 text-xl font-black leading-snug text-[#fff8ec]">{idea.title}</h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-[#bdb4aa]">{idea.description}</p>
                      <span className="mt-5 text-sm font-black text-[#d4af37]">{idea.cta} →</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-5 rounded-[16px] border border-[#d4af37]/22 bg-[#111014] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]">Need a quick human answer?</p>
                    <p className="mt-2 text-sm leading-6 text-[#c9c0b5]">Call or text the New Orleans desk and tell us your group, neighborhood, and what time you want to start.</p>
                  </div>
                  <a href="tel:+15044849687" className="mt-4 inline-flex shrink-0 rounded-md border border-[#d4af37] px-5 py-3 text-sm font-black text-[#fff8ec] sm:mt-0">504-484-9687</a>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {events.slice(0, 16).map((event) => (
                  <article key={event.id} className="flex flex-col overflow-hidden rounded-[16px] border border-[#d4af37]/25 bg-[linear-gradient(180deg,#151217,#0c0b0d)] shadow-xl shadow-black/20">
                    {event.image_url ? <img src={event.image_url} alt="" className="h-44 w-full object-cover" loading="lazy" /> : null}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full border border-[#d4af37]/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">{eventCategory(event)}</span></div>
                      <h3 className="text-2xl font-black leading-tight text-[#fff8ec]">{event.name}</h3>
                      <p className="mt-3 text-sm font-bold text-[#e0d8cd]">{formatLiveEventDate(event)}</p>
                      <p className="mt-1 text-sm text-[#9f968c]">{event.venue_name || "New Orleans area venue"}</p>
                      <div className="mt-6 flex flex-col gap-3 border-t border-[#d4af37]/15 pt-5">
                        {event.url ? <a href={event.url} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center rounded-md bg-[#d4af37] px-4 py-3 text-xs font-black uppercase tracking-wider text-[#151515]">Check tickets & details</a> : null}
                        <Link href="/guides/where-to-eat#new-orleans-staples" className="inline-flex justify-center rounded-md border border-[#d4af37]/35 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#fdfbf7] hover:border-[#d4af37]">Find dinner before it</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-[16px] border border-[#d4af37]/25 bg-[#111014] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">After the event</p>
            <h2 className="mt-3 text-2xl font-black text-[#fff8ec]">Still want to do something?</h2>
            <p className="mt-3 leading-relaxed text-[#bdb4aa]">Compare evening river cruises, ghosts and spirits, cocktail walks, and other bookable New Orleans experiences.</p>
            <Link href="/tours" className="mt-5 inline-flex font-bold text-[#d4af37] underline underline-offset-4">Browse evening-friendly tours</Link>
          </div>
          <RestaurantOrientationAd />
        </section>
      </div>
    </main>
  );
}
