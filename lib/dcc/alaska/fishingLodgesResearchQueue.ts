/**
 * Internal-Only Southeast Alaska Fishing Lodge Research & Hold Queue
 * (`lib/dcc/alaska/fishingLodgesResearchQueue.ts`).
 *
 * GOVERNANCE RULE:
 * Records in this module are strictly INTERNAL research tracking records.
 * They MUST NEVER be serialized in public API responses (`/api/v1/alaska/fishing-lodges`),
 * public directory listings (`/southeast-alaska/fishing-lodges`), static route generation,
 * or XML sitemaps until primary-source subpage evidence clears `evaluateSoutheastAlaskaLodgePublicationGate()`.
 */

export interface HeldSoutheastAlaskaLodgeCandidate {
  candidateId: string;
  name: string;
  gatewayOrCommunity: string;
  officialUrlCandidate: string | null;
  holdStatus:
    | "challenge_gated_not_bypassed"
    | "network_or_tls_unretrieved"
    | "insufficient_subpage_claim_evidence"
    | "excluded_non_alaska_domain_collision";
  holdExplanation: string;
  ownershipGovernanceNote?: string;
  checkedAt: string;
}

export const INTERNAL_HELD_SEAK_LODGE_RESEARCH_QUEUE: readonly HeldSoutheastAlaskaLodgeCandidate[] = [
  {
    candidateId: "held:dove-island-lodge-sitka",
    name: "Dove Island Lodge",
    gatewayOrCommunity: "Sitka",
    officialUrlCandidate: "https://doveislandlodge.com/",
    holdStatus: "challenge_gated_not_bypassed",
    holdExplanation:
      "Returned HTTP 403 anti-bot challenge on 2026-11-19; inspection stopped immediately per strict non-bypass policy.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:salmon-falls-resort-ketchikan",
    name: "Salmon Falls Resort",
    gatewayOrCommunity: "Ketchikan",
    officialUrlCandidate: "https://www.salmonfallsresort.com/",
    holdStatus: "network_or_tls_unretrieved",
    holdExplanation:
      "Connection failed during automated primary-source check on 2026-11-19; held out of public listings until official rates, rooms, and transfer pages are retrieved directly.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:talon-lodge-sitka",
    name: "Talon Lodge & Spa",
    gatewayOrCommunity: "Sitka",
    officialUrlCandidate: "https://www.talonlodge.com/",
    holdStatus: "network_or_tls_unretrieved",
    holdExplanation:
      "Connection terminated during automated primary-source check on 2026-11-19; held out of public listings until primary-source subpages are retrieved.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:the-cedars-lodge-ketchikan",
    name: "The Cedars Lodge",
    gatewayOrCommunity: "Ketchikan",
    officialUrlCandidate: "https://cedarslodge.com/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Phase 2 candidate held pending standalone verification of accommodation/dock subpages.",
    ownershipGovernanceNote:
      "Shares toll-free reservation number (888-564-4525) and rate-page copy with Clover Pass Resort, but shared contact info alone does NOT establish common legal ownership.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:steamboat-bay-fishing-club",
    name: "Steamboat Bay Fishing Club",
    gatewayOrCommunity: "Noyes Island / Ketchikan",
    officialUrlCandidate: "https://steamboatbay.com/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Phase 2 candidate: homepage retrieved on 2026-11-19, but subpages for accommodations, transfers, and package terms require individual retrieval before publication.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:wild-strawberry-lodge-sitka",
    name: "Wild Strawberry Lodge",
    gatewayOrCommunity: "Sitka",
    officialUrlCandidate: "https://wildstrawberrylodge.com/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Phase 2 Sitka candidate held pending extraction of current seasonal package inclusions and room configurations.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:kingfisher-charters-sitka",
    name: "Kingfisher Charters & Lodge (Sitka)",
    gatewayOrCommunity: "Sitka",
    officialUrlCandidate: "https://www.kingfishercharters.co/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Phase 2 Sitka candidate (104 Berry Knoll, Sitka — strictly distinct from Alaska's Kingfisher Lodge in Craig) held pending subpage rate/inclusion verification.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:sportsmans-cove-lodge",
    name: "Sportsman's Cove Lodge",
    gatewayOrCommunity: "Saltery Cove / Ketchikan",
    officialUrlCandidate: "https://www.sportsmanscovelodge.com/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Client-rendered Wix shell returned no static claim text on 2026-11-19; held until subpage text is verified.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:fireweed-lodge-klawock",
    name: "Fireweed Lodge",
    gatewayOrCommunity: "Klawock (Prince of Wales Island)",
    officialUrlCandidate: "https://alaskafishingkingsalmon.com/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Domain redirect (fireweedlodge.com -> alaskafishingkingsalmon.com) verified; held for Phase 2 rate & transfer verification.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:prince-of-wales-sportfishing",
    name: "Prince of Wales Sportfishing",
    gatewayOrCommunity: "Craig (Prince of Wales Island)",
    officialUrlCandidate: "https://princeofwalessportfishing.com/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Charter + partner guest-house/B&B structure requires separate seller vs. accommodation subpage verification before listing.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "held:annie-mae-lodge-gustavus",
    name: "The Annie Mae Lodge",
    gatewayOrCommunity: "Gustavus",
    officialUrlCandidate: "https://www.anniemae.com/",
    holdStatus: "insufficient_subpage_claim_evidence",
    holdExplanation:
      "Gustavus lodging candidate held pending verification of current fishing-charter partnership vs. room-only arrangements.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "excluded:silverkinglodge-com-costa-rica",
    name: "Silver King Lodge (silverkinglodge.com — Excluded Non-Alaska Domain)",
    gatewayOrCommunity: "Non-Alaska (Costa Rica)",
    officialUrlCandidate: "https://www.silverkinglodge.com/",
    holdStatus: "excluded_non_alaska_domain_collision",
    holdExplanation:
      "Domain resolves to a Costa Rica tarpon resort, not an Alaska lodge.",
    checkedAt: "2026-11-19",
  },
  {
    candidateId: "excluded:kingfisherlodge-com-montana",
    name: "Kingfisher Lodge (kingfisherlodge.com — Excluded Non-Alaska Domain)",
    gatewayOrCommunity: "Non-Alaska (Montana)",
    officialUrlCandidate: "https://www.kingfisherlodge.com/",
    holdStatus: "excluded_non_alaska_domain_collision",
    holdExplanation:
      "Bighorn River, Montana lodge domain; Craig, AK business is alaskakingfisherlodge.com.",
    checkedAt: "2026-11-19",
  },
];
