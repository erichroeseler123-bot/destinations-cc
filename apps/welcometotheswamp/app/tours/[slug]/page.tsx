import type { Metadata } from "next";
import Link from "next/link";
import FareHarborWidget from "@/app/components/FareHarborWidget";
import { SITE_CONFIG } from "@/app/site-config";
import { notFound } from "next/navigation";

// Define a map of slugs to product ids
const SLUG_TO_ID: Record<string, string> = {
  "airboat-tour": "ragincajun-airboat",
  "covered-swamp-boat": "ragincajun-covered-boat",
  "private-covered-tour": "ragincajun-private-boat",
  "plantation-tour": "southernstyle-swamp",
  "city-tour": "southernstyle-city-tour",
};

const getProductImage = (productId: string) => {
  switch (productId) {
    case "ragincajun-airboat":
      return { src: "/images/boat-chooser/airboat-swamp.png", alt: "Ragin Cajun airboat swamp tour" };
    case "ragincajun-covered-boat":
      return { src: "/images/boat-chooser/covered-boat-swamp.png", alt: "Ragin Cajun covered swamp boat tour" };
    case "ragincajun-private-boat":
      return { src: "/images/boat-chooser/swamp-boat.png", alt: "Ragin Cajun private covered tour" };
    case "southernstyle-swamp":
      return { src: "/images/boat-chooser/hotel-pickup-swamp-boat.png", alt: "Plantation tour" };
    case "southernstyle-city-tour":
      return { src: "/images/boat-chooser/french-quarter-street.jpg", alt: "New Orleans city tour" };
    default:
      return undefined;
  }
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [
    { slug: "airboat-tour" },
    { slug: "covered-swamp-boat" },
    { slug: "private-covered-tour" },
    { slug: "plantation-tour" },
    { slug: "city-tour" },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const productId = SLUG_TO_ID[slug];
  if (!productId) return {};

  const product = SITE_CONFIG.swampFareHarborProducts.find((p) => p.id === productId);
  if (!product) return {};

  return {
    title: `${product.title} | Welcome to the Swamp`,
    description: product.description,
    alternates: { canonical: `https://welcometotheswamp.com/tours/${slug}` },
  };
}

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const productId = SLUG_TO_ID[slug];
  if (!productId) {
    notFound();
  }

  const product = SITE_CONFIG.swampFareHarborProducts.find((p) => p.id === productId);
  if (!product) {
    notFound();
  }

  const image = getProductImage(productId);
  const asn = SITE_CONFIG.fareharborSwampAsn;

  // Build the backup direct FareHarbor booking link
  const directLink = product.itemId
    ? `https://fareharbor.com/embeds/book/${product.companyShortname}/items/${product.itemId}/?asn=${asn}&flow=${product.flowId || ""}&ref=wts-detail-${slug}`
    : `https://fareharbor.com/embeds/book/${product.companyShortname}/?asn=${asn}&flow=${product.flowId || ""}&ref=wts-detail-${slug}`;

  const operatorLabel = product.companyShortname === "ragincajuntours" ? "Ragin Cajun Tours" : "Southern Style Tours";

  return (
    <main className="wts-tour-detail-page">
      <div className="wts-hero" style={{ minHeight: "380px" }}>
        {image ? (
          <div className="wts-hero-media">
            <img src={image.src} alt={image.alt} />
          </div>
        ) : null}
        <div className="wts-hero-copy" style={{ maxWidth: "640px" }}>
          <p className="wts-eyebrow" style={{ color: "#38bdf8", textTransform: "uppercase", fontSize: "11px", fontWeight: 800 }}>
            {product.eyebrow}
          </p>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "#fff", lineHeight: "1.1", margin: "8px 0" }}>
            {product.title}
          </h1>
          <p className="wts-hero-summary" style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "15px", lineHeight: "1.5" }}>
            {product.description}
          </p>
          <div style={{ marginTop: "12px" }}>
            <a
              href={directLink}
              className="wts-button wts-button-primary fh-book"
              style={{ padding: "12px 24px", fontSize: "13px", fontWeight: 700, borderRadius: "12px" }}
            >
              Book Direct Now
            </a>
          </div>
        </div>
      </div>

      <section className="wts-section" style={{ margin: "32px auto", maxWidth: "800px", padding: "28px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>
          Check Live Availability & Calendar
        </h2>
        <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          Compare real-time availability and select dates directly below. All bookings are handled in association with authorized local operator **{operatorLabel}** via FareHarbor.
        </p>

        <div style={{ background: "#f8fafc", borderRadius: "18px", padding: "16px", border: "1px solid #e2e8f0" }}>
          <FareHarborWidget
            companyShortname={product.companyShortname}
            refCode={asn}
            campaign={`wts-detail-${slug}`}
            itemId={product.itemId}
            flowId={product.flowId}
            layout="calendar"
            className="wts-availability-widget"
          />
        </div>
      </section>

      <section className="wts-disclosure" style={{ margin: "24px auto 48px auto", maxWidth: "800px", padding: "20px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "6px" }}>
          Booking Disclosure
        </h3>
        <p style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.5", margin: 0 }}>
          Welcome to the Swamp is a decision-first New Orleans tours storefront. When you check availability or book, you deal directly with FareHarbor and **{operatorLabel}**. Pricing, cancellation policy, weather delays, and pickup locations are governed by the merchant operator's terms.
        </p>
      </section>
    </main>
  );
}
