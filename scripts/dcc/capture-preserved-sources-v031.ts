import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface PreservedHttpCaptureV031 {
  captureId: string;
  domain: "gosno" | "juneau";
  sourceId: string;
  sourceClass:
    | "first_party_telemetry"
    | "first_party_operational_system"
    | "operator_published_terms"
    | "official_government_feed";
  uri: string;
  finalUrl: string;
  httpMethod: "GET";
  httpStatus: number;
  contentType: string;
  retrievedAt: string;
  responseHeaders: Record<string, string>;
  /** Exact UTF-8 string of the raw HTTP response body bytes */
  rawBodyUtf8: string;
  rawByteLength: number;
  rawSha256: string;
  /** Separately derived plain text (for HTML sources) or null if raw is already plain/JSON */
  derivedTextUtf8: string;
  derivedTextByteLength: number;
  derivedTextSha256: string;
  extractorVersion: string;
  /** Only populated if the HTTP response or document explicitly declares a publication timestamp */
  sourcePublishedAt: string | null;
  lastModifiedHeader: string | null;
  etagHeader: string | null;
}

export const EXTRACTOR_VERSION_V031 = "dcc-html-text-extractor-v031.1";

/**
 * Deterministic HTML-to-text extractor that strips <script> and <style> blocks,
 * converts block tags to newlines, strips remaining HTML tags, decodes common numeric/named
 * HTML entities, and normalizes horizontal whitespace while preserving verbatim sentence flow.
 */
export function extractPlainTextFromHtmlV031(rawHtml: string): string {
  const withoutScriptsAndStyles = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const withBlockNewlines = withoutScriptsAndStyles.replace(
    /<\/?(?:p|div|li|ul|ol|h[1-6]|section|article|header|footer|main|tr|td|th|br|hr|details|summary|button)[^>]*>/gi,
    "\n",
  );

  const withoutInlineTags = withBlockNewlines.replace(/<[^>]+>/g, "");

  const decoded = withoutInlineTags
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*38;/g, "&")
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return decoded
    .split("\n")
    .map((line) => line.replace(/[ \t\r\f\v]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function sha256Hex(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const TARGET_CAPTURES: Array<{
  captureId: string;
  domain: "gosno" | "juneau";
  sourceId: string;
  sourceClass: PreservedHttpCaptureV031["sourceClass"];
  uri: string;
}> = [
  {
    captureId: "cap:gosno:route-feed-json",
    domain: "gosno",
    sourceId: "src:gosno:route-feed-api",
    sourceClass: "first_party_operational_system",
    uri: "https://gosno.co/api/public/route-feed",
  },
  {
    captureId: "cap:gosno:agent-json",
    domain: "gosno",
    sourceId: "src:gosno:agent-manifest",
    sourceClass: "first_party_operational_system",
    uri: "https://gosno.co/agent.json",
  },
  {
    captureId: "cap:gosno:llms-txt",
    domain: "gosno",
    sourceId: "src:gosno:llms-txt",
    sourceClass: "operator_published_terms",
    uri: "https://gosno.co/llms.txt",
  },
  {
    captureId: "cap:gosno:winter-park-html",
    domain: "gosno",
    sourceId: "src:gosno:winter-park-page",
    sourceClass: "operator_published_terms",
    uri: "https://gosno.co/winter-park",
  },
  {
    captureId: "cap:gosno:denver-to-breckenridge-html",
    domain: "gosno",
    sourceId: "src:gosno:breckenridge-page",
    sourceClass: "operator_published_terms",
    uri: "https://gosno.co/denver-to-breckenridge",
  },
  {
    captureId: "cap:juneau:coastal-icefield-excursion-html",
    domain: "juneau",
    sourceId: "src:coastal-helicopters:icefield-excursion",
    sourceClass: "operator_published_terms",
    uri: "https://coastalhelicopters.com/tours/icefield-excursion/",
  },
  {
    captureId: "cap:juneau:coastal-faq-html",
    domain: "juneau",
    sourceId: "src:coastal-helicopters:faq",
    sourceClass: "operator_published_terms",
    uri: "https://coastalhelicopters.com/faq/",
  },
  {
    captureId: "cap:juneau:temsco-mendenhall-glacier-html",
    domain: "juneau",
    sourceId: "src:temsco-helicopters:mendenhall-glacier",
    sourceClass: "operator_published_terms",
    uri: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
  },
  {
    captureId: "cap:juneau:northstar-walkabout-html",
    domain: "juneau",
    sourceId: "src:northstar-trekking:walkabout",
    sourceClass: "operator_published_terms",
    uri: "https://northstartrekking.com/adventures/helicopter-glacier-walkabout/",
  },
  {
    captureId: "cap:juneau:northstar-faqs-html",
    domain: "juneau",
    sourceId: "src:northstar-trekking:faqs",
    sourceClass: "operator_published_terms",
    uri: "https://northstartrekking.com/faqs/",
  },
  {
    captureId: "cap:juneau:faa-weathercams-html",
    domain: "juneau",
    sourceId: "src:faa-weathercams-jnu",
    sourceClass: "official_government_feed",
    uri: "https://weathercams.faa.gov/",
  },
];

async function main() {
  const captures: Record<string, PreservedHttpCaptureV031> = {};

  for (const target of TARGET_CAPTURES) {
    const retrievedAt = new Date().toISOString();
    const res = await fetch(target.uri, {
      method: "GET",
      headers: {
        "User-Agent": "DCC-MachineLayer-PreservedCapture/0.3.1 (+https://destinationcommandcenter.com)",
        Accept: "text/html,application/json,text/plain,*/*",
      },
    });
    const rawBuffer = Buffer.from(await res.arrayBuffer());
    const rawBodyUtf8 = rawBuffer.toString("utf8");
    const rawSha256 = sha256Hex(rawBuffer);
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";

    const responseHeaders: Record<string, string> = {};
    for (const [k, v] of res.headers.entries()) {
      const lower = k.toLowerCase();
      if (
        [
          "content-type",
          "content-length",
          "date",
          "etag",
          "last-modified",
          "cache-control",
          "server",
          "cf-ray",
          "x-vercel-id",
        ].includes(lower)
      ) {
        responseHeaders[lower] = v;
      }
    }

    const isHtml = contentType.toLowerCase().includes("text/html");
    const derivedTextUtf8 = isHtml ? extractPlainTextFromHtmlV031(rawBodyUtf8) : rawBodyUtf8;
    const derivedTextBuffer = Buffer.from(derivedTextUtf8, "utf8");
    const derivedTextSha256 = sha256Hex(derivedTextBuffer);

    let sourcePublishedAt: string | null = null;
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        const parsed = JSON.parse(rawBodyUtf8) as Record<string, unknown>;
        if (typeof parsed.updatedAt === "string") {
          const d = new Date(parsed.updatedAt);
          if (!Number.isNaN(d.getTime())) sourcePublishedAt = d.toISOString();
        }
      } catch {
        // ignore
      }
    }

    captures[target.captureId] = {
      captureId: target.captureId,
      domain: target.domain,
      sourceId: target.sourceId,
      sourceClass: target.sourceClass,
      uri: target.uri,
      finalUrl: res.url || target.uri,
      httpMethod: "GET",
      httpStatus: res.status,
      contentType,
      retrievedAt,
      responseHeaders,
      rawBodyUtf8,
      rawByteLength: rawBuffer.byteLength,
      rawSha256,
      derivedTextUtf8,
      derivedTextByteLength: derivedTextBuffer.byteLength,
      derivedTextSha256,
      extractorVersion: isHtml ? EXTRACTOR_VERSION_V031 : "identity-utf8-v031.1",
      sourcePublishedAt,
      lastModifiedHeader: res.headers.get("last-modified"),
      etagHeader: res.headers.get("etag"),
    };

    console.log(
      `Captured ${target.captureId} (${res.status}) rawBytes=${rawBuffer.byteLength} rawSha256=${rawSha256.slice(0, 16)}... derivedBytes=${derivedTextBuffer.byteLength} pubAt=${sourcePublishedAt ?? "null"}`,
    );
  }

  const outDir = path.join(process.cwd(), "data", "machine", "v03");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "preserved_captures_v031.json");
  fs.writeFileSync(outPath, JSON.stringify({ capturedSuiteVersion: "0.3.1-repair", captures }, null, 2), "utf8");
  console.log(`Saved ${Object.keys(captures).length} preserved captures to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
