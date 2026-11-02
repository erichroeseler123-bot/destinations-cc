import { notFound } from "next/navigation";
import DenverToVailShuttleGuidePage, {
  metadata as vailMetadata,
} from "@/app/transportation/colorado/denver-to-vail-shuttle-guide/page";

export const revalidate = 3600;

export function generateStaticParams() {
  return [
    {
      tenantName: "dcc",
      slug: "denver-to-vail-shuttle-guide",
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantName: string; slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "denver-to-vail-shuttle-guide") {
    return vailMetadata;
  }
  return {};
}

export default async function TenantColoradoShuttleGuidePage({
  params,
}: {
  params: Promise<{ tenantName: string; slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "denver-to-vail-shuttle-guide") {
    notFound();
  }
  return <DenverToVailShuttleGuidePage />;
}
