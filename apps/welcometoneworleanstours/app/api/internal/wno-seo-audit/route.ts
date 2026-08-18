import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORIGIN = "https://www.welcometoneworleanstours.com";

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function firstMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decode(match[1].replace(/<[^>]+>/g, "").trim()) : null;
}

function extractCanonical(html: string) {
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return null;
}

function extractRobots(html: string) {
  const patterns = [
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return null;
}

async function fetchPage(url: string) {
  try {
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}seoAudit=${Date.now()}`, {
      cache: "no-store",
      headers: { "User-Agent": "WNO technical SEO audit" },
    });
    const html = await response.text();
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const h1 = firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const canonical = extractCanonical(html);
    const robots = extractRobots(html);
    return {
      url,
      status: response.status,
      ok: response.ok,
      title,
      h1,
      canonical,
      robots,
      noindex: Boolean(robots?.includes("noindex")),
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      title: null,
      h1: null,
      canonical: null,
      robots: null,
      noindex: false,
      error: error instanceof Error ? error.message : "fetch_failed",
    };
  }
}

function duplicates<T extends { url: string }>(rows: T[], key: (row: T) => string | null) {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const value = key(row)?.trim();
    if (!value) continue;
    grouped.set(value, [...(grouped.get(value) || []), row.url]);
  }
  return [...grouped.entries()]
    .filter(([, urls]) => urls.length > 1)
    .map(([value, urls]) => ({ value, urls }));
}

export async function GET() {
  const startedAt = Date.now();
  const sitemapResponse = await fetch(`${ORIGIN}/sitemap.xml?seoAudit=${startedAt}`, { cache: "no-store" });
  const sitemapXml = sitemapResponse.ok ? await sitemapResponse.text() : "";
  const urls = [...sitemapXml.matchAll(/<loc>(https:\/\/www\.welcometoneworleanstours\.com[^<]+)<\/loc>/g)]
    .map((match) => decode(match[1]));

  const results = await Promise.all(urls.map(fetchPage));
  const failures = results.filter((result) => !result.ok);
  const missingTitle = results.filter((result) => result.ok && !result.title).map((result) => result.url);
  const missingH1 = results.filter((result) => result.ok && !result.h1).map((result) => result.url);
  const missingCanonical = results.filter((result) => result.ok && !result.canonical).map((result) => result.url);
  const indexedNoindex = results.filter((result) => result.ok && result.noindex).map((result) => result.url);
  const duplicateTitles = duplicates(results, (result) => result.title);
  const duplicateCanonicals = duplicates(results, (result) => result.canonical);

  const pass = sitemapResponse.ok
    && failures.length === 0
    && missingTitle.length === 0
    && missingH1.length === 0
    && missingCanonical.length === 0
    && indexedNoindex.length === 0
    && duplicateTitles.length === 0
    && duplicateCanonicals.length === 0;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    sitemap: { ok: sitemapResponse.ok, status: sitemapResponse.status, urls: urls.length },
    summary: {
      checked: results.length,
      httpFailures: failures.length,
      missingTitle: missingTitle.length,
      missingH1: missingH1.length,
      missingCanonical: missingCanonical.length,
      indexedNoindex: indexedNoindex.length,
      duplicateTitles: duplicateTitles.length,
      duplicateCanonicals: duplicateCanonicals.length,
    },
    issues: {
      httpFailures: failures,
      missingTitle,
      missingH1,
      missingCanonical,
      indexedNoindex,
      duplicateTitles,
      duplicateCanonicals,
    },
    pass,
  }, { headers: { "Cache-Control": "no-store" } });
}
