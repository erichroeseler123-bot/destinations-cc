import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { getProductById } from "../data";
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
  .map((product) => (product ? getProductById(product.id) : undefined))
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
    href: "/guides/tonight",
    label: "See tonight's options",
  },
];

export default function FrenchQuarterCommercialHub() {
  return (
    <div data-wno-surface="directory-warm" className="bg-[#faf6ee] text-[#1e1915]">
      <header className="wno-dir-hero relative min-h-[480px] overflow-hidden border-b-2 border-[#b8893a] bg-[#163828] text-[#faf6ee]">
        <img
          src="/images/travel-markets/new-orleans/french-quarter-street.jpg"
          alt="French Quarter street architecture and wrought-iron balconies in New Orleans"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0f291d] via-[#163828]/85 to-[#163828]/45"
        />
        <div className="relative mx-auto flex min-h-[480px] max-w-6xl items-end px-6 pb-14 pt-12 md:pb-16">
          <div className="max-w-3xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#faf6ee]/80"
            >
              <Link href="/" className="hover:text-[#e4c17a] hover:underline">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/areas" className="hover:text-[#e4c17a] hover:underline">
                Areas &amp; Basins
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-[#e4c17a]">French Quarter (Vieux Carré)</span>
            </nav>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#e4c17a]">
              French Quarter Planning Hub · Historic Core
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight text-[#faf6ee] md:text-6xl">
              What should you book around the French Quarter?
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#efe7d8] md:text-xl">
              Start here if you are staying in or near the French Quarter. Compare the easiest tours
              to pair with a Quarter day, check hotel shuttle vs. walk-up rules, and book through
              verified operators.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/help-me-choose?src=french-quarter-hub"
                className="rounded-full bg-[#b8893a] px-6 py-3.5 text-center text-xs font-bold uppercase tracking-widest text-[#163828] transition hover:bg-[#ca9a46]"
              >
                Help Me Choose
              </Link>
              <Link
                href="/guides/tonight?src=french-quarter-hub"
                className="rounded-full border border-[#e4c17a] bg-[#faf6ee]/10 px-6 py-3.5 text-center text-xs font-bold uppercase tracking-widest text-[#faf6ee] transition hover:bg-[#faf6ee]/20"
              >
                Find Something Tonight
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pt-14 pb-8 md:pt-18">
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {paths.map((path) => (
            <article
              key={path.title}
              className="wno-dir-card flex h-full flex-col rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6"
            >
              <h2 className="font-serif text-2xl font-bold text-[#163828]">{path.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#4a4138]">{path.body}</p>
              <Link
                href={path.href}
                className="mt-6 text-xs font-bold uppercase tracking-wider text-[#6b2737] hover:text-[#163828]"
              >
                {path.label} →
              </Link>
            </article>
          ))}
        </section>

        <section className="my-16">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6220]">
              Easy to pair with a Quarter day
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828] md:text-4xl">
              Popular bookable experiences
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              These experiences either meet on foot inside the Vieux Carré or offer convenient
              French Quarter hotel pickup. Exact meeting points and schedules are confirmed during
              booking.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product!.id} product={product as never} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 border-y border-[#1e1915]/12 py-12 md:grid-cols-3">
          <Link
            href="/help-me-choose?src=french-quarter-hub"
            className="wno-dir-card group rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-7"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#8a6220]">New here?</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
              Narrow It Down in 60 Seconds
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              Match your hotel location, group ages, and free hours to the best-fitting Quarter or
              bayou outing.
            </p>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#6b2737] group-hover:text-[#163828]">
              Open Help Me Choose →
            </p>
          </Link>
          <Link
            href="/guides/things-to-do-in-new-orleans-today?src=french-quarter-hub"
            className="wno-dir-card group rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-7"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#8a6220]">
              Already here?
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">Plan Today</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              Use timing and format to narrow the choices when you need something that fits today.
            </p>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#6b2737] group-hover:text-[#163828]">
              See today&apos;s options →
            </p>
          </Link>
          <Link
            href="/contact?src=french-quarter-hub"
            className="wno-dir-card group rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-7"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#8a6220]">
              Still unsure?
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
              Tour Planning Help
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              Tell us who is coming, how much time you have, and what sounds fun. We will help
              narrow it down.
            </p>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#6b2737] group-hover:text-[#163828]">
              Get help choosing →
            </p>
          </Link>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="font-serif text-3xl font-bold text-[#163828]">
            French Quarter planning questions
          </h2>
          <div className="mt-6 space-y-3">
            {[
              [
                "Do I need a car for a French Quarter day?",
                "Usually not for the Quarter itself. Walking is the default, while swamp and River Road tours outside the core offer commercial hotel shuttle packages.",
              ],
              [
                "Can I do a city tour and a river cruise the same day?",
                "Often, yes. That can be an efficient first-day combination, especially pairing a morning minibus tour with an afternoon or evening jazz sailing from Toulouse Street Wharf.",
              ],
              [
                "What if I only have a few hours?",
                "Prioritize one anchor experience rather than stacking too much. A 3-hour city tour, a 2-hour walking tour, or a 2-hour riverboat cruise can each fit cleanly.",
              ],
              [
                "What is easiest for tonight?",
                "Start with the Tonight guide, then confirm live availability in the operator checkout. Same-day inventory can change quickly.",
              ],
            ].map(([question, answer]) => (
              <details
                key={question}
                className="rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-5"
              >
                <summary className="cursor-pointer font-serif text-lg font-bold text-[#163828]">
                  {question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
