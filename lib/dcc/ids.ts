import type { DccNodeClass } from "./schema";

const ID_RE = /^dcc:([a-z_]+):([a-z0-9-]+):([0-9]{4,})$/;

const CLASS_CODE: Record<DccNodeClass, string> = {
  world: "WRD",
  continent: "CNT",
  country: "CTY",
  region: "REG",
  place: "PLC",
  district: "DST",
  neighborhood: "NBR",
  port: "PRT",
  transport_hub: "HUB",
  venue: "VEN",
  attraction: "ATR",
  lodging: "LDG",
  pickup_zone: "PKZ",
  route: "RTE",
  operator: "OPR",
  product: "PRD",
  service_area: "SVA",
  article: "ART",
  faq: "FAQ",
  signal: "SIG",
  collection: "COL",
  virtual: "VRT",
};

function normToken(input: string): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeScope(scope: string): string {
  return normToken(scope);
}

export function normalizeSlug(slug: string): string {
  return normToken(slug);
}

export function buildDccId(cls: DccNodeClass, scope: string, serial = 1): string {
  const normScope = normalizeScope(scope);
  const normSerial = String(serial).padStart(4, "0");
  return `dcc:${cls}:${normScope}:${normSerial}`;
}

export function parseDccId(id: string): {
  namespace: "dcc";
  cls: string;
  scope: string;
  serial: string;
} | null {
  const m = String(id || "").match(ID_RE);
  if (!m) return null;
  return {
    namespace: "dcc",
    cls: m[1],
    scope: m[2],
    serial: m[3],
  };
}

export function isValidDccId(id: string): boolean {
  return parseDccId(id) !== null;
}

export function buildReferenceCode(
  cls: DccNodeClass,
  scope: string,
  serial = 1,
): string {
  const prefix = CLASS_CODE[cls] || "UNK";
  const bits = normalizeScope(scope)
    .split("-")
    .filter(Boolean)
    .map((x) => x.toUpperCase())
    .slice(0, 6);
  return `${prefix}-${bits.join("-")}-${String(serial).padStart(4, "0")}`;
}
