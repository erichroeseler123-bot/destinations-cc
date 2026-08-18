import { NextResponse } from "next/server";
import { STOREFRONT_PRODUCTS } from "@/app/new-orleans/tours/pageConfig";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORIGIN = "https://www.welcometoneworleanstours.com";

export async function GET() {
  const rows = await Promise.all(
    STOREFRONT_PRODUCTS.map(async (product) => {
      const imageUrl = product.imageUrl;
      const absolute = imageUrl.startsWith("http") ? imageUrl : `${ORIGIN}${imageUrl}`;
      let status: number | null = null;
      let bytes: number | null = null;
      let contentType: string | null = null;
      try {
        const response = await fetch(absolute, { method: "GET", cache: "no-store", headers: { "User-Agent": "WNO image audit" } });
        status = response.status;
        contentType = response.headers.get("content-type");
        const body = await response.arrayBuffer();
        bytes = body.byteLength;
      } catch {
        status = null;
      }
      return {
        slug: product.slug,
        title: product.title,
        imageUrl,
        alt: product.imageAlt || null,
        status,
        bytes,
        contentType,
        under100Kb: bytes !== null ? bytes < 100_000 : false,
      };
    }),
  );

  const grouped = new Map<string, string[]>();
  for (const row of rows) grouped.set(row.imageUrl, [...(grouped.get(row.imageUrl) || []), row.slug]);
  const duplicateImages = [...grouped.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([imageUrl, slugs]) => ({ imageUrl, slugs }));
  const broken = rows.filter((row) => row.status !== 200);
  const missingAlt = rows.filter((row) => !row.alt);
  const oversized = rows.filter((row) => row.bytes !== null && row.bytes >= 100_000);
  const uniqueCount = grouped.size;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      products: rows.length,
      uniqueImages: uniqueCount,
      duplicateImageGroups: duplicateImages.length,
      brokenImages: broken.length,
      missingAlt: missingAlt.length,
      oversized100Kb: oversized.length,
    },
    duplicateImages,
    broken,
    missingAlt: missingAlt.map((row) => ({ slug: row.slug, imageUrl: row.imageUrl })),
    oversized: oversized.map((row) => ({ slug: row.slug, imageUrl: row.imageUrl, bytes: row.bytes })),
    results: rows,
    pass: rows.length === 21 && uniqueCount === 21 && broken.length === 0 && missingAlt.length === 0 && oversized.length === 0,
  }, { headers: { "Cache-Control": "no-store" } });
}
