import { writeViatorLocationCache } from "@/lib/viator/cache";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorServerConfig } from "@/lib/viator/config";

async function main() {
  const config = getViatorServerConfig();
  if (!config.apiKey) {
    throw new Error("VIATOR_API_KEY missing. Refusing to write fallback location caches.");
  }

  const references = process.argv.slice(2).filter(Boolean);
  if (references.length === 0) {
    throw new Error("Provide at least one location reference.");
  }

  const payload = await getViatorClient().getLocationsBulk(references);
  const rows =
    payload && typeof payload === "object" && Array.isArray((payload as { locations?: unknown[] }).locations)
      ? (payload as { locations?: unknown[] }).locations || []
      : Array.isArray(payload)
        ? payload
        : [];

  for (const row of rows) {
    const record = row && typeof row === "object" ? (row as Record<string, unknown>) : null;
    const reference =
      (typeof record?.reference === "string" && record.reference) ||
      (typeof record?.providerReference === "string" && record.providerReference) ||
      null;
    if (!reference) continue;
    const filePath = writeViatorLocationCache(reference, row);
    console.log(`Saved location ${reference} to ${filePath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
