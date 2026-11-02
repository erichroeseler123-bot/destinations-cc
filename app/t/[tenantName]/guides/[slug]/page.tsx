import PreSiteGuidePage, {
  generateMetadata as generateGuideMetadata,
} from "@/app/guides/[slug]/page";
import { PUBLISHED_DECISION_GUIDES } from "@/src/data/published-decision-guides";

export const revalidate = 3600;

const TENANTS = ["dcc"] as const;

export function generateStaticParams() {
  return TENANTS.flatMap((tenantName) =>
    PUBLISHED_DECISION_GUIDES.map((guide) => ({
      tenantName,
      slug: guide.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantName: string; slug: string }>;
}) {
  const { slug } = await params;
  return generateGuideMetadata({ params: Promise.resolve({ slug }) });
}

export default async function TenantGuidePage({
  params,
}: {
  params: Promise<{ tenantName: string; slug: string }>;
}) {
  const { slug } = await params;
  return PreSiteGuidePage({ params: Promise.resolve({ slug }) });
}
