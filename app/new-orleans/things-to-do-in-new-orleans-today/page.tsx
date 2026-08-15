import Link from "next/link";
import ProductCard from "../components/ProductCard";
import CinematicPageHero from "../components/CinematicPageHero";
import DailyBriefSignup from "../components/DailyBriefSignup";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { FAREHARBOR_SOURCES } from "../lib/fareHarborAttribution";

export const metadata = {
  title: "Things to Do in New Orleans Today | Same-Day Tour Ideas",
  description:
    "Plan what to do in New Orleans today with same-day tour ideas, evening options, current operator booking paths, and a quick chooser for your group and timing.",
  alternates: { canonical: "/guides/things-to-do-in-new-orleans-today" },
};

const sameDaySlugs = [
  "city-tour-of-new-orleans",
  "daytime-jazz-cruise",
  "evening-jazz-cruise",
  "covered-tour-boat",
  "ragin-cajun-airboat-options",
  "craft-cocktail-walking-tour",
  "ghosts-spirits-walking-tour",
];

const faqs = [
  {
    question: "What is a good first activity in New Orleans today?",
    answer:
      "A city overview, daytime river cruise, or another shorter experience can be a practical first move because it gives you context without committing the whole day. The best fit depends on your available time, weather, group ages, and transportation needs.",
  },
  {
    question: "Can I book a New Orleans tour at the last minute?",
    answer:
      "Sometimes. Same-day inventory changes throughout the day, so use the current operator booking path on each experience to confirm departure times, prices, pickup details, and availability before you make plans around it.",
  },
  {
    question: "What should I do in New Orleans today if it rains?",
    answer:
      "Start by favoring lower-exposure options, covered formats, and plans that keep the schedule flexible. Check the rainy-day guide and current operator details before booking because weather policies and operating decisions vary by experience.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function ThingsToDoTodayPage() {
  const products = sameDaySlugs
    .map((slug) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#080708] text-[#fdfbf7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <CinematicPageHero
        eyebrow="Already in New Orleans?"
        title="Things to do in New Orleans today"
        script="make today count"
        intro="Need a plan for the next few hours? Start with experiences that make sense for a same-day decision, then check current times, prices and availability with the tour operator before booking."
        image="/images/travel-markets/new-orleans/french-quarter-street.jpg"
        actions={[
          { href: "#options", label: "See Tour Options", detail: "Start with today's best fits", primary: true },
          { href: "/guides/tonight", label: "Tonight", detail: "Evening experiences" },
          { href: "/help-me-choose", label: "Help Me Choose", detail: "Answer a few questions" },
        ]}
      />

      <section id="options" className="px-6 py-14 md:py-20 bg-[radial-gradient(circle_at_50%_0%,rgba(132,82,18,.12),transparent_34%),#080708]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">Check current availability</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Good places to start</h2>
            <p className="mt-4 text-white/70">Availability changes throughout the day. These are planning options, not a claim that a specific departure is still open.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => product && (
              <ProductCard
                key={product.id}
                attributionSource={FAREHARBOR_SOURCES.home}
                product={{ ...product, operatorAttribution: undefined, isBookable: true, ctaLabel: "Check Times & Prices" } as any}
              />
            ))}
          </div>
        </div>
      </section>

      <DailyBriefSignup source="today" />

      <section className="border-t border-[#d4af37]/20 bg-[#0b090c] px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Quick answers for today</p>
          <h2 className="font-serif text-3xl mt-3">Planning a same-day New Orleans outing</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-serif text-xl">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{faq.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/guides/tonight" className="border border-[#d4af37]/35 px-4 py-2 text-sm hover:border-[#d4af37]">What to do tonight</Link>
            <Link href="/guides/best-new-orleans-tours-under-4-or-6-hours" className="border border-[#d4af37]/35 px-4 py-2 text-sm hover:border-[#d4af37]">Short on time</Link>
            <Link href="/guides/new-orleans-tours-for-families" className="border border-[#d4af37]/35 px-4 py-2 text-sm hover:border-[#d4af37]">Planning with family</Link>
            <Link href="/guides/best-new-orleans-tours-for-a-rainy-day" className="border border-[#d4af37]/35 px-4 py-2 text-sm hover:border-[#d4af37]">Rainy-day options</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d4af37]/20 bg-[#0b090c] px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Still deciding?</p>
          <h2 className="font-serif text-3xl mt-3">Tell us what kind of day you want.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">The chooser narrows the catalog around your group, timing and logistics instead of making you sort through everything.</p>
          <Link href="/help-me-choose" className="mt-7 inline-block bg-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#171717]">Find my best fit</Link>
        </div>
      </section>
    </div>
  );
}
