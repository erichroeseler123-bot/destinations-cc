import { notFound } from "next/navigation";
import CategoryPage from "@/app/new-orleans/marketplace-category/[categorySlug]/page";
import PrivacyPage from "@/app/new-orleans/privacy/page";
import TermsPage from "@/app/new-orleans/terms/page";
import AccessibilityPage from "@/app/new-orleans/accessibility/page";

const specialPages = {
  privacy: PrivacyPage,
  terms: TermsPage,
  accessibility: AccessibilityPage,
} as const;

export default async function WnoTopLevelPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const resolved = await params;
  const SpecialPage = specialPages[resolved.categorySlug as keyof typeof specialPages];
  if (SpecialPage) return <SpecialPage />;

  if (!resolved.categorySlug) notFound();
  return <CategoryPage params={Promise.resolve({ categorySlug: resolved.categorySlug })} />;
}
