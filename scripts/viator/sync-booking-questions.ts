import { writeViatorBookingQuestionsCache } from "@/lib/viator/cache";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorServerConfig } from "@/lib/viator/config";

async function main() {
  const config = getViatorServerConfig();
  if (!config.apiKey) {
    throw new Error("VIATOR_API_KEY missing. Refusing to write fallback booking question caches.");
  }

  const productCodes = process.argv.slice(2).filter(Boolean);
  if (productCodes.length === 0) {
    throw new Error("Provide at least one product code.");
  }

  const client = getViatorClient();
  for (const productCode of productCodes) {
    const questions = await client.getProductBookingQuestions(productCode);
    const filePath = writeViatorBookingQuestionsCache(productCode, questions);
    console.log(`Saved ${questions.length} booking questions to ${filePath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

