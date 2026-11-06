function normalized(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function classifyKnownSource(value: string | null | undefined) {
  const source = normalized(value);
  if (!source) return null;
  if (source.includes("chatgpt") || source.includes("openai")) return "chatgpt-search";
  if (source.includes("perplexity")) return "perplexity-search";
  if (source.includes("claude") || source.includes("anthropic")) return "claude-search";
  if (source === "google" || source.includes("google.")) return "google-search";
  if (source.includes("bing")) return "bing-search";
  return null;
}

export function classifyWnoEntrySource({
  pathname,
  explicitSource,
  utmSource,
  referrer,
  search,
  gadCampaignId,
}: {
  pathname: string;
  explicitSource?: string | null;
  utmSource?: string | null;
  referrer?: string;
  search?: string | null;
  gadCampaignId?: string | null;
}) {
  const sp = search ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search) : null;
  const resolvedExplicit = explicitSource || sp?.get("src") || sp?.get("source");
  // Preserve WNO's explicit internal attribution tags when present.
  if (resolvedExplicit) return resolvedExplicit.trim().slice(0, 80);

  const resolvedGadCampaign = (gadCampaignId || sp?.get("gad_campaignid") || "").trim();
  if (resolvedGadCampaign) {
    return `google-ads-${resolvedGadCampaign}`.slice(0, 80);
  }
  if (sp?.get("gclid") || sp?.get("gbraid") || sp?.get("gad_source")) {
    return "google-ads";
  }

  const classifiedUtm = classifyKnownSource(utmSource || sp?.get("utm_source"));
  if (classifiedUtm) return classifiedUtm;

  try {
    const host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
    if (host.includes("chatgpt.com") || host.includes("openai.com")) return "chatgpt-search";
    if (host.includes("perplexity.ai")) return "perplexity-search";
    if (host.includes("claude.ai") || host.includes("anthropic.com")) return "claude-search";
    if (host.startsWith("www.google.") || host.startsWith("google.")) return "google-search";
    if (host.includes("bing.com")) return "bing-search";
    if (host.includes("destinationcommandcenter.com")) return "dcc-new-orleans";
    if (host.includes("cruisepromenade.com")) return "cruise-promenade";
    if (host.includes("welcometotheswamp.com")) return "welcome-to-the-swamp";
    if (host.includes("frenchquarterorientation.com")) return "french-quarter-orientation";
  } catch {}

  const clean = pathname.replace(/^\/guides\//, "").replace(/^\//, "") || "home";
  return `wtonot-entry-${clean}`.slice(0, 80);
}

