import { PRE_SITE_GUIDES } from "@/src/data/pre-site-guides";
import { PRE_SITE_GUIDES_WAVE2 } from "@/src/data/pre-site-guides-wave2";

export const PUBLISHED_DECISION_GUIDES = [...PRE_SITE_GUIDES, ...PRE_SITE_GUIDES_WAVE2];

export function getPublishedDecisionGuide(slug: string) {
  return PUBLISHED_DECISION_GUIDES.find((guide) => guide.slug === slug);
}
