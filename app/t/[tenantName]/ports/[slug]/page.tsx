import {
  buildPortPageMetadata,
  renderPortPage,
} from "@/app/ports/[slug]/PortPageShared";

export const revalidate = 3600;

export function generateStaticParams() {
  return ["juneau", "skagway", "ketchikan"].map((slug) => ({
    tenantName: "lfse",
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantName: string; slug: string }>;
}) {
  const { tenantName, slug } = await params;
  return buildPortPageMetadata(slug, tenantName === "lfse");
}

export default async function TenantPortPage({
  params,
}: {
  params: Promise<{ tenantName: string; slug: string }>;
}) {
  const { tenantName, slug } = await params;
  return renderPortPage(slug, tenantName === "lfse");
}
