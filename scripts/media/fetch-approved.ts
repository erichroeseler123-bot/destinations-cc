import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { DccMediaManifestSchema, type DccMediaAsset } from "@/lib/dcc/media/schema";

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data", "media", "manifest.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const RAW_DIR = path.join(ROOT, "assets", "raw");

function webPathToFs(webPath: string): string {
  return path.join(PUBLIC_DIR, webPath.replace(/^\/+/, ""));
}

function rawPathToFs(rawPath: string): string {
  const rel = rawPath.replace(/^assets\/raw\//, "");
  return path.join(RAW_DIR, rel);
}

function ensureParent(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sourceHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowlisted(host: string, allowlist: string[]): boolean {
  return allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

async function downloadToFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  ensureParent(destination);
  fs.writeFileSync(destination, buffer);
}

function convertToWebp(inputPath: string, outputPath: string): void {
  ensureParent(outputPath);
  execFileSync("convert", [inputPath, "-quality", "82", outputPath], { stdio: "inherit" });
}

async function processAsset(asset: DccMediaAsset, allowlist: string[]) {
  const host = sourceHost(asset.src_url);
  if (!host || !isAllowlisted(host, allowlist)) {
    throw new Error(`Source not allowlisted for asset ${asset.id}: ${asset.src_url}`);
  }

  const rawFs = rawPathToFs(asset.raw_path);
  const optimizedFs = webPathToFs(asset.optimized_path);

  if (!fs.existsSync(rawFs)) {
    await downloadToFile(asset.src_url, rawFs);
  }

  convertToWebp(rawFs, optimizedFs);
}

async function main() {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  const parsed = DccMediaManifestSchema.parse(JSON.parse(raw));

  for (const entry of parsed.entries) {
    for (const asset of entry.assets) {
      await processAsset(asset, parsed.allowlisted_sources);
    }
  }

  console.log(`media fetch complete: ${parsed.entries.length} entries`);
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
