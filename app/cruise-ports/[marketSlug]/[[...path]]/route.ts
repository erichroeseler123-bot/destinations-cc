import { NextRequest } from "next/server";
import { PORT_AUTHORITY_CONFIG } from "@/src/data/port-authority-config";

const TRAVEL_MARKET_ORIGIN = "https://dcc-v1-cut-clean.vercel.app";

const ALLOWED_MARKETS = new Set([
  "port-canaveral",
  "port-everglades",
  "key-west",
  ...Object.keys(PORT_AUTHORITY_CONFIG)
]);

type RouteContext = {
  params: Promise<{
    marketSlug: string;
    path?: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyTravelMarketRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyTravelMarketRequest(request, context);
}

async function proxyTravelMarketRequest(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { marketSlug, path = [] } = await context.params;

  if (!ALLOWED_MARKETS.has(marketSlug)) {
    return new Response("Not found", { status: 404 });
  }

  const targetPath = [
    "cruise-ports",
    marketSlug,
    ...path.map((segment) => encodeURIComponent(segment)),
  ].join("/");
  const targetUrl = new URL(`/${targetPath}`, TRAVEL_MARKET_ORIGIN);
  targetUrl.search = request.nextUrl.search;

  const upstream = await fetch(targetUrl, {
    headers: {
      accept: request.headers.get("accept") ?? "text/html,*/*",
      "accept-language": request.headers.get("accept-language") ?? "en-US,en;q=0.9",
      "user-agent": request.headers.get("user-agent") ?? "DCC cruise-port proxy",
    },
    method: request.method,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = buildProxyHeaders(upstream.headers);
  const contentType = upstream.headers.get("content-type") ?? "";

  if (request.method === "HEAD") {
    return new Response(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  if (contentType.includes("text/html")) {
    const html = await upstream.text();

    return new Response(rewriteTravelMarketHtmlAssets(html), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

function buildProxyHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();
  const contentType = upstreamHeaders.get("content-type");
  const cacheControl = upstreamHeaders.get("cache-control");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  headers.set("x-dcc-proxy-source", "travelmarket-cruise-port");
  headers.set("cache-control", cacheControl ?? "public, max-age=60, s-maxage=300");

  return headers;
}

function rewriteTravelMarketHtmlAssets(html: string): string {
  return html
    .replaceAll('href="/_next/', `href="${TRAVEL_MARKET_ORIGIN}/_next/`)
    .replaceAll('src="/_next/', `src="${TRAVEL_MARKET_ORIGIN}/_next/`)
    .replaceAll('href="/images/', `href="${TRAVEL_MARKET_ORIGIN}/images/`)
    .replaceAll('src="/images/', `src="${TRAVEL_MARKET_ORIGIN}/images/`);
}
