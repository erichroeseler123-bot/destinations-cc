import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { buildProviderImageAsset } from "@/src/lib/media/resolver";

export type WikimediaImageRecord = {
  source?: string;
  width?: number;
  height?: number;
  title?: string;
  extmetadata?: {
    Artist?: { value?: string };
    LicenseShortName?: { value?: string };
    LicenseUrl?: { value?: string };
    Credit?: { value?: string };
  };
};

export function buildWikimediaAttribution(image?: WikimediaImageRecord | null): NodeImageAsset["attribution"] | undefined {
  const artist = image?.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, " ").trim();
  const license = image?.extmetadata?.LicenseShortName?.value?.trim();
  const licenseUrl = image?.extmetadata?.LicenseUrl?.value?.trim();
  const credit = image?.extmetadata?.Credit?.value?.replace(/<[^>]+>/g, " ").trim();

  const label = [artist || credit || "Wikimedia Commons", license].filter(Boolean).join(" / ");
  if (!label) return undefined;

  return {
    label,
    href: licenseUrl || undefined,
  };
}

export function wikimediaImageToMedia(image: WikimediaImageRecord | null | undefined, fallbackAlt: string): NodeImageSet {
  const attribution = buildWikimediaAttribution(image);
  const asset = buildProviderImageAsset(
    "wikimedia",
    image?.source,
    fallbackAlt,
    attribution,
  );

  return {
    hero: asset,
    card: asset,
    gallery: asset ? [asset] : [],
  };
}
