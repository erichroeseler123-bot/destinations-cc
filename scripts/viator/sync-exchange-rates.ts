import { writeViatorExchangeRatesCache } from "@/lib/viator/cache";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorServerConfig, normalizeViatorCurrency } from "@/lib/viator/config";

async function main() {
  const config = getViatorServerConfig();
  if (!config.apiKey) {
    throw new Error("VIATOR_API_KEY missing. Refusing to write fallback exchange rates.");
  }

  const currency = process.argv[2] ? normalizeViatorCurrency(process.argv[2]) : undefined;
  const payload = await getViatorClient().getExchangeRates(currency);
  const filePath = writeViatorExchangeRatesCache(payload);
  console.log(`Saved Viator exchange rates to ${filePath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

