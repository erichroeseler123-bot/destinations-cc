import CinematicPageHero from "./CinematicPageHero";
import IntentSeoLanding, { type IntentSeoLandingConfig } from "./IntentSeoLanding";
import SeoPageRenderer from "./SeoPageRenderer";
import { getProductById } from "../data/index";
import type { SeoPageRecord } from "../data/types";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import styles from "./cinematicGuideLayer.module.css";

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

export function CinematicSeoGuide({ page }: { page: SeoPageRecord }) {
  return (
    <>
      <CinematicPageHero
        eyebrow={page.heroEyebrow || "New Orleans planning guide"}
        title={page.heroTitle}
        intro={page.heroSubtitle || page.openingAnswer || "Use this guide to narrow the New Orleans experiences that fit your timing, group, and priorities."}
        image={seoGuideImage(page)}
        actions={[
          { href: "/help-me-choose", label: "Help Me Choose", detail: "Narrow the best fit", primary: true },
          { href: "/guides/things-to-do-in-new-orleans-today", label: "What Fits Today", detail: "Current planning ideas" },
        ]}
      />
      <div className={styles.legacySeo}>
        <SeoPageRenderer page={page} />
      </div>
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
      <div className={styles.legacyIntent}>
        <IntentSeoLanding config={config} />
      </div>
    </>
  );
}
