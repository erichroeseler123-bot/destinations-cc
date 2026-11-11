/**
 * Zero-Node / Zero-Neon Edge Context Token Redemption & URL PII Scrubber.
 * Uses pure Web Fetch, URL, Request, and Response APIs so standalone sub-apps
 * can import it from `proxy.ts` or outbound redirect routes without dragging in
 * `@neondatabase/serverless`, Node `fs`, or conflicting `next/server` types.
 */

import { resolveDccIngestBaseUrl, type EnvRecord } from "./envCompat";

export const EDGE_PII_QUERY_PARAM_KEYS = [
  "ctx",
  "dcc_ctx",
  "claim_owner",
  "replay_policy",
  "disabled_owner",
  "name",
  "fullName",
  "fullname",
  "firstName",
  "firstname",
  "lastName",
  "lastname",
  "passengerName",
  "passengername",
  "email",
  "e-mail",
  "phone",
  "phoneNumber",
  "phonenumber",
  "mobile",
  "weight",
  "passengerWeight",
  "passengerweight",
  "weights",
  "bodyWeight",
  "bodyweight",
  "accessibility",
  "medical",
  "medicalNotes",
  "medicalnotes",
  "mobilityNotes",
  "mobilitynotes",
  "dietary",
  "dob",
  "birthDate",
  "birthdate",
  "passport",
  "cabin",
  "cabinNumber",
  "cabinnumber",
  "stateroom",
  "stateroomNumber",
  "stateroomnumber",
  "bookingRef",
  "bookingref",
  "reservationNumber",
  "reservationnumber",
  "pnr",
  "shareCode",
  "sharecode",
  "plannerToken",
  "plannertoken",
] as const;

const EDGE_PII_NORMALIZED_SET = new Set<string>(
  EDGE_PII_QUERY_PARAM_KEYS.flatMap((key) => [
    key.toLowerCase(),
    key.toLowerCase().replace(/[^a-z0-9]/g, ""),
  ]),
);

/**
 * Scrubs all PII and context-redemption query parameters from a URL in place.
 * Preserves safe attribution/UTM parameters (`utm_*`, `pid`, `mcid`, `asn`, `ref`, etc.).
 */
export function stripEdgePiiQueryParams(
  url: URL,
  options?: { preserveCtx?: boolean },
): { mutated: boolean; strippedKeys: string[] } {
  const keysToRemove: string[] = [];
  for (const key of url.searchParams.keys()) {
    const lower = key.toLowerCase();
    const compact = lower.replace(/[^a-z0-9]/g, "");
    if (
      options?.preserveCtx &&
      (lower === "ctx" || lower === "dcc_ctx" || compact === "dccctx")
    ) {
      continue;
    }
    if (EDGE_PII_NORMALIZED_SET.has(lower) || EDGE_PII_NORMALIZED_SET.has(compact)) {
      if (!keysToRemove.includes(key)) {
        keysToRemove.push(key);
      }
    }
  }
  for (const key of keysToRemove) {
    url.searchParams.delete(key);
  }
  return {
    mutated: keysToRemove.length > 0,
    strippedKeys: keysToRemove,
  };
}

export interface EdgeContextRedeemOptions {
  owner: string;
  cookieName: string;
  cookieMaxAgeSeconds?: number;
  dccBaseUrl?: string;
  env?: EnvRecord;
  fetchImpl?: typeof fetch;
}

export interface EdgeContextRedeemOutcome {
  redeemed: boolean;
  errorCode: string | null;
}

export async function redeemEdgeDccContextToken(
  rawCtx: string,
  options: Pick<EdgeContextRedeemOptions, "owner" | "dccBaseUrl" | "env" | "fetchImpl">,
): Promise<EdgeContextRedeemOutcome> {
  const fetchFn = options.fetchImpl ?? fetch;
  const dccBase = (
    options.dccBaseUrl || resolveDccIngestBaseUrl(options.env)
  ).replace(/\/+$/, "");

  try {
    const res = await fetchFn(
      `${dccBase}/api/v1/context/${encodeURIComponent(rawCtx)}/edge-redeem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ owner: options.owner }),
        cache: "no-store",
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      errorCode?: string;
    };
    const redeemed = Boolean(res.ok && body.ok);
    return {
      redeemed,
      errorCode: redeemed ? null : body.errorCode || "REDEMPTION_FAILED",
    };
  } catch {
    return {
      redeemed: false,
      errorCode: "DCC_UNREACHABLE_FAIL_CLOSED",
    };
  }
}

/**
 * Inspects an incoming sub-app GET request for:
 *  1) an opaque `dcc_ctx_` token (`ctx` or `dcc_ctx`) -> redeems against DCC,
 *     sets a Secure HttpOnly SameSite=Lax cookie ONLY on verified redemption,
 *     strips all PII + ctx params, and returns a 302 Response;
 *  2) leaked PII query params without `dcc_ctx_` -> strips PII params and
 *     returns a 302 Response to the clean URL.
 *
 * Returns `null` when the request should continue normally (`NextResponse.next()`).
 */
export async function handleSubAppEdgeContextAndPii(
  request: Request,
  options: EdgeContextRedeemOptions,
): Promise<Response | null> {
  if (request.method.toUpperCase() !== "GET") {
    return null;
  }

  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/.well-known/") ||
    url.pathname.startsWith("/_next/")
  ) {
    return null;
  }

  const rawCtx =
    url.searchParams.get("ctx")?.trim() ||
    url.searchParams.get("dcc_ctx")?.trim() ||
    "";

  if (rawCtx.startsWith("dcc_ctx_")) {
    const outcome = await redeemEdgeDccContextToken(rawCtx, options);
    const cleanUrl = new URL(url.toString());
    stripEdgePiiQueryParams(cleanUrl);

    const headers = new Headers({
      location: cleanUrl.toString(),
      "cache-control": "no-store",
    });

    if (!outcome.redeemed) {
      headers.set("x-dcc-ctx-redemption", "failed");
      headers.set("x-dcc-ctx-error", outcome.errorCode || "REDEMPTION_FAILED");
      return new Response(null, { status: 302, headers });
    }

    const maxAge = options.cookieMaxAgeSeconds ?? 60 * 60 * 24;
    headers.set(
      "set-cookie",
      `${options.cookieName}=${rawCtx}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
    );
    headers.set("x-dcc-ctx-redemption", "redeemed");
    return new Response(null, { status: 302, headers });
  }

  // Also scrub any stray PII query parameters from public GET page navigations
  const scrubbedUrl = new URL(url.toString());
  const { mutated } = stripEdgePiiQueryParams(scrubbedUrl, { preserveCtx: true });
  if (mutated) {
    return new Response(null, {
      status: 302,
      headers: {
        location: scrubbedUrl.toString(),
        "cache-control": "no-store",
        "x-dcc-pii-scrubbed": "1",
      },
    });
  }

  return null;
}
