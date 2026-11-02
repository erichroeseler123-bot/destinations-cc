export const dynamicParams = true;
export const revalidate = 3600;

import type { Metadata } from "next";
import { getPortSlugs } from "@/lib/dcc/ports";
import {
  buildPortPageMetadata,
  renderPortPage,
} from "@/app/ports/[slug]/PortPageShared";

export async function generateStaticParams() {
  return getPortSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  return buildPortPageMetadata(resolvedParams.slug, false);
}

export default async function PortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderPortPage(slug, false);
}
