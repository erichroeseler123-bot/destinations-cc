import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSeoPageBySlug } from "../../data/pageMap";
import { getProductById, type LiveProductAdapter } from "../../data/index";
import ExperienceDecisionBlock from "../../components/ExperienceDecisionBlock";
import WnoBreadcrumbs from "../../components/WnoBreadcrumbs";
import VisualEditorialCard from "../../components/VisualEditorialCard";
import { buildSeoMetadata } from "../../lib/buildSeoMetadata";

const CARD_EYEBROWS = [
  "Our first pick",
  "A strong alternative",
  "Worth comparing",
  "Another good fit",
  "Also consider",
];

type CategoryLayout = "scenic" | "nightlife" | "adventure" | "editorial" | "standard";

function categoryLayout(categorySlug: string): CategoryLayout {
  if (categorySlug === "riverboat-cruises") return "scenic";
  if (categorySlug === "jazz-music-tours") return "nightlife";
  if (["swamp-tours", "airboat-tours", "covered-swamp-boat-tours"].includes(categorySlug)) return "adventure";
  if (categorySlug === "garden-district-tours") return "editorial";
  return "standard";
}

function categoryCopy(layout: CategoryLayout) {
  if (layout === "scenic") {
    return {
      optionsEyebrow: "On the Mississippi",
      optionsTitle: "Choose your river moment",
      optionsIntro: "Start with the mood you want on the water: daytime sightseeing, an evening with jazz, brunch, or a shorter scenic cruise.",
      cta: "See river cruises",
    };
  }
  if (layout === "nightlife") {
    return {
      optionsEyebrow: "Tonight in New Orleans",
      optionsTitle: "Pick the kind of night you want",
      optionsIntro: "Treat this like an evening edit, not a catalog. Choose by energy, timing, meal format, and how much of the night you want the experience to own.",
      cta: "See jazz experiences",
    };
  }
  if (layout === "adventure") {
    return {
      optionsEyebrow: "Out beyond the city",
      optionsTitle: "Choose your way into the swamp",
      optionsIntro: "The biggest difference is the ride itself: faster and more exposed, calmer and covered, or a broader combination day. Pick the experience before you pick the departure time.",
      cta: "See swamp options",
    };
  }
  if (layout === "editorial") {
    return {
      optionsEyebrow: "Architecture · streets · stories",
      optionsTitle: "Choose the pace and perspective",
      optionsIntro: "Decide whether you want the Garden District as the main story or as part of a broader city overview, then compare the amount of walking and neighborhood depth.",
      cta: "See Garden District tours",
    };
  }
  return {
    optionsEyebrow: "Curated options",
    optionsTitle: "Where we’d start",
    optionsIntro: "You do not need to sort an operator catalog. Start with the experiences that fit this kind of day, then check the live booking option when you are ready.",
    cta: "See our picks",
  };
}

function cardEyebrow(categorySlug: string, index: number, productSlug: string) {
  if (categorySlug === "riverboat-cruises") {
    return [
      "A classic New Orleans night",
      "An easy daytime river plan",
      "A festive Sunday",
      "A shorter scenic cruise",
    ][index] || CARD_EYEBROWS[index % CARD_EYEBROWS.length];
  }

  if (categorySlug === "jazz-music-tours") {
    return ["After dark", "Daytime rhythm", "Sunday session"][index] || CARD_EYEBROWS[index % CARD_EYEBROWS.length];
  }

  if (["swamp-tours", "airboat-tours", "covered-swamp-boat-tours"].includes(categorySlug)) {
    if (productSlug.includes("airboat")) return "Most adventurous";
    if (productSlug.includes("covered")) return "Easygoing choice";
    return ["Worth comparing", "Make a day of it"][index % 2];
  }

  if (categorySlug === "garden-district-tours") {
    return ["Neighborhood first", "Broader city context"][index] || CARD_EYEBROWS[index % CARD_EYEBROWS.length];
  }

  return CARD_EYEBROWS[index % CARD_EYEBROWS.length];
}

function isLiveProduct(product: ReturnType<typeof getProductById>): product is LiveProductAdapter {
  return Boolean(product && product.status === "live");
}

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const resolvedParams = await params;
  const record = getSeoPageBySlug(resolvedParams.categorySlug);
  if (!record || record.status === "draft" || record.variant !== "category") {
    notFound();
  }

  const products = record.liveProductIds.map((id) => getProductById(id)).filter(isLiveProduct);
  const heroImage = products.find((product) => product.imageUrl)?.imageUrl;
  const layout = categoryLayout(resolvedParams.categorySlug);
  const copy = categoryCopy(layout);

  const openingSection = record.openingAnswer ? (
    <section data-wno-section="opening" className="mx-auto max-w-3xl text-center">
      <p className="font-serif text-xl leading-9 text-[#eadfca] md:text-2xl">{record.openingAnswer}</p>
    </section>
  ) : null;

  const decisionSection = (
    <ExperienceDecisionBlock
      slugs={products.map((product) => product.slug)}
      categoryLabel={record.heroTitle}
    />
  );

  const fitSection = (record.whoItIsFor || record.decisionFactors.length > 0) ? (
    <section data-wno-section="fit" className="mt-12 grid gap-5 md:grid-cols-2">
      {record.whoItIsFor && (
        <div className="border border-[#342b1d] bg-[#12110e] p-6 shadow-[0_18px_55px_rgba(0,0,0,.16)] md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a86a]">Concierge note</p>
          <h2 className="mt-2 font-serif text-2xl text-[#f3dfb3]">Who this tends to fit</h2>
          <p className="mt-4 leading-7 text-[#b7ad9e]">{record.whoItIsFor}</p>
        </div>
      )}
      {record.decisionFactors.length > 0 && (
        <div className="border border-[#342b1d] bg-[#12110e] p-6 shadow-[0_18px_55px_rgba(0,0,0,.16)] md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a86a]">What to think about</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[#b7ad9e]">
            {record.decisionFactors.slice(0, 5).map((factor, index) => (
              <li key={index} className="flex gap-3">
                <span className="text-[#c9a86a]">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  ) : null;

  const optionsSection = (
    <section id="options" data-wno-section="options" className="mt-16 scroll-mt-24">
      <div data-wno-options-heading className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a86a]">{copy.optionsEyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl text-[#f3dfb3] md:text-4xl">{copy.optionsTitle}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#9d9587]">{copy.optionsIntro}</p>
      </div>

      {products.length > 0 ? (
        <div data-wno-options-grid className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <VisualEditorialCard
              key={product.id}
              title={product.title}
              slug={product.slug}
              description={product.description}
              imageUrl={product.imageUrl}
              eyebrow={cardEyebrow(resolvedParams.categorySlug, index, product.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-2xl border border-[#342b1d] bg-[#12110e] p-7 text-center">
          <p className="text-[#aaa193]">
            We do not have a confirmed bookable option in this category yet. Use the chooser and we’ll point you toward the closest current fit.
          </p>
          <Link href="/help-me-choose" className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.15em] text-[#c9a86a]">
            Help Me Choose →
          </Link>
        </div>
      )}
    </section>
  );

  const planningSection = (record.planningConsiderations || record.transportationNotes) ? (
    <section data-wno-section="planning" className="mx-auto mt-14 max-w-3xl border-y border-[#342b1d] py-7 text-sm leading-7 text-[#9d9587]">
      {record.planningConsiderations && <p>{record.planningConsiderations}</p>}
      {record.transportationNotes && <p className="mt-3">{record.transportationNotes}</p>}
    </section>
  ) : null;

  const faqSection = record.faqs && record.faqs.length > 0 ? (
    <section data-wno-section="faq" className="mx-auto mt-14 max-w-3xl">
      <h2 className="text-center font-serif text-3xl text-[#f3dfb3]">A few useful answers</h2>
      <div className="mt-6 space-y-3">
        {record.faqs.map((faq, index) => (
          <details key={index} className="border border-[#342b1d] bg-[#12110e] p-5">
            <summary className="cursor-pointer font-semibold text-[#eadfca]">{faq.question}</summary>
            <p className="mt-3 text-sm leading-6 text-[#aaa193]">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <div
      data-wno-category={resolvedParams.categorySlug}
      data-wno-layout={layout}
      className="min-h-screen bg-[#0b0a09] text-[#f8f1e5]"
    >
      <WnoBreadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "New Orleans Experiences", path: "/tours" },
          { name: record.heroTitle, path: record.publicRoute },
        ]}
      />

      <header className="relative isolate min-h-[430px] overflow-hidden border-b border-[#342b1d] bg-[#11100d] px-6 py-14 text-center md:min-h-[520px] md:py-20">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,6,5,.28),rgba(11,10,9,.82)_58%,#0b0a09),radial-gradient(circle_at_50%_22%,rgba(201,168,106,.18),transparent_42%)]" />
        <div className="mx-auto flex min-h-[330px] max-w-4xl flex-col items-center justify-end md:min-h-[400px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4c985]">
            {record.heroEyebrow || "Curated New Orleans experiences"}
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-[1.02] text-[#fff4dd] drop-shadow-[0_4px_24px_rgba(0,0,0,.55)] md:text-6xl lg:text-7xl">
            {record.heroTitle}
          </h1>
          {record.heroSubtitle && (
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#e1d7c7] md:text-lg md:leading-8">
              {record.heroSubtitle}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#options"
              className="inline-flex min-h-12 items-center bg-[#c9a86a] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#17130c] transition hover:bg-[#f3dfb3]"
            >
              {copy.cta}
            </a>
            <Link
              href="/help-me-choose"
              className="inline-flex min-h-12 items-center border border-[#c9a86a] bg-black/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#fff0c9] backdrop-blur-sm transition hover:bg-[#c9a86a]/10"
            >
              Help Me Choose
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1180px,calc(100%-2rem))] py-12 md:py-16">
        {layout === "adventure" && decisionSection}
        {openingSection}

        {(layout === "scenic" || layout === "nightlife") && optionsSection}

        {(layout === "adventure" || layout === "editorial" || layout === "nightlife") && fitSection}

        {layout === "standard" && decisionSection}
        {layout === "scenic" && decisionSection}
        {layout === "editorial" && decisionSection}
        {layout === "nightlife" && decisionSection}

        {(layout === "scenic" || layout === "standard") && fitSection}

        {(layout === "standard" || layout === "editorial" || layout === "adventure") && optionsSection}

        {planningSection}
        {faqSection}

        <div className="mt-14 text-center">
          <Link
            href="/help-me-choose"
            className="inline-flex min-h-12 items-center bg-[#c9a86a] px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-[#17130c] transition hover:bg-[#f3dfb3]"
          >
            Not sure? Help Me Choose
          </Link>
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string; categorySlug?: string; comparisonSlug?: string }> }): Promise<Metadata> {
  const p = await params;
  let slugToLookup = "";
  if (p.categorySlug && p.comparisonSlug) slugToLookup = `${p.categorySlug}/${p.comparisonSlug}`;
  else slugToLookup = p.comparisonSlug || p.slug || p.categorySlug || "";

  const record = getSeoPageBySlug(slugToLookup);
  if (!record) return notFound();
  return buildSeoMetadata(record);
}
