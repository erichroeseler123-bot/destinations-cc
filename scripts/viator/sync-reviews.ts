import { getViatorClient } from "@/lib/viator/client";
import { writeViatorReviewCache } from "@/lib/viator/cache";
import { getViatorServerConfig } from "@/lib/viator/config";

async function main() {
  const config = getViatorServerConfig();
  if (!config.apiKey) {
    throw new Error("VIATOR_API_KEY missing. Refusing to write fallback review caches.");
  }

  const productCodes = process.argv.slice(2).filter(Boolean);
  if (productCodes.length === 0) {
    throw new Error("Provide at least one product code.");
  }

  const client = getViatorClient();
  for (const productCode of productCodes) {
    const reviews = await client.getProductReviews(productCode);
    const filePath = writeViatorReviewCache(productCode, reviews);
    console.log(`Saved ${reviews.length} reviews to ${filePath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
