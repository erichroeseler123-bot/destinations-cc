import { PUBLISHED_DECISION_GUIDES } from "@/src/data/published-decision-guides";
import sitesRegistry from "@/data/network/sites.v1.json";
import handoffsRegistry from "@/data/network/handoffs.v1.json";

const DCC_SITE_ID = "dcc:site:destination-command-center";
const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","before","but","by","can","do","for","from","how","i","if","in","is","it","me","my","of","on","or","our","should","the","their","there","to","we","what","when","where","which","with","would","you","your",
]);

const SYNONYMS: Record<string, string[]> = {
  denver: ["den", "colorado"], vail: ["mountain", "resort", "ski"], breckenridge: ["mountain", "resort", "ski"],
  juneau: ["alaska", "cruise", "helicopter", "glacier"], helicopter: ["flight", "flightseeing", "glacier", "juneau"],
  whale: ["whales", "watching", "juneau", "alaska"], swamp: ["airboat", "covered", "boat", "new", "orleans"],
  airboat: ["swamp", "boat", "new", "orleans"], bourbon: ["french", "quarter", "new", "orleans"], royal: ["french", "quarter", "new", "orleans"],
  thomas: ["st", "usvi", "cruise", "driver"], croix: ["st", "usvi", "cruise", "driver"], john: ["st", "usvi", "cruise", "driver"],
  driver: ["private", "local", "vibe", "cruise"], red: ["rocks", "concert", "transportation"], argo: ["idaho", "springs", "shuttle", "denver"],
  dells: ["wisconsin", "family", "group"],
};

export type AskDccSource = { slug: string; title: string; href: string; answer: string; category: string };
export type AskDccHandoff = { siteId: string; siteName: string; href: string; reason: string; terminal: boolean };
export type AskDccEvidence = { sources: AskDccSource[]; handoff: AskDccHandoff | null; confidence: "high" | "medium" | "low" };

function normalize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(input: string) {
  const base = normalize(input).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  const expanded = new Set(base);
  for (const token of base) for (const extra of SYNONYMS[token] ?? []) expanded.add(extra);
  return expanded;
}

function scoreGuide(queryTokens: Set<string>, guide: (typeof PUBLISHED_DECISION_GUIDES)[number]) {
  const titleTokens = tokens(guide.title);
  const descriptionTokens = tokens(guide.description);
  const answerTokens = tokens(guide.answer);
  const questionTokens = tokens(guide.questions.join(" "));
  const mattersTokens = tokens(guide.matters.join(" "));
  let score = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 7;
    if (descriptionTokens.has(token)) score += 4;
    if (mattersTokens.has(token)) score += 3;
    if (questionTokens.has(token)) score += 3;
    if (answerTokens.has(token)) score += 1;
  }
  return score;
}

function siteForHref(href: string) { return sitesRegistry.sites.find((site) => href.includes(site.domain)); }
function handoffForSite(siteId: string) { return handoffsRegistry.handoffs.find((handoff) => handoff.from === DCC_SITE_ID && handoff.to === siteId); }

export function getAskDccEvidence(question: string): AskDccEvidence {
  const queryTokens = tokens(question);
  const ranked = PUBLISHED_DECISION_GUIDES
    .map((guide) => ({ guide, score: scoreGuide(queryTokens, guide) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const sources: AskDccSource[] = ranked.map(({ guide }) => ({ slug: guide.slug, title: guide.title, href: `/guides/${guide.slug}`, answer: guide.answer, category: guide.category }));
  const leadingGuide = ranked[0]?.guide;
  const targetSite = leadingGuide ? siteForHref(leadingGuide.nextStep.href) : null;
  const governedHandoff = targetSite ? handoffForSite(targetSite.site_id) : null;
  const handoff = targetSite && governedHandoff ? { siteId: targetSite.site_id, siteName: targetSite.name, href: leadingGuide!.nextStep.href, reason: governedHandoff.when, terminal: governedHandoff.terminal } : null;
  const topScore = ranked[0]?.score ?? 0;
  const confidence: AskDccEvidence["confidence"] = topScore >= 18 ? "high" : topScore >= 8 ? "medium" : "low";
  return { sources, handoff, confidence };
}

export function fallbackAskDccAnswer(_question: string, evidence: AskDccEvidence) {
  if (!evidence.sources.length) return "I don’t have a strong enough DCC match for that question yet. Try adding the destination, timing, group size, or the choice you are weighing so I can route you to a real decision instead of guessing.";
  const lead = evidence.sources[0];
  const supporting = evidence.sources.slice(1, 3).map((source) => source.title);
  const supportText = supporting.length ? ` Related decisions: ${supporting.join("; ")}.` : "";
  const next = evidence.handoff ? ` When that decision is clear, ${evidence.handoff.siteName} is the governed next step.` : "";
  return `${lead.answer}${supportText}${next}`;
}

export function buildAskDccPrompt(input: { question: string; history: Array<{ role: "user" | "assistant"; content: string }>; evidence: AskDccEvidence }) {
  const evidenceText = input.evidence.sources.map((source, index) => `[${index + 1}] ${source.title}\nURL: ${source.href}\nDCC answer: ${source.answer}`).join("\n\n");
  const handoffText = input.evidence.handoff ? `Allowed next commercial handoff: ${input.evidence.handoff.siteName} (${input.evidence.handoff.href}). Reason: ${input.evidence.handoff.reason}.` : "No governed commercial handoff is currently justified.";
  const historyText = input.history.slice(-6).map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n");
  return [
    "You are Ask DCC, the conversational interface to Destination Command Center's governed travel decision graph.",
    "Answer the traveler's actual decision directly and compactly. Use ONLY the supplied DCC evidence for factual recommendations and network routing.",
    "Do not invent prices, schedules, availability, operators, policies, live conditions, or destinations that are not in the evidence.",
    "If current or missing information is required, say what must be checked rather than guessing.",
    "Do not push a commercial handoff prematurely. If the supplied governed handoff is appropriate after answering, end with one short sentence explaining the next step.",
    "Never name a commercial site other than the supplied allowed handoff.",
    "Use natural prose, not a sales pitch. Maximum 220 words.",
    `Conversation:\n${historyText}`,
    `Current question: ${input.question}`,
    `DCC evidence:\n${evidenceText || "No strong DCC evidence match."}`,
    handoffText,
  ].join("\n\n");
}
