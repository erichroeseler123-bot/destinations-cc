import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage, { generateMetadata as generateCategoryMetadata } from "@/app/new-orleans/marketplace-category/[categorySlug]/page";
import PrivacyPage from "@/app/new-orleans/privacy/page";
import TermsPage from "@/app/new-orleans/terms/page";
import AccessibilityPage from "@/app/new-orleans/accessibility/page";

const WNO_METADATA_BASE = new URL("https://welcometoneworleanstours.com");

const specialPages = {
  privacy: PrivacyPage,
  terms: TermsPage,
  accessibility: AccessibilityPage,
} as const;

const specialMetadata: Record<string, Metadata> = {
  privacy: {
    title: "Privacy Policy | Welcome to New Orleans Tours",
    description: "Privacy information for Welcome to New Orleans Tours.",
    alternates: { canonical: "/privacy" },
  },
  terms: {
    title: "Terms | Welcome to New Orleans Tours",
    description: "Terms for using Welcome to New Orleans Tours and its independent tour comparison and referral services.",
    alternates: { canonical: "/terms" },
  },
  accessibility: {
    title: "Accessibility | Welcome to New Orleans Tours",
    description: "Accessibility information for the Welcome to New Orleans Tours website and guidance for confirming tour-specific accessibility.",
    alternates: { canonical: "/accessibility" },
  },
};

function onWnoHost(metadata: Metadata): Metadata {
  return {
    ...metadata,
    metadataBase: WNO_METADATA_BASE,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const resolved = await params;
  if (specialMetadata[resolved.categorySlug]) return onWnoHost(specialMetadata[resolved.categorySlug]);
  return onWnoHost(await generateCategoryMetadata({ params: Promise.resolve({ categorySlug: resolved.categorySlug }) }));
}

export default async function WnoTopLevelPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const resolved = await params;
  const SpecialPage = specialPages[resolved.categorySlug as keyof typeof specialPages];
  if (SpecialPage) return <SpecialPage />;

  if (!resolved.categorySlug) notFound();
  return <CategoryPage params={Promise.resolve({ categorySlug: resolved.categorySlug })} />;
}
