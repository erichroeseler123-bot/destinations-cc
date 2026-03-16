import fs from "fs";
import path from "path";
import { getViatorClient } from "@/lib/viator/client";

async function main() {
  const client = getViatorClient();
  const root = process.cwd();
  const destinationsPath = path.join(root, "data", "viator-destinations.json");
  const tagsPath = path.join(root, "data", "viator-tags.json");

  const destinations = await client.listDestinations();
  const tags = await client.listTags();

  fs.writeFileSync(destinationsPath, `${JSON.stringify(destinations, null, 2)}\n`);
  fs.writeFileSync(tagsPath, `${JSON.stringify(tags, null, 2)}\n`);

  console.log(`Saved Viator destinations cache to ${destinationsPath}`);
  console.log(`Saved Viator tags cache to ${tagsPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
