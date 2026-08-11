const VIATOR_BASE = "https://www.viator.com/searchResults/all";

export function buildViatorSearchUrl(query: string, campaign: string) {
  const url = new URL(VIATOR_BASE);
  url.searchParams.set("text", query);

  const pid = process.env.NEXT_PUBLIC_LAST_FRONTIER_VIATOR_PID || process.env.NEXT_PUBLIC_VIATOR_PID || "";
  const mcid = process.env.NEXT_PUBLIC_LAST_FRONTIER_VIATOR_MCID || process.env.NEXT_PUBLIC_VIATOR_MCID || "42383";

  if (pid) url.searchParams.set("pid", pid);
  if (mcid) url.searchParams.set("mcid", mcid);
  url.searchParams.set("medium", "link");
  url.searchParams.set("campaign", `last-frontier-${campaign}`);
  url.searchParams.set("utm_source", "lastfrontiershoreexcursions.com");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", `last-frontier-${campaign}`);
  return url.toString();
}
