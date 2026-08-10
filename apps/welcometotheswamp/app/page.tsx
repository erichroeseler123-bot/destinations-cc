import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/jsonld";
import { SwampStorefrontPage } from "./StorefrontHomePage";
import { swampStorefrontConfig } from "./pageConfig";

export const pageIntent = "wts_storefront_home";

export const metadata: Metadata = {
  title: swampStorefrontConfig.metadata.title,
  description: swampStorefrontConfig.metadata.description,
  alternates: { canonical: "https://welcometotheswamp.com/" },
  openGraph: {
    title: swampStorefrontConfig.metadata.title,
    description: swampStorefrontConfig.metadata.description,
    url: "https://welcometotheswamp.com/",
    type: "website",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: "/",
        name: swampStorefrontConfig.metadata.title,
        description: swampStorefrontConfig.metadata.description,
      }),
      buildBreadcrumbJsonLd([{ name: "Welcome to the Swamp", item: "/" }]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SwampStorefrontPage page={swampStorefrontConfig} />
      <section className="border-t border-stone-800 bg-stone-950 px-6 py-10 text-stone-100">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Planning the rest of New Orleans?</p>
          <h2 className="mt-3 text-2xl font-black">Put the swamp tour into the rest of your day.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">If your real question is transportation, family fit, how much time you have, or what to do before or after a cruise, continue into the broader New Orleans tour-planning layer.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="rounded-xl border border-amber-300/40 px-4 py-3 text-sm font-bold" href="https://welcometoneworleanstours.com/best-swamp-tour-with-transportation">Swamp tours with transportation ↗</a>
            <a className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold" href="https://welcometoneworleanstours.com/new-orleans-plantation-and-swamp-tour">Plantation + swamp combinations ↗</a>
            <a className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold" href="https://welcometoneworleanstours.com/high-intent-tours">Plan the rest of New Orleans ↗</a>
          </div>
        </div>
      </section>
    </>
  );
}
