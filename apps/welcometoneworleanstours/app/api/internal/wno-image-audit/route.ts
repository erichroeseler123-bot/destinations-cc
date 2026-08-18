import { NextResponse } from "next/server";
import { STOREFRONT_PRODUCTS } from "@/app/new-orleans/tours/pageConfig";
import { resolveProductImage } from "@/app/new-orleans/lib/imageResolver";
import { WNO_PRODUCT_IMAGE_QUALITY, WNO_PRODUCT_IMAGE_WIDTH } from "@/app/new-orleans/lib/optimizedProductImage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORIGIN = "https://www.welcometoneworleanstours.com";
const TARGET_BYTES = 80_000;
const INTENTIONAL_TEXT_ONLY = new Set([
  "all-day-city-plantation-combo",
  "covered-boat-plantation-combo",
  "swamp-boat-oak-alley-combo",
  "swamp-boat-whitney-combo",
  "city-cemetery-garden-district-tour",
]);

export async function GET() {
  const rows = await Promise.all(
    STOREFRONT_PRODUCTS.map(async (product) => {
      const resolved = resolveProductImage(product);
      if (!resolved) {
        return {
          slug: product.slug,
          title: product.title,
          imageUrl: null as string | null,
          alt: null as string | null,
          source: "text-only" as const,
          intentionalTextOnly: INTENTIONAL_TEXT_ONLY.has(product.slug),
          status: null as number | null,
          bytes: null as number | null,
          contentType: null as string | null,
          under80Kb: null as boolean | null,
        };
      }

      const imageUrl = resolved.src;
      const absolute = imageUrl.startsWith("http") ? imageUrl : `${ORIGIN}${imageUrl}`;
      let status: number | null = null;
      let bytes: number | null = null;
      let contentType: string | null = null;
      try {
        const response = await fetch(absolute, { method: "GET", cache: "no-store", headers: { "User-Agent": "WNO delivered-image audit", "Accept": "image/webp,image/*" } });
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
        alt: resolved.alt || null,
        source: resolved.source,
        intentionalTextOnly: false,
        status,
        bytes,
        contentType,
        under80Kb: bytes !== null ? bytes < TARGET_BYTES : false,
      };
    }),
  );

  const rendered = rows.filter((row) => row.imageUrl !== null);
  const textOnly = rows.filter((row) => row.imageUrl === null);
  const unexpectedTextOnly = textOnly.filter((row) => !row.intentionalTextOnly);
  const grouped = new Map<string, string[]>();
  for (const row of rendered) grouped.set(row.imageUrl!, [...(grouped.get(row.imageUrl!) || []), row.slug]);
  const duplicateImages = [...grouped.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([imageUrl, slugs]) => ({ imageUrl, slugs }));
  const broken = rendered.filter((row) => row.status !== 200);
  const missingAlt = rendered.filter((row) => !row.alt);
  const oversized = rendered.filter((row) => row.status === 200 && row.bytes !== null && row.bytes >= TARGET_BYTES);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    definition: `Audits the exact optimized image URL delivered by WNO. Rendered product images are pinned to ${WNO_PRODUCT_IMAGE_WIDTH}px at quality ${WNO_PRODUCT_IMAGE_QUALITY}; target transfer size is under 80KB. Five products remain intentionally text-only until accurate rights-cleared imagery exists.`,
    target: { widthPx: WNO_PRODUCT_IMAGE_WIDTH, quality: WNO_PRODUCT_IMAGE_QUALITY, maxBytesExclusive: TARGET_BYTES },
    summary: {
      products: rows.length,
      renderedImages: rendered.length,
      intentionalTextOnly: textOnly.filter((row) => row.intentionalTextOnly).length,
      unexpectedTextOnly: unexpectedTextOnly.length,
      uniqueRenderedImages: grouped.size,
      duplicateImageGroups: duplicateImages.length,
      brokenImages: broken.length,
      missingAlt: missingAlt.length,
      oversized80Kb: oversized.length,
    },
    duplicateImages,
    textOnly: textOnly.map((row) => ({ slug: row.slug, intentional: row.intentionalTextOnly })),
    broken,
    missingAlt: missingAlt.map((row) => ({ slug: row.slug, imageUrl: row.imageUrl })),
    oversized: oversized.map((row) => ({ slug: row.slug, imageUrl: row.imageUrl, bytes: row.bytes })),
    results: rows,
    pass: rows.length === 21 && unexpectedTextOnly.length === 0 && broken.length === 0 && missingAlt.length === 0 && oversized.length === 0,
  }, { headers: { "Cache-Control": "no-store" } });
}
