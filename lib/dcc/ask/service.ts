import { PUBLISHED_DECISION_GUIDES } from "@/src/data/published-decision-guides";
import type { PreSiteGuideCitation, PreSiteGuideOptionComparison } from "@/src/data/pre-site-guides";
import sitesRegistry from "@/data/network/sites.v1.json";
import handoffsRegistry from "@/data/network/handoffs.v1.json";

const DCC_SITE_ID = "dcc:site:destination-command-center";
const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","before","but","by","can","do","does","don","for","from","get","have","how","i","if","in","is","it","me","my","not","of","on","or","our","should","still","the","their","there","to","we","what","when","where","which","who","with","would","you","your",
]);

const NUMBER_WORDS: Record<string, string> = {
  two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12",
};

const SYNONYMS: Record<string, string[]> = {
  den: ["denver", "airport"],
  denver: ["den", "colorado"],
  vail: ["mountain", "resort", "ski"],
  breckenridge: ["mountain", "resort", "ski"],
  juneau: ["alaska", "cruise", "helicopter", "glacier"],
  helicopter: ["flight", "flightseeing", "glacier", "juneau"],
  whale: ["whales", "watching", "juneau", "alaska"],
  swamp: ["bayou", "wetlands", "new", "orleans"],
  whales: ["whale", "watching"],
  kids: ["child", "children", "family"],
  child: ["children", "kids", "family"],
  children: ["child", "kids", "family"],
  family: ["child", "kids", "children"],
  car: ["pickup", "shuttle", "self-drive", "transportation", "hotel"],
  7: ["group", "size", "large", "van"],
  6: ["group", "size"],
  8: ["group", "size", "large", "van"],
  gear: ["ski", "bags", "luggage", "snowboard"],
  ski: ["gear", "bags", "luggage", "winter"],
  airboat: ["swamp", "boat", "new", "orleans"],
  bourbon: ["french", "quarter", "new", "orleans"],
  royal: ["french", "quarter", "new", "orleans"],
  thomas: ["st", "usvi", "cruise", "driver"],
  croix: ["st", "usvi", "cruise", "driver"],
  john: ["st", "usvi", "cruise", "driver"],
  driver: ["private", "local", "vibe", "cruise"],
  red: ["rocks", "concert", "transportation"],
  argo: ["idaho", "springs", "shuttle", "denver"],
  dells: ["wisconsin", "family", "group"],
};

export type AskDccSource = {
  slug: string;
  title: string;
  href: string;
  answer: string;
  category: string;
  verifiedAt?: string;
};
export type AskDccHandoff = { siteId: string; siteName: string; href: string; reason: string; terminal: boolean };
export type AskDccEvidence = {
  sources: AskDccSource[];
  handoff: AskDccHandoff | null;
  confidence: "high" | "medium" | "low";
  verifiedAt: string | null;
  assumptionsAndUnknowns: string[];
  citations: PreSiteGuideCitation[];
  optionComparison: PreSiteGuideOptionComparison[];
};
export type AskDccMessage = { role: "user" | "assistant"; content: string };

// Scope retrieval to destinations named by the traveler. General words such as
// "pickup" and "kids" are not evidence that the traveler is in New Orleans.
const DESTINATION_SCOPES = [
  { pattern: /\b(?:new orleans|nola|french quarter)\b/, categories: ["new-orleans"] },
  { pattern: /\b(?:juneau|mendenhall|gastineau)\b/, categories: ["alaska"] },
  { pattern: /\b(?:alaska|skagway|ketchikan|sitka)\b/, categories: ["alaska", "cruise"] },
  { pattern: /\b(?:den|denver|vail|breckenridge|beaver creek|aspen|snowmass|keystone|winter park|steamboat|colorado|argo|idaho springs)\b/, categories: ["colorado", "transportation"] },
  { pattern: /\bred rocks\b/, categories: ["red-rocks", "colorado", "transportation"] },
  { pattern: /\b(?:wisconsin|dells)\b/, categories: ["wisconsin"] },
  { pattern: /\b(?:st thomas|saint thomas|st croix|saint croix|st john|saint john|usvi|virgin islands)\b/, categories: ["cruise"] },
] as const;

function retrievalContext(question: string, history: readonly AskDccMessage[]) {
  const questions = history.slice(-8).filter((message) => message.role === "user")
    .map((message) => message.content.trim()).filter(Boolean);
  if (questions.at(-1) !== question.trim()) questions.push(question.trim());

  // A newly named destination replaces the earlier topic. Follow-ups without a
  // destination inherit the last traveler-supplied scope; assistant text never
  // gets to introduce a destination into the retrieval context.
  for (let index = questions.length - 1; index >= 0; index -= 1) {
    const text = normalize(questions[index]).split(/\binstead of\b/)[0];
    const scopes = DESTINATION_SCOPES.filter((scope) => scope.pattern.test(text));
    if (scopes.length) {
      return {
        query: questions.slice(index).join(" "),
        categories: new Set<string>(scopes.flatMap((scope) => [...scope.categories])),
      };
    }
    if (/\b(?:switch(?:ing)? to|different (?:city|destination|country))\b|^now (?:what|how)\b/.test(text)) {
      return null;
    }
  }
  return null;
}

function normalize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(input: string, expandSynonyms = true) {
  const variants: Record<string, string> = {
    whales: "whale",
    helicopters: "helicopter",
    airboats: "airboat",
    children: "child",
    kids: "child",
    people: "group",
    travelers: "group",
    passengers: "group",
    bags: "gear",
    bag: "gear",
    skis: "ski",
    ...NUMBER_WORDS,
  };
  const base = normalize(input)
    .split(" ")
    .filter((token) => (token.length > 1 || /^[2-9]$/.test(token)) && !STOP_WORDS.has(token))
    .map((token) => variants[token] ?? token);
  const expanded = new Set(base);
  if (expandSynonyms) for (const token of base) for (const extra of SYNONYMS[token] ?? []) expanded.add(extra);
  return expanded;
}

const DOCUMENT_FREQUENCY = new Map<string, number>();
for (const guide of PUBLISHED_DECISION_GUIDES) {
  const words = tokens([guide.title, guide.description, guide.answer, ...guide.questions, ...guide.matters].join(" "), false);
  for (const word of words) DOCUMENT_FREQUENCY.set(word, (DOCUMENT_FREQUENCY.get(word) ?? 0) + 1);
}

function scoreGuide(
  queryTokens: Set<string>,
  guide: (typeof PUBLISHED_DECISION_GUIDES)[number],
  exactQueryTokens: Set<string>,
  combinationQuestion: boolean,
  normalizedQuery: string,
) {
  // Expand the traveler's vocabulary, but score actual source words. Expanding
  // both sides made unrelated Denver activities look like Vail transfer advice.
  const titleTokens = tokens(guide.title, false);
  const descriptionTokens = tokens(guide.description, false);
  const answerTokens = tokens(guide.answer, false);
  const questionTokens = tokens(guide.questions.join(" "), false);
  const mattersTokens = tokens(guide.matters.join(" "), false);
  let score = 0;
  for (const token of queryTokens) {
    // A specific destination or constraint should outweigh a city name that
    // appears throughout the catalog, without preferring a commercial partner.
    const rarity = 1 + Math.log((PUBLISHED_DECISION_GUIDES.length + 1) / ((DOCUMENT_FREQUENCY.get(token) ?? 0) + 1));
    const weight = rarity * (exactQueryTokens.has(token) ? 2 : 1);
    if (titleTokens.has(token)) score += 7 * weight;
    if (descriptionTokens.has(token)) score += 4 * weight;
    if (mattersTokens.has(token)) score += 3 * weight;
    if (questionTokens.has(token)) score += 3 * weight;
    if (answerTokens.has(token)) score += weight;
  }
  if (combinationQuestion) {
    const title = normalize(guide.title);
    if (/\b(?:and|both|combine|combination)\b/.test(title) && !/\b(?:or|vs|versus)\b/.test(title)) score *= 1.5;
    else if (/\b(?:or|vs|versus)\b/.test(title)) score *= 0.75;
  }

  // Prevent unrelated Colorado sub-destinations (e.g., Mighty Argo / Breckenridge / Red Rocks / cannabis stops)
  // from padding a specific DEN-to-Vail transfer question.
  if (/\bvail\b/.test(normalizedQuery)) {
    if (/\b(?:argo|idaho springs|breckenridge|dispensary|cannabis|red rocks)\b/.test(guide.slug)) {
      score *= 0.15;
    }
    if (guide.slug === "denver-airport-to-vail-rental-car-vs-private-transfer") {
      score *= 1.35;
    }
    if (/\b(?:ski|snowboard|bags|bag|gear)\b/.test(normalizedQuery) && guide.slug === "how-ski-gear-changes-colorado-airport-transfer-choice") {
      score *= 1.12;
    }
    if (
      /\b(?:group|people|passengers|travelers|seven|six|eight|7|6|8)\b/.test(normalizedQuery) &&
      guide.slug === "how-does-group-size-change-airport-transportation"
    ) {
      score *= 1.75;
    }
  }

  // When a New Orleans swamp question asks about family/kids AND no-car/pickup, prioritize the family+pickup+boat-type guides.
  const asksFamilySwamp = /\b(?:family|kids|child|children)\b/.test(normalizedQuery) && /\bswamp\b/.test(normalizedQuery);
  const asksNoCarOrPickup = /\b(?:without a car|do not have a car|don t have a car|no car|pickup|shuttle)\b/.test(normalizedQuery);
  if (asksFamilySwamp && guide.slug === "new-orleans-swamp-tour-with-kids") {
    score *= 1.15;
  }
  if (asksNoCarOrPickup && guide.slug === "new-orleans-swamp-tour-pickup-vs-self-drive") {
    score *= 1.3;
  }
  if (asksFamilySwamp && guide.slug === "new-orleans-airboat-vs-covered-swamp-boat") {
    score *= 1.5;
  }

  return score;
}

function siteForHref(href: string) { return sitesRegistry.sites.find((site) => href.includes(site.domain)); }
function handoffForSite(siteId: string) { return handoffsRegistry.handoffs.find((handoff) => handoff.from === DCC_SITE_ID && handoff.to === siteId); }

function extractPartySize(normalizedQuery: string): number | null {
  for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
    const re = new RegExp(`\\b${word}\\s+(?:people|person|travelers|passengers|adults|guests)\\b`);
    if (re.test(normalizedQuery)) return Number(digit);
  }
  const numMatch = normalizedQuery.match(/\b(\d{1,2})\s+(?:people|person|travelers|passengers|adults|guests)\b/);
  return numMatch ? Number(numMatch[1]) : null;
}

function contextualizeHandoffHref(baseHref: string, normalizedQuery: string): string {
  try {
    const url = new URL(baseHref);
    const partySize = extractPartySize(normalizedQuery);
    if (url.hostname.includes("gosno.co")) {
      if (/\bvail\b/.test(normalizedQuery) && (url.pathname === "/" || url.pathname === "")) {
        url.pathname = "/vail";
      }
      if (/\b(?:den|denver)\b/.test(normalizedQuery) && !url.searchParams.has("origin")) {
        url.searchParams.set("origin", "DEN");
      }
      if (/\bvail\b/.test(normalizedQuery) && !url.searchParams.has("destination")) {
        url.searchParams.set("destination", "Vail");
      }
      // gosno.co/vail client bundle parses `passengers` / `passengerCount` / `travelers` (1..10)
      // and `vehicle` / `vehicleClass` (`suv` | `van`); it does not parse `partySize` or `skiGear`.
      url.searchParams.delete("partySize");
      url.searchParams.delete("skiGear");
      url.searchParams.delete("source");
      url.searchParams.delete("sourcePage");
      if (partySize !== null) {
        url.searchParams.set("passengers", String(partySize));
        url.searchParams.set("passengerCount", String(partySize));
        if (partySize >= 7) {
          url.searchParams.set("vehicleClass", "van");
        }
      }
    } else if (url.hostname.includes("welcometotheswamp.com")) {
      if (url.pathname === "/" || url.pathname === "") {
        url.pathname = "/plan";
      }
      // welcometotheswamp.com/plan `parseWarmTransfer` parses `intent`, `topic`, `subtype`,
      // `context` (`first-time|kids|no-car|short-trip|mixed-group`), `source` (`dcc|wts`),
      // and approved `sourcePage` paths; `/plan` also parses `date` and `party_size`.
      url.searchParams.delete("pickup");
      if (!url.searchParams.has("intent")) url.searchParams.set("intent", "compare");
      if (!url.searchParams.has("topic")) url.searchParams.set("topic", "swamp-tours");
      const asksFamily = /\b(?:family|kids|child|children)\b/.test(normalizedQuery);
      const asksNoCar = /\b(?:without a car|do not have a car|don t have a car|no car|pickup|shuttle)\b/.test(normalizedQuery);
      if (asksFamily) {
        url.searchParams.set("subtype", "families");
        url.searchParams.set("context", asksNoCar ? "no-car" : "kids");
      } else if (asksNoCar) {
        url.searchParams.set("subtype", "pickup");
        url.searchParams.set("context", "no-car");
      }
      if (partySize !== null) {
        url.searchParams.set("party_size", String(partySize));
      }
      if (!url.searchParams.has("source")) url.searchParams.set("source", "dcc");
    } else if (url.hostname.includes("juneauflightdeck.com")) {
      if (url.pathname === "/" || url.pathname === "") {
        url.pathname = "/helicopter";
      }
      // juneauflightdeck.com/helicopter only parses `date`/`arrivalDate` and
      // `party_size`/`travelers`/`passengerCount`/`passengers`/`qty`.
      url.searchParams.delete("port");
      url.searchParams.delete("corridor");
      url.searchParams.delete("goal");
      url.searchParams.delete("source");
      url.searchParams.delete("sourcePage");
      if (partySize !== null) {
        url.searchParams.set("party_size", String(partySize));
      }
    }
    return url.toString();
  } catch {
    return baseHref;
  }
}

export function getAskDccEvidence(question: string, history: readonly AskDccMessage[] = []): AskDccEvidence {
  const context = retrievalContext(question, history);
  if (!context) {
    return {
      sources: [],
      handoff: null,
      confidence: "low",
      verifiedAt: null,
      assumptionsAndUnknowns: [],
      citations: [],
      optionComparison: [],
    };
  }
  const queryTokens = tokens(question);
  const exactQueryTokens = tokens(question, false);
  const contextTokens = tokens(context.query);
  const exactContextTokens = tokens(context.query, false);
  const normalizedQuery = normalize(context.query);
  const combinationQuestion = /\bcan (?:we|i|you) (?:do|fit|combine)\b/.test(normalizedQuery)
    && /\b(?:and|both)\b/.test(normalizedQuery) && !/\bor\b/.test(normalizedQuery);
  const candidates = PUBLISHED_DECISION_GUIDES
    .filter((guide) => context.categories.has(guide.category))
    .map((guide) => ({
      guide,
      score: 0.8 * scoreGuide(queryTokens, guide, exactQueryTokens, combinationQuestion, normalizedQuery)
        + 0.2 * scoreGuide(contextTokens, guide, exactContextTokens, combinationQuestion, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  // Do not pad the research panel with weak matches just to fill four slots.
  const bestScore = candidates[0]?.score ?? 0;
  const ranked = candidates.filter((entry) => entry.score >= bestScore * 0.65).slice(0, 4);

  const sources: AskDccSource[] = ranked.map(({ guide }) => ({
    slug: guide.slug,
    title: guide.title,
    href: `/guides/${guide.slug}`,
    answer: guide.answer,
    category: guide.category,
    verifiedAt: guide.verifiedAt,
  }));
  const leadingGuide = ranked[0]?.guide;
  const targetSite = leadingGuide ? siteForHref(leadingGuide.nextStep.href) : null;
  const governedHandoff = targetSite ? handoffForSite(targetSite.site_id) : null;
  const handoff = targetSite && governedHandoff
    ? {
        siteId: targetSite.site_id,
        siteName: targetSite.name,
        href: contextualizeHandoffHref(leadingGuide!.nextStep.href, normalizedQuery),
        reason: leadingGuide!.nextStep.body,
        terminal: governedHandoff.terminal,
      }
    : null;
  const topScore = ranked[0]?.score ?? 0;
  const confidence: AskDccEvidence["confidence"] = topScore >= 18 ? "high" : topScore >= 8 ? "medium" : "low";

  const seenCitationIds = new Set<string>();
  const citations: PreSiteGuideCitation[] = [];
  const assumptionsAndUnknowns: string[] = [];
  const seenAssumptions = new Set<string>();
  for (const { guide } of ranked) {
    for (const cite of guide.citations ?? []) {
      if (!seenCitationIds.has(cite.id)) {
        seenCitationIds.add(cite.id);
        citations.push(cite);
      }
    }
    for (const item of guide.assumptionsAndUnknowns ?? []) {
      if (!seenAssumptions.has(item)) {
        seenAssumptions.add(item);
        assumptionsAndUnknowns.push(item);
      }
    }
  }

  return {
    sources,
    handoff,
    confidence,
    verifiedAt: leadingGuide?.verifiedAt ?? null,
    assumptionsAndUnknowns,
    citations,
    optionComparison: leadingGuide?.optionComparison ?? [],
  };
}

export function fallbackAskDccAnswer(_question: string, evidence: AskDccEvidence) {
  if (!evidence.sources.length) return "I don’t have a strong enough DCC match for that question yet. Try adding the destination, timing, group size, or the choice you are weighing so I can route you to a real decision instead of guessing.";
  const lead = evidence.sources[0];
  const citationText = evidence.citations.length
    ? ` Sources checked: ${evidence.citations.map((c) => `${c.organization} (verified ${c.checkedAt})`).join("; ")}.`
    : "";
  const supporting = evidence.sources.slice(1, 3).map((source) => source.title);
  const supportText = supporting.length ? ` Related decisions: ${supporting.join("; ")}.` : "";
  const next = evidence.handoff ? ` When you are ready, compare the options on ${evidence.handoff.siteName}.` : "";
  return `${lead.answer}${citationText}${supportText}${next}`;
}

export function buildAskDccPrompt(input: { question: string; history: Array<{ role: "user" | "assistant"; content: string }>; evidence: AskDccEvidence }) {
  const evidenceText = input.evidence.sources.map((source, index) => `[${index + 1}] ${source.title}${source.verifiedAt ? ` (verified ${source.verifiedAt})` : ""}\nURL: ${source.href}\nDCC answer: ${source.answer}`).join("\n\n");
  const citationsText = input.evidence.citations.length
    ? input.evidence.citations.map((c) => `- ${c.organization} (${c.label}, checked ${c.checkedAt}): ${c.claimSupported} [${c.url}]`).join("\n")
    : "No external citations attached.";
  const unknownsText = input.evidence.assumptionsAndUnknowns.length
    ? input.evidence.assumptionsAndUnknowns.map((u) => `- ${u}`).join("\n")
    : "Identify any missing traveler constraints explicitly.";
  const handoffText = input.evidence.handoff ? `Allowed next commercial handoff: ${input.evidence.handoff.siteName} (${input.evidence.handoff.href}). Reason: ${input.evidence.handoff.reason}.` : "No governed commercial handoff is currently justified.";
  const historyText = input.history.slice(-6).map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n");
  return [
    "You are Ask DCC, the conversational interface to Destination Command Center's governed travel decision graph.",
    "Answer the traveler's actual decision directly and compactly. Use ONLY the supplied DCC evidence and verified citations for factual recommendations and network routing.",
    "Cite the source organization and checked date for factual claims where provided. Treat unknown or unverified inputs (such as ship arrival/all-aboard times, dock/tender status, child ages, bag counts, or live seat/van quotes) as explicitly unknown rather than guessing.",
    "Never imply that a weather forecast guarantees an operator will run, that a tour or quote-only van is available without checking, or that a 90-minute ship-return planning buffer is a guarantee.",
    "Compare relevant options fairly, including direct operators, marketplaces, public/free alternatives, and deciding not to purchase when applicable.",
    "Do not push a commercial handoff prematurely. If the supplied governed handoff is appropriate after answering, end with one short sentence explaining the next step.",
    "Never name a commercial site other than the supplied allowed handoff.",
    "Use natural prose, not a sales pitch. Maximum 260 words.",
    `Conversation:\n${historyText}`,
    `Current question: ${input.question}`,
    `DCC evidence:\n${evidenceText || "No strong DCC evidence match."}`,
    `Verified citations:\n${citationsText}`,
    `Explicit unknowns & assumptions:\n${unknownsText}`,
    handoffText,
  ].join("\n\n");
}
