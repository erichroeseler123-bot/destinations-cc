import {
  socialRegistry,
  type BrandSocialProfile,
  type SocialLink,
} from "../data/social/social-registry";

function uniqueByPlatform(links: SocialLink[]): SocialLink[] {
  const seen = new Set<string>();
  const out: SocialLink[] = [];

  for (const link of links) {
    if (seen.has(link.platform)) continue;
    seen.add(link.platform);
    out.push(link);
  }

  return out;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function getBrandSocialProfile(brandKey?: string): BrandSocialProfile {
  const profile = brandKey ? socialRegistry[brandKey] : undefined;
  const dcc = socialRegistry.dcc;

  if (!profile) return dcc;

  if (profile.mode === "inherit-dcc") {
    return {
      ...profile,
      socials: dcc.socials,
      sameAs: dcc.sameAs,
      shareDefaults: {
        ...dcc.shareDefaults,
        ...profile.shareDefaults,
      },
    };
  }

  if (profile.mode === "mixed") {
    return {
      ...profile,
      socials: uniqueByPlatform([...(profile.socials || []), ...(dcc.socials || [])]),
      sameAs: uniqueStrings([...(profile.sameAs || []), ...(dcc.sameAs || [])]),
      shareDefaults: {
        ...dcc.shareDefaults,
        ...profile.shareDefaults,
      },
    };
  }

  return profile;
}

export function isRenderableSocial(link: SocialLink): boolean {
  if (!link.url) return false;
  if (link.active === false) return false;
  if (link.status === "planned" || link.status === "hidden") return false;
  return true;
}

export function getActiveSocials(brandKey?: string) {
  return getBrandSocialProfile(brandKey).socials.filter(isRenderableSocial);
}

export function getPrimarySocial(brandKey?: string) {
  return getActiveSocials(brandKey).find((item) => item.primary) ?? getActiveSocials(brandKey)[0];
}

export function getSameAs(brandKey?: string) {
  const profile = getBrandSocialProfile(brandKey);
  const sameAs = profile.sameAs || [];
  const socialUrls = getActiveSocials(brandKey).map((item) => item.url);
  return uniqueStrings([...sameAs, ...socialUrls]);
}

export function getShareDefaults(brandKey?: string) {
  return getBrandSocialProfile(brandKey).shareDefaults || { hashtags: [] as string[] };
}

export function getSocialLabel(platform: SocialLink["platform"]): string {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "tiktok":
      return "TikTok";
    case "x":
      return "X";
    case "youtube":
      return "YouTube";
    case "linkedin":
      return "LinkedIn";
    case "threads":
      return "Threads";
    case "spotify":
      return "Spotify";
    default:
      return platform;
  }
}
