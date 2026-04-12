import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import entrySurfaces from "@/data/generated/entry-surfaces.json";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const MAX_PROMOTED_ENTRY_SURFACES = 7;

async function fileExists(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");
  const candidates = [
    path.join(REPO_ROOT, "app", normalized, "page.tsx"),
    path.join(REPO_ROOT, "app", normalized, "page.jsx"),
    path.join(REPO_ROOT, "app", normalized, "page.mdx"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return true;
    } catch {}
  }

  return false;
}

async function routeExists(entry: EntrySurface) {
  if (await fileExists(entry.path)) return true;

  if (entry.kind === "city") {
    return fileExists("/[city]");
  }

  return false;
}

async function main() {
  const entries = entrySurfaces as EntrySurface[];
  const failures: string[] = [];
  const seenPaths = new Map<string, string>();
  const promotedEntries = entries.filter((entry) => entry.showInHomepage && entry.showInCommand);

  if (promotedEntries.length > MAX_PROMOTED_ENTRY_SURFACES) {
    failures.push(
      `promoted intake set exceeds cap: ${promotedEntries.length} > ${MAX_PROMOTED_ENTRY_SURFACES}`,
    );
  }

  for (const entry of entries) {
    if (!entry.showInHeader && !entry.showInHomepage && !entry.showInCommand) {
      failures.push(`${entry.id}: hidden from all intake surfaces`);
    }

    const existingId = seenPaths.get(entry.path);
    if (existingId && existingId !== entry.id) {
      failures.push(`${entry.id}: duplicate intake path ${entry.path} already claimed by ${existingId}`);
    }
    seenPaths.set(entry.path, entry.id);

    if (!(await routeExists(entry))) {
      failures.push(`${entry.id}: missing app route for ${entry.path}`);
    }
  }

  if (failures.length > 0) {
    console.error("Entry surface validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${entries.length} entry surfaces`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
