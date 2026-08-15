import type { MetadataRoute } from "next";
import { GET as getSitemapResponse } from "../../../app/sitemap.xml/route";

function decodeXml(value: string) {
  return value
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const xml = await (await getSitemapResponse()).text();
  const entries: MetadataRoute.Sitemap = [];

  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const body = match[1];
    const loc = body.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastModified = body.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1];
    entries.push({
      url: decodeXml(loc),
      ...(lastModified ? { lastModified: decodeXml(lastModified) } : {}),
    });
  }

  return entries;
}
