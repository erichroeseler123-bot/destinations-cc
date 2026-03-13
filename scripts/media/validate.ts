import fs from "node:fs";
import path from "node:path";
import {
  DccEditorialReviewManifestSchema,
  DccMediaManifestSchema,
  type DccEditorialReviewEntry,
  type DccEditorialReviewManifest,
  type DccEditorialReviewState,
  type DccEditorialScopePolicy,
  type DccMediaAsset,
  type DccMediaManifestEntry,
} from "@/lib/dcc/media/schema";

type Finding = {
  severity: "error" | "warn";
  code: string;
  message: string;
};

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data", "media", "manifest.json");
const REVIEW_MANIFEST_PATH = path.join(ROOT, "data", "media", "review-manifest.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const RAW_DIR = path.join(ROOT, "assets", "raw");
const HERO_MIN_WIDTH = 1600;
const STANDARD_MIN_WIDTH = 1200;

const PRIORITY_PATHS = [
  "/cities/denver",
  "/ports/juneau",
  "/venues/red-rocks-amphitheatre",
  "/attractions/mendenhall-glacier",
  "/routes/denver-red-rocks",
];

function push(
  out: Finding[],
  severity: Finding["severity"],
  code: string,
  message: string
) {
  out.push({ severity, code, message });
}

function webPathToFs(webPath: string): string {
  return path.join(PUBLIC_DIR, webPath.replace(/^\/+/, ""));
}

function rawPathToFs(rawPath: string): string {
  const rel = rawPath.replace(/^assets\/raw\//, "");
  return path.join(RAW_DIR, rel);
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

function detectBlockedSource(asset: DccMediaAsset): boolean {
  const low = `${asset.source} ${asset.attribution} ${asset.src_url}`.toLowerCase();
  const blockedPatterns = [
    /\bai-generated\b/,
    /\bmidjourney\b/,
    /\bstable\s*diffusion\b/,
    /\bunknown-license\b/,
    /\bstock photo\b/,
    /\bunlicensed stock\b/,
  ];
  return blockedPatterns.some((pattern) => pattern.test(low));
}

function validateAsset(
  findings: Finding[],
  reports: {
    candidateHeroesOnPriorityPages: string[];
    missingApprovedHeroCoverage: string[];
    missingTwoApprovedGalleryImages: string[];
  },
  entry: DccMediaManifestEntry,
  asset: DccMediaAsset,
  reviewEntry: DccEditorialReviewEntry | undefined,
  policy: DccEditorialScopePolicy,
  reviewState: DccEditorialReviewState,
  allowlist: string[],
  entryPath: string
) {
  if (!asset.alt?.trim()) {
    push(findings, "error", "media.alt_missing", `${entryPath} asset ${asset.id} missing alt text.`);
  }
  if (asset.alt.trim().length < 20) {
    push(findings, "error", "media.alt_too_short", `${entryPath} asset ${asset.id} alt text must be at least 20 characters.`);
  }
  if (!asset.license?.trim()) {
    push(findings, "error", "media.license_missing", `${entryPath} asset ${asset.id} missing license.`);
  }
  if (!asset.source?.trim() || !asset.attribution?.trim() || !asset.author?.trim()) {
    push(findings, "error", "media.credit_missing", `${entryPath} asset ${asset.id} missing source/author/attribution.`);
  }

  const host = sourceHost(asset.src_url);
  if (!host || !isAllowlisted(host, allowlist)) {
    push(findings, "error", "media.source_not_allowlisted", `${entryPath} asset ${asset.id} source not allowlisted: ${asset.src_url}`);
  }
  if (detectBlockedSource(asset)) {
    push(findings, "error", "media.blocked_source_signal", `${entryPath} asset ${asset.id} appears to use blocked source class.`);
  }

  const rawFs = rawPathToFs(asset.raw_path);
  if (!fs.existsSync(rawFs)) {
    push(findings, "error", "media.raw_missing", `${entryPath} asset ${asset.id} missing raw file: ${asset.raw_path}`);
  }

  const optimizedFs = webPathToFs(asset.optimized_path);
  if (!fs.existsSync(optimizedFs)) {
    push(findings, "error", "media.optimized_missing", `${entryPath} asset ${asset.id} missing optimized file: ${asset.optimized_path}`);
  } else {
    const sizeBytes = fs.statSync(optimizedFs).size;
    if (sizeBytes < 25_000) {
      push(findings, "warn", "media.optimized_too_small", `${entryPath} asset ${asset.id} may be too small (${sizeBytes} bytes).`);
    }
  }

  if (!/\.(webp|avif)$/i.test(asset.optimized_path)) {
    push(findings, "error", "media.optimized_format", `${entryPath} asset ${asset.id} optimized_path must be .webp or .avif.`);
  }

  const minWidth = asset.role === "hero" ? HERO_MIN_WIDTH : STANDARD_MIN_WIDTH;
  if (asset.width < minWidth) {
    push(findings, "error", "media.width_too_small", `${entryPath} asset ${asset.id} width ${asset.width} < ${minWidth}.`);
  }

  const tier = reviewEntry?.pageTier || entry.priority;
  if (reviewState === "candidate" && !policy.allowCandidate) {
    push(
      findings,
      "error",
      "media.candidate_not_allowed",
      `${entryPath} asset ${asset.id} is candidate but candidates are not allowed for ${asset.role} in ${tier} tier.`
    );
  }

  if (asset.role === "hero" && (tier === "gold" || tier === "high") && reviewState === "candidate") {
    reports.candidateHeroesOnPriorityPages.push(`${entryPath} (${asset.id})`);
    push(findings, "error", "media.priority_hero_candidate", `${entryPath} has candidate hero asset ${asset.id} on ${tier} tier.`);
  }

  if (tier === "gold" && asset.role === "hero" && policy.blockFallback && asset.sourceType === "fallback") {
    push(findings, "error", "media.gold_fallback_hero", `${entryPath} asset ${asset.id} hero cannot use fallback sourceType for gold tier.`);
  }
}

function getReviewState(
  reviewEntry: DccEditorialReviewEntry | undefined,
  asset: DccMediaAsset
): DccEditorialReviewState {
  return reviewEntry?.assetReviews.find((item) => item.assetId === asset.id)?.state || "candidate";
}

function getScopePolicy(
  tierPolicies: DccEditorialReviewManifest["tierPolicies"],
  entry: DccMediaManifestEntry,
  reviewEntry: DccEditorialReviewEntry | undefined,
  scope: DccMediaAsset["role"]
): DccEditorialScopePolicy {
  const tier = reviewEntry?.pageTier || entry.priority;
  const tierPolicy = tierPolicies[tier][scope];
  const override = reviewEntry?.scopeOverrides.find((item) => item.scope === scope)?.policy;
  return override || tierPolicy;
}

function main() {
  const findings: Finding[] = [];
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  const manifest = DccMediaManifestSchema.parse(JSON.parse(raw));
  const reviewRaw = fs.readFileSync(REVIEW_MANIFEST_PATH, "utf8");
  const reviewManifest = DccEditorialReviewManifestSchema.parse(JSON.parse(reviewRaw));
  const reviewByPath = new Map(
    reviewManifest.entries.map((entry) => [entry.canonicalPath, entry])
  );
  const reports = {
    candidateHeroesOnPriorityPages: [] as string[],
    missingApprovedHeroCoverage: [] as string[],
    missingTwoApprovedGalleryImages: [] as string[],
  };

  for (const requiredPath of PRIORITY_PATHS) {
    const entry = manifest.entries.find((item) => item.canonicalPath === requiredPath);
    if (!entry) {
      push(findings, "error", "media.priority_entry_missing", `Priority path missing media entry: ${requiredPath}`);
      continue;
    }
    const hasHero = entry.assets.some((asset) => asset.role === "hero");
    if (!hasHero) {
      push(findings, "error", "media.priority_hero_missing", `Priority path missing hero asset: ${requiredPath}`);
    }
    const galleryCount = entry.assets.filter((asset) => asset.role === "gallery").length;
    if (galleryCount < 2) {
      push(findings, "error", "media.priority_gallery_min", `Priority path must have at least 2 gallery assets: ${requiredPath}`);
    }
    const reviewEntry = reviewByPath.get(requiredPath);
    const hero = entry.assets.find((asset) => asset.role === "hero");
    if (hero) {
      const heroState = getReviewState(reviewEntry, hero);
      if (heroState !== "approved") {
        reports.missingApprovedHeroCoverage.push(requiredPath);
        push(findings, "error", "media.priority_hero_not_approved", `Priority hero must be approved in review manifest: ${requiredPath}`);
      }
      const heroPolicy = getScopePolicy(reviewManifest.tierPolicies, entry, reviewEntry, "hero");
      if (hero.sourceType === "fallback" && heroPolicy.blockFallback) {
        push(findings, "error", "media.priority_hero_fallback", `Priority hero cannot use fallback sourceType: ${requiredPath}`);
      }
    }

    const approvedGalleryCount = entry.assets.filter((asset) => {
      if (asset.role !== "gallery") return false;
      return getReviewState(reviewEntry, asset) === "approved";
    }).length;
    if (approvedGalleryCount < 2) {
      reports.missingTwoApprovedGalleryImages.push(requiredPath);
      push(findings, "error", "media.priority_gallery_approved_min", `Priority path must have at least 2 approved gallery assets: ${requiredPath}`);
    }
  }

  for (const entry of manifest.entries) {
    const reviewEntry = reviewByPath.get(entry.canonicalPath);
    const heroCount = entry.assets.filter((asset) => asset.role === "hero").length;
    if (heroCount === 0) {
      push(findings, "error", "media.entry_hero_missing", `${entry.canonicalPath} has no hero asset.`);
    }
    if (!reviewEntry) {
      push(findings, "error", "media.review_entry_missing", `Missing review-manifest entry for ${entry.canonicalPath}.`);
      continue;
    }

    const approvedHeroCount = entry.assets.filter((asset) => {
      if (asset.role !== "hero") return false;
      return getReviewState(reviewEntry, asset) === "approved";
    }).length;
    if (approvedHeroCount === 0) {
      reports.missingApprovedHeroCoverage.push(entry.canonicalPath);
    }

    const approvedGalleryCount = entry.assets.filter((asset) => {
      if (asset.role !== "gallery") return false;
      return getReviewState(reviewEntry, asset) === "approved";
    }).length;
    if (approvedGalleryCount < 2) {
      reports.missingTwoApprovedGalleryImages.push(entry.canonicalPath);
    }

    for (const asset of entry.assets) {
      const reviewState = getReviewState(reviewEntry, asset);
      const policy = getScopePolicy(
        reviewManifest.tierPolicies,
        entry,
        reviewEntry,
        asset.role
      );
      validateAsset(
        findings,
        reports,
        entry,
        asset,
        reviewEntry,
        policy,
        reviewState,
        manifest.allowlisted_sources,
        entry.canonicalPath
      );
    }
  }

  const errors = findings.filter((item) => item.severity === "error");
  const warnings = findings.filter((item) => item.severity === "warn");
  const summary = {
    ok: errors.length === 0,
    entries: manifest.entries.length,
    errors_count: errors.length,
    warnings_count: warnings.length,
    reports: {
      candidate_heroes_on_priority_pages: Array.from(new Set(reports.candidateHeroesOnPriorityPages)),
      entities_missing_approved_hero_coverage: Array.from(new Set(reports.missingApprovedHeroCoverage)),
      entities_missing_two_plus_approved_gallery_images: Array.from(new Set(reports.missingTwoApprovedGalleryImages)),
    },
    errors,
    warnings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) process.exit(1);
}

main();
