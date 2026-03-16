import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OPERATORS_DIR = path.join(ROOT, "data", "operators");

export type TourOperatorRef = {
  slug: string;
  name?: string;
  city?: string;
  website?: string;
  phone?: string;
};

export type OperatorManifest = {
  slug?: string;
  name: string;
  city: string;
  founded?: string;
  specialties?: string[];
  website?: string;
  phone?: string;
  overview?: string;
  areasServed?: string[];
};

function readOperatorFile(slug: string): OperatorManifest | null {
  const filePath = path.join(OPERATORS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as OperatorManifest;
  } catch {
    return null;
  }
}

export function listOperatorSlugs(): string[] {
  if (!fs.existsSync(OPERATORS_DIR)) return [];
  return fs
    .readdirSync(OPERATORS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();
}

export function getOperatorManifest(slug: string): OperatorManifest | null {
  const manifest = readOperatorFile(slug);
  if (!manifest) return null;
  return { ...manifest, slug };
}

export function mergeOperatorRef(ref?: TourOperatorRef): TourOperatorRef | null {
  if (!ref?.slug) return null;
  const manifest = getOperatorManifest(ref.slug);
  if (!manifest) return ref;
  return {
    slug: ref.slug,
    name: ref.name || manifest.name,
    city: ref.city || manifest.city,
    website: ref.website || manifest.website,
    phone: ref.phone || manifest.phone,
  };
}
