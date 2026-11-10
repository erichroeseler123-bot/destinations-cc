import { redirect } from "next/navigation";
import {
  resolveRedRocksShow,
  validateRedRocksDccReturnUrl,
} from "@/lib/dcc/redRocksRidePlanner";

type SearchParamsInput = Promise<{
  artist?: string | string[];
  date?: string | string[];
  event?: string | string[];
  partySize?: string | string[];
  dcc_return?: string | string[];
}>;

function firstValue(val?: string | string[]): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

export default async function RedRocksAmphitheatreAliasPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const sp = await searchParams;
  const rawArtist = firstValue(sp.artist);
  const rawDate = firstValue(sp.date);
  const rawEvent = firstValue(sp.event);
  const rawPartySize = firstValue(sp.partySize);
  const rawReturn = firstValue(sp.dcc_return);

  const show = resolveRedRocksShow({
    artist: rawArtist,
    date: rawDate,
    event: rawEvent,
  });

  // Validate any supplied return destination to prevent open redirects
  const validated =
    validateRedRocksDccReturnUrl(rawReturn || "/red-rocks", show) ||
    validateRedRocksDccReturnUrl("/red-rocks", show) ||
    "https://www.destinationcommandcenter.com/red-rocks";
  const targetUrl = new URL(validated);

  if (rawPartySize && /^\d{1,2}$/.test(rawPartySize.trim())) {
    targetUrl.searchParams.set("partySize", rawPartySize.trim());
  }

  redirect(`${targetUrl.pathname}${targetUrl.search}`);
}
