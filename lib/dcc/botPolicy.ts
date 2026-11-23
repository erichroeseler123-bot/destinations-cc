import { NextResponse } from "next/server";

/**
 * Non-beneficial commercial SEO, bulk-scraping, and aggressive crawlers that
 * consume serverless compute and upstream telemetry feeds without sending
 * travelers or powering legitimate search / AI assistant citations.
 */
export const BLOCKED_PARASITE_CRAWLERS = [
  "Bytespider",
  "AhrefsBot",
  "AhrefsSiteAudit",
  "SemrushBot",
  "SplitSignalBot",
  "SiteAuditBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "PetalBot",
  "DataForSeoBot",
  "SerpstatBot",
  "SEOkicks",
  "Barkrowler",
  "MegaIndex",
  "Sogou",
  "ZoominfoBot",
  "TurnitinBot",
  "CensysInspect",
] as const;

/**
 * Search engines, AI search/citation assistants, and link-preview agents that
 * MUST remain allowed on public discovery surfaces.
 */
const BENEFICIAL_SEARCH_OR_AI_BOT_PATTERN =
  /(googlebot|google-inspectiontool|googleother|adsbot-google|google-extended|bingbot|adidxbot|bingpreview|applebot|duckduckbot|slurp|yandexbot|oai-searchbot|gptbot|chatgpt-user|perplexitybot|perplexity-user|claude-searchbot|claude-user|claudebot|anthropic-ai|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|pinterest)/i;

const BLOCKED_PARASITE_BOT_PATTERN =
  /(bytespider|ahrefsbot|ahrefssiteaudit|semrushbot|splitsignalbot|siteauditbot|mj12bot|dotbot|blexbot|petalbot|dataforseobot|serpstatbot|seokicks|barkrowler|megaindex|sogou|zoominfobot|turnitinbot|censysinspect)/i;

const AUTOMATED_CRAWLER_PATTERN =
  /(bot|crawler|spider|slurp|archiver|bingpreview|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|vkshare|whatsapp|telegrambot|discordbot|slackbot|applebot|googleother|google-inspectiontool|gptbot|oai-searchbot|chatgpt-user|claude-searchbot|claude-user|claudebot|anthropic-ai|perplexitybot|perplexity-user|cohere-ai|ccbot|amazonbot|diffbot)/i;

export function isBeneficialSearchOrAiBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BENEFICIAL_SEARCH_OR_AI_BOT_PATTERN.test(userAgent);
}

export function isBlockedParasiteBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  if (BENEFICIAL_SEARCH_OR_AI_BOT_PATTERN.test(userAgent)) return false;
  return BLOCKED_PARASITE_BOT_PATTERN.test(userAgent);
}

export function isAutomatedCrawlerRequest(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return AUTOMATED_CRAWLER_PATTERN.test(userAgent) || BLOCKED_PARASITE_BOT_PATTERN.test(userAgent);
}

export function buildParasiteBotRobotsRules(): Array<{
  userAgent: string;
  disallow: string;
}> {
  return BLOCKED_PARASITE_CRAWLERS.map((userAgent) => ({
    userAgent,
    disallow: "/",
  }));
}

export function buildParasiteBotBlockedResponse(): NextResponse {
  return new NextResponse("Forbidden: automated scraper blocked by policy.", {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Vercel-CDN-Cache-Control": "public, s-maxage=86400",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
