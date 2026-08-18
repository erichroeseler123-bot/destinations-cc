import { NextResponse } from "next/server";
import { STOREFRONT_PRODUCTS } from "@/app/new-orleans/tours/pageConfig";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORIGIN = "https://www.welcometoneworleanstours.com";

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
}

function normalizeHref(href: string) {
  try {
    const url = new URL(decode(href), ORIGIN);
    if (url.origin !== ORIGIN) return null;
    return url.pathname.replace(/\/$/, "") || "/";
  } catch {
    return null;
  }
}

function anchors(html: string) {
  const values: Array<{ href: string; text: string }> = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = normalizeHref(match[1]);
    if (!href) continue;
    const text = decode(match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    values.push({ href, text });
  }
  return values;
}

async function fetchHtml(path: string) {
  try {
    const response = await fetch(`${ORIGIN}${path}${path.includes("?") ? "&" : "?"}linkAudit=${Date.now()}`, {
      cache: "no-store",
      headers: { "User-Agent": "WNO link audit" },
    });
    return { path, ok: response.ok, status: response.status, html: await response.text() };
  } catch {
    return { path, ok: false, status: null, html: "" };
  }
}

export async function GET() {
  const sitemapResponse = await fetch(`${ORIGIN}/sitemap.xml?linkAudit=${Date.now()}`, { cache: "no-store" });
  const sitemapXml = sitemapResponse.ok ? await sitemapResponse.text() : "";
  const paths = [...sitemapXml.matchAll(/<loc>https:\/\/www\.welcometoneworleanstours\.com([^<]*)<\/loc>/g)]
    .map((match) => decode(match[1]) || "/")
    .map((path) => path.replace(/\/$/, "") || "/");

  const pages = await Promise.all(paths.map(fetchHtml));
  const inbound = new Map<string, Array<{ from: string; text: string }>>();
  for (const page of pages) {
    if (!page.ok) continue;
    for (const anchor of anchors(page.html)) {
      inbound.set(anchor.href, [...(inbound.get(anchor.href) || []), { from: page.path, text: anchor.text }]);
    }
  }

  const orphaned = paths.filter((path) => path !== "/" && !(inbound.get(path)?.length));
  const moneyPages = STOREFRONT_PRODUCTS.map((product) => `/tours/${product.slug}`);
  const moneyPageCoverage = moneyPages.map((path) => {
    const page = pages.find((item) => item.path === path);
    const links = page?.ok ? anchors(page.html) : [];
    const hasOperator = links.some((link) => link.href.startsWith("/operators/"));
    const hasGuide = links.some((link) => link.href.startsWith("/guides/"));
    const hasComparison = links.some((link) => link.href.startsWith("/compare/") || /compare|alternative|another/i.test(link.text));
    const hasDecisionQuestion = links.some((link) => /help me choose|which|compare|alternative|instead|fit/i.test(link.text));
    return {
      path,
      status: page?.status ?? null,
      inboundLinks: inbound.get(path)?.length || 0,
      hasOperator,
      hasGuide,
      hasComparison,
      hasDecisionQuestion,
      pass: Boolean(page?.ok && (inbound.get(path)?.length || 0) > 0 && hasOperator && hasDecisionQuestion),
    };
  });

  const weakMoneyPages = moneyPageCoverage.filter((row) => !row.pass);
  const genericAnchors = pages.flatMap((page) => page.ok ? anchors(page.html).map((link) => ({ ...link, from: page.path })) : [])
    .filter((link) => ["click here", "learn more", "read more"].includes(link.text.toLowerCase()));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      sitemapPages: paths.length,
      fetchedPages: pages.filter((page) => page.ok).length,
      orphaned: orphaned.length,
      moneyPages: moneyPages.length,
      weakMoneyPages: weakMoneyPages.length,
      genericAnchors: genericAnchors.length,
    },
    orphaned,
    weakMoneyPages,
    genericAnchors,
    moneyPageCoverage,
    pass: sitemapResponse.ok && orphaned.length === 0 && weakMoneyPages.length === 0,
  }, { headers: { "Cache-Control": "no-store" } });
}
