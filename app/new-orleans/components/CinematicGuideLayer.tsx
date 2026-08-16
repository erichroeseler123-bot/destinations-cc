import Link from "next/link";
import CinematicPageHero from "./CinematicPageHero";
import IntentSeoLanding, { type IntentSeoLandingConfig } from "./IntentSeoLanding";
import ProductCard from "./ProductCard";
import { getProductById } from "../data/index";
import { SEO_PAGES } from "../data/pages";
import type { SeoPageRecord } from "../data/types";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";

const FALLBACK_IMAGE = "/images/new-orleans/hero-french-quarter-balcony.jpg";

function liveProductImage(productId: string) {
  const product = getProductById(productId);
  if (product && "imageUrl" in product && product.imageUrl) return product.imageUrl;
  return null;
}

function seoGuideImage(page: SeoPageRecord) {
  for (const productId of page.liveProductIds) {
    const image = liveProductImage(productId);
    if (image) return image;
  }
  return FALLBACK_IMAGE;
}

function intentGuideImage(config: IntentSeoLandingConfig) {
  for (const slug of config.productSlugs) {
    const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === slug);
    if (product?.imageUrl) return product.imageUrl;
  }
  return FALLBACK_IMAGE;
}

function RelevantTours({ page }: { page: SeoPageRecord }) {
  const products = page.liveProductIds
    .map((id) => getProductById(id))
    .filter(Boolean)
    .slice(0, 3);
  if (!products.length) return null;

  return (
    <section className="my-16" id="options">
      <div className="mb-10 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Curated for this question</p>
        <h2 className="mt-2 font-serif text-3xl text-[#fdfbf7]">Three places we’d start</h2>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product!.id} product={product as any} />
        ))}
      </div>
    </section>
  );
}

function GuideFaqs({ page }: { page: SeoPageRecord }) {
  const faqs = page.faqs || [];
  if (!faqs.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="my-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Help answers</p>
        <h2 className="mt-2 font-serif text-3xl text-[#fdfbf7]">Quick answers before you choose</h2>
      </div>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details key={`${faq.question}-${index}`} className="group border border-[#2a2a2a] bg-[#1a1a1a] open:border-[#d4af37]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-serif text-xl text-[#fdfbf7] group-open:text-[#d4af37]">
              {faq.question}
              <span aria-hidden="true" className="text-[#d4af37]">+</span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-6 text-[#aaaaaa]">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function RelatedGuides({ page }: { page: SeoPageRecord }) {
  const related = (page.relatedPageIds || [])
    .map((id) => SEO_PAGES[id])
    .filter((candidate): candidate is SeoPageRecord => Boolean(candidate && candidate.status !== "draft" && candidate.isIndexable))
    .slice(0, 4);

  if (!related.length) return null;

  return (
    <section className="my-16 border-t border-[#2a2a2a] pt-12">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Keep planning</p>
      <h2 className="mt-2 font-serif text-3xl text-[#fdfbf7]">Related New Orleans guides</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {related.map((guide) => (
          <Link
            key={guide.id}
            href={guide.publicRoute}
            className="border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition hover:border-[#d4af37]"
          >
            <h3 className="font-serif text-xl text-[#fdfbf7]">{guide.heroTitle}</h3>
            <p className="mt-2 text-sm leading-5 text-[#aaaaaa]">{guide.heroSubtitle || guide.openingAnswer}</p>
            <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Read guide →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DecisionFooter() {
  return (
    <section className="my-16 border border-[#d4af37]/45 bg-[#101010] p-7 text-center md:p-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">Still deciding?</p>
      <h2 className="mt-2 font-serif text-3xl text-[#fdfbf7]">Tell us what kind of day you want.</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#aaaaaa]">Answer a few questions and we’ll narrow the current New Orleans experiences to the ones that fit your time, group, and pace.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/help-me-choose" className="bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#151515]">Help Me Choose</Link>
        <Link href="/guides/things-to-do-in-new-orleans-today" className="border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]">What Fits Today</Link>
        <Link href="/guides/tonight" className="border border-[#2a2a2a] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#fdfbf7]">Tonight</Link>
      </div>
    </section>
  );
}

function Disclosure({ page }: { page: SeoPageRecord }) {
  if (!page.disclosure) return null;
  return (
    <p className="mx-auto mt-16 max-w-4xl border-t border-[#2a2a2a] pt-8 text-center text-xs italic text-[#aaaaaa]">
      {page.disclosure}
    </p>
  );
}

function GuideSupport({ page }: { page: SeoPageRecord }) {
  return (
    <>
      <RelevantTours page={page} />
      <GuideFaqs page={page} />
      <RelatedGuides page={page} />
      <DecisionFooter />
      <Disclosure page={page} />
    </>
  );
}

function SeoGuideBody({ page }: { page: SeoPageRecord }) {
  if (page.variant === "traveler-fit") {
    return (
      <div className="min-h-screen bg-[#151515] font-sans selection:bg-[#d4af37] selection:text-[#151515]">
        <div className="mx-auto max-w-3xl px-6 pb-20">
          {page.whoItIsFor && (
            <div className="my-12 rounded-sm border border-[#2a2a2a] bg-[#101010] p-8 text-center text-[#fdfbf7] md:p-12">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#d4af37]">Traveler Profile</h2>
              <h3 className="mb-6 font-serif text-2xl">Is this right for you?</h3>
              <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[#aaaaaa]">{page.whoItIsFor}</p>
            </div>
          )}

          {page.openingAnswer && (
            <section className="my-16 mx-auto max-w-3xl border-l-4 border-[#d4af37] pl-8 font-serif text-xl leading-relaxed text-[#fdfbf7]">
              {page.openingAnswer}
            </section>
          )}

          {page.whoShouldChooseSomethingElse && (
            <div className="my-16 border border-[#2a2a2a] bg-[#1a1a1a] p-8 md:p-10">
              <h3 className="mb-4 font-serif text-2xl text-[#d4af37]">Tradeoffs &amp; Alternatives</h3>
              <p className="text-lg font-light leading-relaxed text-[#aaaaaa]">{page.whoShouldChooseSomethingElse}</p>
            </div>
          )}

          <GuideSupport page={page} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#151515] font-sans selection:bg-[#d4af37] selection:text-[#151515]">
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <article className="my-16 text-lg font-light leading-relaxed text-[#fdfbf7]">
          {page.openingAnswer && (
            <p className="mb-10 text-center font-serif text-2xl leading-relaxed">{page.openingAnswer}</p>
          )}

          {page.planningConsiderations && (
            <div className="mb-12">
              <h3 className="mb-6 mt-12 font-serif text-3xl text-[#d4af37]">Practical Explanation</h3>
              <div className="prose prose-lg prose-invert max-w-none text-[#aaaaaa]">
                <p>{page.planningConsiderations}</p>
              </div>
            </div>
          )}

          {page.decisionFactors.length > 0 && (
            <div className="my-12 border border-[#2a2a2a] bg-[#1a1a1a] p-8 md:p-10">
              <h3 className="mb-6 font-serif text-2xl text-[#fdfbf7]">Implications for Booking</h3>
              <ul className="space-y-4">
                {page.decisionFactors.map((factor, index) => (
                  <li key={index} className="flex">
                    <span className="mr-4 text-xl leading-none text-[#d4af37]">&bull;</span>
                    <span className="text-[#aaaaaa]">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        {page.topCta && (
          <div className="my-16 text-center">
            <Link href={page.topCta} className="group inline-flex items-center text-sm font-bold uppercase tracking-widest text-[#d4af37] transition-colors hover:text-[#fdfbf7]">
              <span className="border-b border-[#d4af37] pb-1 group-hover:border-[#fdfbf7]">Read Full Guide</span>
              <span className="ml-2 transform transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        )}

        <GuideSupport page={page} />
      </div>
    </div>
  );
}

export function CinematicSeoGuide({ page }: { page: SeoPageRecord }) {
  return (
    <>
      <CinematicPageHero
        eyebrow={page.heroEyebrow || "New Orleans planning guide"}
        title={page.heroTitle}
        intro={page.heroSubtitle || page.openingAnswer || "Use this guide to narrow the New Orleans experiences that fit your timing, group, and priorities."}
        image={seoGuideImage(page)}
        actions={[
          { href: "#options", label: "Start With 3 Picks", detail: "See the strongest fits", primary: true },
          { href: "/help-me-choose", label: "Help Me Choose", detail: "Narrow the best fit" },
        ]}
      />
      <SeoGuideBody page={page} />
    </>
  );
}

export function CinematicIntentGuide({ config }: { config: IntentSeoLandingConfig }) {
  return (
    <>
      <CinematicPageHero
        eyebrow={config.eyebrow}
        title={config.title}
        intro={config.intro}
        image={intentGuideImage(config)}
        actions={[
          { href: "#options", label: "Check Tour Options", detail: "Start with the best fits", primary: true },
          { href: "/help-me-choose", label: "Help Me Choose", detail: "Answer a few questions" },
        ]}
      />
      <IntentSeoLanding config={config} showHero={false} />
    </>
  );
}
