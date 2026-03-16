import { getViatorRuntimeCapabilityProbe } from "@/lib/viator/runtime";

async function main() {
  const snapshot = await getViatorRuntimeCapabilityProbe();
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
