import {
  writeViatorDestinationsCache,
  writeViatorTagsCache,
  writeViatorTaxonomyMeta,
} from "@/lib/viator/cache";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorServerConfig } from "@/lib/viator/config";

async function main() {
  const config = getViatorServerConfig();
  if (!config.apiKey) {
    throw new Error("VIATOR_API_KEY missing. Refusing to write fallback taxonomy as if it were live taxonomy.");
  }

  const client = getViatorClient();
  const destinations = await client.listDestinations();
  const tags = await client.listTags();
  if (!Array.isArray(tags.tags) || tags.tags.length === 0) {
    throw new Error("No tags returned from Viator. Refusing to write an empty live tag cache.");
  }

  const destinationsPath = writeViatorDestinationsCache(destinations);
  const tagsPath = writeViatorTagsCache(tags);
  const metaPath = writeViatorTaxonomyMeta({
    updatedAt: new Date().toISOString(),
    destinationsCount: destinations.destinations.length,
    tagsCount: tags.tags.length,
    source: "live",
    accessTier: config.accessTier,
  });

  console.log(`Saved Viator destinations cache to ${destinationsPath}`);
  console.log(`Saved Viator tags cache to ${tagsPath}`);
  console.log(`Saved Viator taxonomy metadata to ${metaPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
