import Link from "next/link";
import ProductCard from "./ProductCard";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { FAREHARBOR_SOURCES } from "../lib/fareHarborAttribution";

export type IntentSeoLandingConfig = {
  eyebrow: string;
  title: string;
  intro: string;
  decisionTitle?: string;
  decisionPoints: string[];
  productSlugs: string[];
  productHeading: string;
  productIntro: string;
  relatedLinks: Array<{ href: string; label: string }>;
  faq?: Array<{ question: string; answer: string }>;
};

export default function IntentSeoLanding({ config }: { config: IntentSeoLandingConfig }) {
  const products = config.productSlugs
    .map((slug) => STOREFRONT_PRODUCTS.find((product) => product.slug === slug))
    .filter(Boolean);
  const faq = config.faq || [];
  const faqSchema = faq.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <section className="border-b border-white/10 bg-[#110e14] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">{config.eyebrow}</p>
          <h1 className="max-w-4xl font-serif text-4xl leading-tight md:text-6xl">{config.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">{config.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#options" className="bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#171717]">Check tour options</a>
            <Link href="/help-me-choose" className="border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]">Help me choose</Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h2 className="font-serif text-3xl">{config.decisionTitle || "What matters most"}</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-white/75 md:grid-cols-2">
            {config.decisionPoints.map((point) => <li key={point} className="border-l-2 border-[#d4af37] pl-4">{point}</li>)}
          </ul>
        </div>
      </section>

      <section id="options" className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">Bookable starting points</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">{config.productHeading}</h2>
            <p className="mt-4 text-white/70">{config.productIntro}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => product && (
              <ProductCard
                key={product.id}
                attributionSource={FAREHARBOR_SOURCES.guide}
                product={{ ...product, operatorAttribution: undefined, isBookable: true, ctaLabel: "Check Times & Prices" } as any}
              />
            ))}
          </div>
        </div>
      </section>

      {faq.length > 0 && (
        <section className="border-y border-white/10 bg-[#110e14] px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Quick answers</p>
            <h2 className="mt-3 font-serif text-3xl">Questions to settle before booking</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {faq.map((item) => (
                <article key={item.question} className="border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="font-serif text-xl">{item.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/10 bg-[#110e14] px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-3xl">Keep narrowing the decision</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {config.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="border border-white/20 px-4 py-3 text-sm hover:border-[#d4af37]">{link.label} →</Link>
            ))}
            <Link href="/guides/things-to-do-in-new-orleans-today" className="border border-white/20 px-4 py-3 text-sm hover:border-[#d4af37]">Things to do today →</Link>
            <Link href="/guides/tonight" className="border border-white/20 px-4 py-3 text-sm hover:border-[#d4af37]">What to do tonight →</Link>
            <Link href="/help-me-choose" className="bg-[#d4af37] px-4 py-3 text-sm font-bold text-[#171717]">Help Me Choose</Link>
          </div>
          <p className="mt-7 max-w-3xl text-xs leading-5 text-white/55">Tour operators control departure times, pricing, pickup details, age rules, availability and cancellation terms. Confirm the current details during booking.</p>
        </div>
      </section>
    </div>
  );
}
