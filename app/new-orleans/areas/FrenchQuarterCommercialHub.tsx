import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

const FEATURED_SLUGS = [
  "city-tour-of-new-orleans",
  "city-cemetery-garden-district-tour",
  "cocktail-walking-tour",
  "craft-cocktail-walking-tour",
  "ghosts-spirits-walking-tour",
  "daytime-jazz-cruise",
  "evening-jazz-cruise",
];

const featuredProducts = FEATURED_SLUGS
  .map((slug) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug))
  .filter(Boolean);

const paths = [
  {
    title: "Start with the city",
    body: "Best for first-time visitors who want the big picture before spending more time on foot in the Quarter.",
    href: "/tours/city-tour-of-new-orleans?src=french-quarter-hub",
    label: "See the city tour",
  },
  {
    title: "Stay close and walk",
    body: "Cocktail, food, ghost and walking experiences work well when you want to keep the day centered around the French Quarter.",
    href: "/walking-tours",
    label: "Browse walking tours",
  },
  {
    title: "Add the river",
    body: "The Mississippi Riverfront is a natural pairing with a French Quarter day, especially for daytime sightseeing or an evening jazz cruise.",
    href: "/riverboat-cruises",
    label: "Browse river cruises",
  },
  {
    title: "Need something tonight?",
    body: "Use the Tonight guide when the date matters more than the category. Final availability is always confirmed in operator checkout.",
    href: "/guides/new-orleans-tours-tonight",
    label: "See tonight's options",
  },
];

export default function FrenchQuarterCommercialHub() {
  return (
    <div className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <main>
        <header className="relative min-h-[520px] overflow-hidden border-b border-[#2a2a2a]">
          <img
            src="/images/travel-markets/new-orleans/french-quarter-street.jpg"
            alt="French Quarter street in New Orleans"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/70 to-[#151515]/30" />
          <div className="relative mx-auto flex min-h-[520px] max-w-6xl items-end px-6 pb-14 md:pb-18">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">French Quarter planning hub</p>
              <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">What should you book around the French Quarter?</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#dddddd] md:text-xl">
                Start here if you are staying in or near the French Quarter. Compare the easiest tours to pair with a Quarter day, then book through the participating operator.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/help-me-choose?src=french-quarter-hub" className="bg-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#151515] transition hover:bg-[#fdfbf7]">
                  Help Me Choose
                </Link>
                <Link href="/guides/new-orleans-tours-tonight?src=french-quarter-hub" className="border border-[#d4af37] px-6 py-4 text-center text-sm font-bold uppercase tracking-widest text-[#fdfbf7] transition hover:bg-[#d4af37] hover:text-[#151515]">
                  Find Something Tonight
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paths.map((path) => (
              <article key={path.title} className="flex h-full flex-col border border-[#2a2a2a] bg-[#1a1a1a] p-6">
                <h2 className="font-serif text-2xl text-[#fdfbf7]">{path.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#aaaaaa]">{path.body}</p>
                <Link href={path.href} className="mt-6 text-sm font-bold text-[#d4af37] hover:text-[#fdfbf7]">
                  {path.label} →
                </Link>
              </article>
            ))}
          </section>

          <section className="my-20">
            <div className="mb-9 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">Easy to pair with a Quarter day</p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Popular bookable experiences</h2>
              <p className="mt-4 text-[#aaaaaa]">These are not all physically inside the French Quarter. They are the experiences most naturally paired with time in the Quarter; pickup, meeting point and current schedule are confirmed during booking.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product!.id} product={product as any} />
              ))}
            </div>
          </section>

          <section className="grid gap-6 border-y border-[#2a2a2a] py-14 md:grid-cols-3">
            <Link href="/guides/french-quarter-orientation?src=french-quarter-hub" className="group bg-[#101010] p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">New here?</p>
              <h2 className="mt-3 font-serif text-2xl">Start with the $5 Orientation</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#aaaaaa]">A simple first-stop option before you spend the rest of your time exploring.</p>
              <p className="mt-5 text-sm font-bold text-[#d4af37] group-hover:text-[#fdfbf7]">See orientation details →</p>
            </Link>
            <Link href="/guides/things-to-do-in-new-orleans-today?src=french-quarter-hub" className="group bg-[#101010] p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Already here?</p>
              <h2 className="mt-3 font-serif text-2xl">Plan Today</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#aaaaaa]">Use timing and format to narrow the choices when you need something that fits today.</p>
              <p className="mt-5 text-sm font-bold text-[#d4af37] group-hover:text-[#fdfbf7]">See today's options →</p>
            </Link>
            <Link href="/contact?src=french-quarter-hub" className="group bg-[#101010] p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Still unsure?</p>
              <h2 className="mt-3 font-serif text-2xl">Ask the Concierge Desk</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#aaaaaa]">Tell us who is coming, how much time you have and what sounds fun. We will help narrow it down.</p>
              <p className="mt-5 text-sm font-bold text-[#d4af37] group-hover:text-[#fdfbf7]">Get help choosing →</p>
            </Link>
          </section>

          <section className="mx-auto my-20 max-w-3xl">
            <h2 className="text-center font-serif text-3xl">French Quarter planning questions</h2>
            <div className="mt-8 space-y-3">
              {[
                ["Do I need a car for a French Quarter day?", "Usually not for the Quarter itself. Walking is the default, while tours outside the core may include or require transportation. Check the specific tour before booking."],
                ["Can I do a city tour and a river cruise the same day?", "Often, yes. That can be an efficient first-day combination, but confirm current departure times before treating it as a fixed itinerary."],
                ["What if I only have a few hours?", "Prioritize one anchor experience rather than stacking too much. The city tour, a walking experience, or a river cruise can each work depending on the available window."],
                ["What is easiest for tonight?", "Start with the Tonight guide, then confirm live availability in the operator checkout. Same-day inventory can change quickly."],
              ].map(([question, answer]) => (
                <details key={question} className="border border-[#2a2a2a] bg-[#1a1a1a] p-6">
                  <summary className="cursor-pointer font-serif text-xl text-[#fdfbf7]">{question}</summary>
                  <p className="mt-4 text-sm leading-relaxed text-[#aaaaaa]">{answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
