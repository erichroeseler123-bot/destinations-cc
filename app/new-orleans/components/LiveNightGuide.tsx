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

export default async function LiveNightGuide({
  window = "all",
  title,
  eyebrow,
  intro,
}: Props) {
  const { events, configured } = await getNewOrleansLiveEvents(window);

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

      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="mb-10 flex flex-wrap gap-3 text-sm">
          <Link href="/guides/whats-happening" className="border border-[#d4af37]/35 bg-[#111014] px-4 py-2 hover:border-[#d4af37]">What’s happening</Link>
          <Link href="/guides/tonight" className="border border-[#d4af37]/35 bg-[#111014] px-4 py-2 hover:border-[#d4af37]">Tonight</Link>
          <Link href="/guides/this-weekend" className="border border-[#d4af37]/35 bg-[#111014] px-4 py-2 hover:border-[#d4af37]">This weekend</Link>
        </div>

        <section className="grid lg:grid-cols-[0.72fr_1.28fr] gap-6 items-start">
          <div className="border border-[#d4af37]/45 bg-[linear-gradient(180deg,#151217,#0c0b0d)] p-7 lg:sticky lg:top-24 shadow-2xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Make a night of it</p>
            <h2 className="font-[var(--font-accent)] text-3xl font-bold mt-3">Dinner first.</h2>
            <p className="mt-3 text-[#cccccc] leading-relaxed">Pick dinner around the event instead of treating the night as two separate decisions. Our dining guide includes free New Orleans staples and clearly labeled Dining Partners.</p>
            <Link href="/guides/where-to-eat#new-orleans-staples" className="mt-6 inline-flex bg-[#d4af37] text-[#151515] font-bold px-5 py-3 text-sm uppercase tracking-wider">Find dinner first</Link>
            <p className="mt-5 text-xs text-[#888] leading-relaxed">Event availability, start times, ticket prices, venue policies, and ticket terms are controlled by the event/ticket provider and can change.</p>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#d4af37] font-bold">Live around New Orleans</p>
                <h2 className="font-[var(--font-accent)] text-3xl font-bold mt-2">Things tourists might otherwise miss</h2>
              </div>
              <span className="text-xs text-[#888]">Live event feed</span>
            </div>

            {!configured ? (
              <div className="border border-dashed border-[#d4af37]/30 p-7 bg-[#111014] text-[#aaaaaa]">Live event inventory is temporarily unavailable. The dinner, tour, and orientation planning links remain available.</div>
            ) : events.length === 0 ? (
              <div className="border border-dashed border-[#d4af37]/30 p-7 bg-[#111014] text-[#aaaaaa]">No matching live events are currently returned for this time window. Try the broader “What’s happening” view.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {events.slice(0, 16).map((event) => (
                  <article key={event.id} className="overflow-hidden border border-[#d4af37]/25 bg-[linear-gradient(180deg,#151217,#0c0b0d)] flex flex-col shadow-xl shadow-black/20">
                    {event.image_url ? <img src={event.image_url} alt="" className="h-44 w-full object-cover" loading="lazy" /> : null}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-2 mb-3"><span className="text-[10px] uppercase tracking-widest font-bold text-[#d4af37] border border-[#d4af37]/40 px-2 py-1">{eventCategory(event)}</span></div>
                      <h3 className="font-[var(--font-accent)] text-2xl font-bold leading-tight">{event.name}</h3>
                      <p className="mt-3 text-sm font-bold text-[#dddddd]">{formatLiveEventDate(event)}</p>
                      <p className="mt-1 text-sm text-[#999]">{event.venue_name || "New Orleans area venue"}</p>
                      <div className="mt-6 pt-5 border-t border-[#d4af37]/15 flex flex-col gap-3">
                        {event.url ? <a href={event.url} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center bg-[#d4af37] text-[#151515] font-bold px-4 py-3 text-xs uppercase tracking-wider">Check tickets & details</a> : null}
                        <Link href="/guides/where-to-eat#new-orleans-staples" className="inline-flex justify-center border border-[#d4af37]/35 text-[#fdfbf7] font-bold px-4 py-3 text-xs uppercase tracking-wider hover:border-[#d4af37]">Find dinner before it</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-14 grid md:grid-cols-2 gap-6">
          <div className="border border-[#d4af37]/25 bg-[#111014] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">After the event</p>
            <h2 className="font-[var(--font-accent)] text-2xl font-bold mt-3">Still want to do something?</h2>
            <p className="mt-3 text-[#aaaaaa] leading-relaxed">Compare evening river cruises, ghosts and spirits, cocktail walks, and other bookable New Orleans experiences.</p>
            <Link href="/tours" className="mt-5 inline-flex text-[#d4af37] font-bold underline underline-offset-4">Browse evening-friendly tours</Link>
          </div>
          <RestaurantOrientationAd />
        </section>
      </div>
    </main>
  );
}
