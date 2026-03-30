function applyTemplate(template: string, target: string) {
  if (template.includes("{url}")) {
    return template.replaceAll("{url}", encodeURIComponent(target));
  }

  const url = new URL(template);
  url.searchParams.set("url", target);
  return url.toString();
}

export function buildAffiliateTarget(target: string, affiliateTarget: string) {
  if (!target) return target;

  if (affiliateTarget === "ticketmaster") {
    const template = process.env.TICKETMASTER_AFFILIATE_DEEPLINK_BASE;
    return template ? applyTemplate(template, target) : target;
  }

  if (affiliateTarget === "seatgeek") {
    const template = process.env.SEATGEEK_AFFILIATE_DEEPLINK_BASE;
    return template ? applyTemplate(template, target) : target;
  }

  return target;
}
