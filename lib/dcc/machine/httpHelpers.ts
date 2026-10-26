import { isDccMachineV1Enabled } from "./featureFlag";
import type { ResolvedMachineReferenceResult } from "./store";

export function enforceMachineLayerFeatureFlag(): Response | null {
  if (!isDccMachineV1Enabled()) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "DCC_MACHINE_V1_DISABLED",
          message:
            "DCC Machine Layer v0.1 is currently disabled by the DCC_MACHINE_V1 feature flag.",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-DCC-Machine-Version": "0.1.0",
        },
      },
    );
  }
  return null;
}

export function buildMachineJsonResponse(
  payload: unknown,
  options?: {
    status?: number;
    cacheControl?: string;
    etag?: string;
    lastModified?: string;
    extraHeaders?: Record<string, string>;
  },
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": options?.cacheControl ?? "public, max-age=60, s-maxage=60",
    "Access-Control-Allow-Origin": "*",
    "X-DCC-Machine-Version": "0.1.0",
    ...(options?.extraHeaders ?? {}),
  };
  if (options?.etag) {
    headers["ETag"] = options.etag;
  }
  if (options?.lastModified) {
    headers["Last-Modified"] = options.lastModified;
  }
  return Response.json(payload, {
    status: options?.status ?? 200,
    headers,
  });
}

export function buildReferenceHttpResponse(
  request: Request,
  resolved: ResolvedMachineReferenceResult | null,
  isHead = false,
): Response {
  const flagBlocked = enforceMachineLayerFeatureFlag();
  if (flagBlocked) return flagBlocked;

  if (!resolved) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "REFERENCE_NOT_FOUND",
          message: "The requested DCC machine reference ID or version does not exist.",
        },
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "X-DCC-Machine-Version": "0.1.0",
        },
      },
    );
  }

  const ifNoneMatch = request.headers.get("if-none-match");
  const baseHeaders: Record<string, string> = {
    ETag: resolved.etag,
    "Last-Modified": resolved.lastModified,
    "Cache-Control": resolved.cacheControl,
    Vary: "Accept",
    "Access-Control-Allow-Origin": "*",
    "X-DCC-Machine-Version": "0.1.0",
    "X-DCC-Reference-Id": resolved.envelope.referenceId,
    "X-DCC-Immutable-Version": resolved.envelope.immutableVersion,
    "X-DCC-Epistemic-Status": resolved.envelope.currentStatus,
    "X-DCC-Canonical-Citation": resolved.envelope.canonicalCitationUri,
  };

  if (ifNoneMatch && ifNoneMatch === resolved.etag) {
    return new Response(null, {
      status: 304,
      headers: baseHeaders,
    });
  }

  const url = new URL(request.url);
  const formatParam = url.searchParams.get("format")?.toLowerCase();
  const accept = (request.headers.get("accept") ?? "application/json").toLowerCase();

  let contentType = "application/json; charset=utf-8";
  let bodyString = "";

  if (formatParam === "jsonld" || accept.includes("application/ld+json")) {
    contentType = "application/ld+json; charset=utf-8";
    bodyString = JSON.stringify(resolved.jsonLd, null, 2);
  } else if (
    formatParam === "csl" ||
    accept.includes("application/vnd.citationstyles.csl+json")
  ) {
    contentType = "application/vnd.citationstyles.csl+json; charset=utf-8";
    bodyString = JSON.stringify(resolved.cslJson, null, 2);
  } else if (
    formatParam === "html" ||
    (accept.includes("text/html") && !accept.includes("application/json"))
  ) {
    contentType = "text/html; charset=utf-8";
    bodyString = resolved.html;
  } else {
    contentType = "application/json; charset=utf-8";
    bodyString = JSON.stringify(resolved.envelope, null, 2);
  }

  baseHeaders["Content-Type"] = contentType;
  baseHeaders["Content-Length"] = String(Buffer.byteLength(bodyString, "utf8"));

  if (isHead) {
    return new Response(null, {
      status: 200,
      headers: baseHeaders,
    });
  }

  return new Response(bodyString, {
    status: 200,
    headers: baseHeaders,
  });
}
