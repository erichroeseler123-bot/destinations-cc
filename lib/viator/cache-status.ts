import fs from "fs";
import path from "path";
import { VIATOR_CACHE_FILES, getViatorReviewsDir, readViatorTaxonomyMeta } from "@/lib/viator/cache";

function statPath(filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      path: filePath,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    return {
      exists: false,
      path: filePath,
      size: 0,
      updatedAt: null,
    };
  }
}

export function getTaxonomyCacheStatus() {
  return {
    destinations: statPath(VIATOR_CACHE_FILES.destinations),
    tags: statPath(VIATOR_CACHE_FILES.tags),
    meta: readViatorTaxonomyMeta(),
  };
}

export function getReviewCacheStatus() {
  const dir = getViatorReviewsDir();
  const dirStatus = statPath(dir);
  let fileCount = 0;
  if (dirStatus.exists) {
    try {
      fileCount = fs.readdirSync(dir).filter((entry) => entry.endsWith(".json")).length;
    } catch {}
  }
  return {
    ...dirStatus,
    fileCount,
  };
}

export function getProductCacheStatus(productCode?: string | null) {
  if (!productCode) {
    return {
      exists: false,
      path: null,
      size: 0,
      updatedAt: null,
    };
  }
  return statPath(path.join(getViatorReviewsDir(), `${productCode}.json`));
}
