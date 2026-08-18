import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import { FAREHARBOR_SOURCES } from "../../lib/fareHarborAttribution";
import { getWnoOperatorEntity, WNO_OPERATOR_ENTITIES } from "../../data/operatorRegistry";

export function generateStaticParams() {
  return WNO_OPERATOR_ENTITIES.map((operator) => ({ slug: operator.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const operator = getWnoOperatorEntity(slug);
  if (!operator) return {};
  const title = `${operator.name} New Orleans Tours | Welcome to New Orleans Tours`;
  const description = `See the ${operator.products.length} ${operator.name} experience${operator.products.length === 1 ? "" : "s"} currently represented on Welcome to New Orleans Tours, with operator identity, booking paths, and verification status kept explicit.`;
  return {
    title,
    description,
    alternates: { canonical: `/operators/${operator.slug}` },
    openGraph: { title, description, url: `/operators/${operator.slug}`, type: "website" },
  };
}

export default async function OperatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const operator = getWnoOperatorEntity(slug);
  if (!operator) notFound();

  return (
    <main className="min-h-screen bg-[#080708] text-[#fdfbf7]">
      <section className="border-b border-[#d4af37]/20 bg-[#110e14] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">Participating operator</p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl">{operator.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
            This page identifies the operator behind the experiences WNO currently represents from {operator.name}. It is intentionally limited to facts already present in WNO's governed inventory and booking records; it is not a general company biography.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="border border-white/15 px-4 py-2">{operator.products.length} represented experience{operator.products.length === 1 ? "" : "s"}</span>
            <span className="border border-white/15 px-4 py-2">{operator.governedCount}/{operator.products.length} governed</span>
            <span className="border border-white/15 px-4 py-2">{operator.publishableGraphCount} with publishable graph facts</span>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Experiences on WNO</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Choose the experience, then confirm the live operator details</h2>
            <p className="mt-4 leading-7 text-white/65">WNO can compare fit and logistics, but {operator.name} controls the actual operating schedule, selected variant, price, availability, policies, and fulfillment for its experiences.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {operator.products.map((product) => (
              <ProductCard
                key={product.id}
                attributionSource={FAREHARBOR_SOURCES.guide}
                product={{ ...product, operatorAttribution: undefined, isBookable: true, ctaLabel: "Check Times & Prices" } as any}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d4af37]/20 bg-[#110e14] px-6 py-12">
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Who does what?</p>
            <h2 className="mt-3 font-serif text-3xl">Operator and marketplace roles stay separate</h2>
            <p className="mt-4 text-sm leading-7 text-white/65">The operator provides and controls the tour. Welcome to New Orleans Tours is an independent comparison, recommendation, and referral layer that helps visitors choose among participating experiences.</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">How WNO makes money</p>
            <p className="mt-4 text-sm leading-7 text-white/65">WNO may earn a commission when a visitor books through an attributed partner link. That commercial relationship does not turn an unverified fact into a recommendation criterion. See the full selection and disclosure policy for how facts and editorial judgments are separated.</p>
            <Link href="/how-we-choose" className="mt-5 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4">How we choose & verify →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
