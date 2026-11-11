/**
 * Zero-third-party-dependency environment variable compatibility layer.
 * Safe in Node.js, Edge Runtime, and standalone sub-apps across the monorepo.
 */

export type EnvRecord = Record<string, string | undefined>;

function readNonEmpty(env: EnvRecord, keys: readonly string[]): string {
  for (const key of keys) {
    const raw = env[key];
    if (typeof raw === "string") {
      const trimmed = raw.trim().replace(/^["']|["']$/g, "");
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return "";
}

/**
 * Resolves the DCC base origin used for internal specialist inquiry ingest
 * and cross-site context redemption, retaining backward-compatible aliases:
 *   DCC_SPECIALIST_INQUIRY_INGEST_URL -> DCC_API_BASE_URL -> DCC_BASE_URL
 *   -> NEXT_PUBLIC_DCC_ORIGIN -> NEXT_PUBLIC_DCC_API_URL
 *   -> https://www.destinationcommandcenter.com
 */
export function resolveDccIngestBaseUrl(
  env: EnvRecord = process.env,
): string {
  const configured = readNonEmpty(env, [
    "DCC_SPECIALIST_INQUIRY_INGEST_URL",
    "DCC_API_BASE_URL",
    "DCC_BASE_URL",
    "NEXT_PUBLIC_DCC_ORIGIN",
    "NEXT_PUBLIC_DCC_API_URL",
  ]);
  const base = (configured || "https://www.destinationcommandcenter.com")
    .replace(/\/+$/, "")
    .replace(/\/api\/internal\/specialist-inquiries$/i, "");
  return base || "https://www.destinationcommandcenter.com";
}

/**
 * Resolves the full POST endpoint URL for `/api/internal/specialist-inquiries`.
 */
export function resolveDccIngestEndpointUrl(
  env: EnvRecord = process.env,
): string {
  return `${resolveDccIngestBaseUrl(env)}/api/internal/specialist-inquiries`;
}

/**
 * Resolves the shared internal API secret retaining backward-compatible aliases:
 *   DCC_INTERNAL_API_SECRET -> INTERNAL_API_SECRET -> OPERATOR_INBOX_SECRET
 */
export function resolveDccInternalSecret(
  env: EnvRecord = process.env,
): string {
  return readNonEmpty(env, [
    "DCC_INTERNAL_API_SECRET",
    "INTERNAL_API_SECRET",
    "OPERATOR_INBOX_SECRET",
  ]);
}

/**
 * Resolves the Viator partner ID (PID) retaining backward-compatible aliases:
 *   NEXT_PUBLIC_VIATOR_PID -> NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID -> fallback
 */
export function resolveViatorPid(
  env: EnvRecord = process.env,
  fallback = "",
): string {
  const resolved = readNonEmpty(env, [
    "NEXT_PUBLIC_VIATOR_PID",
    "NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID",
  ]);
  return resolved || fallback;
}
