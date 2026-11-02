import test from "node:test";
import assert from "node:assert/strict";
import { fallbackAskDccAnswer, getAskDccEvidence } from "@/lib/dcc/ask/service";

test("Ask DCC finds published Juneau research before routing", () => {
  const result = getAskDccEvidence("Can we do whales and a helicopter in Juneau?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /juneau|whale|helicopter|flight/i.test(source.title)));
  assert.match(result.sources[0].title, /whale watching and a helicopter/i);
  if (result.handoff) assert.ok(result.handoff.href.startsWith("https://"));
});

test("Ask DCC finds Colorado transportation research for DEN to Vail", () => {
  const result = getAskDccEvidence("How should 7 people get from DEN to Vail with ski gear?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /vail|airport|transport|ski|gear/i.test(source.title)));
});

test("a DEN-to-Vail transfer question does not pad its research with unrelated Denver activities", () => {
  for (const question of [
    "How should 7 people get from DEN to Vail?",
    "How should 7 people get from DEN to Vail with ski gear?",
    "How should seven people get from Denver airport to Vail with ski bags?",
  ]) {
    const result = getAskDccEvidence(question);
    assert.ok(result.sources.length > 0);
    assert.ok(!result.sources.some((source) => /argo|idaho springs|breckenridge|red rocks|cannabis/i.test(source.title)));
  }
});

test("Ask DCC finds swamp research for a family question", () => {
  const result = getAskDccEvidence("Airboat or covered swamp boat with kids in New Orleans?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /swamp|airboat|covered|kids/i.test(source.title)));
});

test("Ask DCC never fabricates a handoff for unmatched nonsense", () => {
  const result = getAskDccEvidence("quasar nebula compiler zxqv banana");
  assert.equal(result.sources.length, 0);
  assert.equal(result.handoff, null);
  assert.equal(result.confidence, "low");
});

test("a hotel-pickup follow-up retains New Orleans swamp context without unrelated airport research", () => {
  const result = getAskDccEvidence("One child is 4. We need hotel pickup.", [
    { role: "user", content: "Airboat or covered swamp boat with kids in New Orleans?" },
    { role: "assistant", content: "Compare ride style and transportation." },
    { role: "user", content: "One child is 4. We need hotel pickup." },
  ]);
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.every((source) => source.category === "new-orleans"));
  assert.match(result.sources[0].title, /pickup|kids/i);
  assert.ok(!result.sources.some((source) => /cannabis|airport/i.test(source.title)));
  assert.equal(new URL(result.handoff!.href).hostname, "welcometotheswamp.com");
});

test("an explicit new destination replaces the previous conversation's destination", () => {
  const result = getAskDccEvidence("Now how should 7 people get from DEN to Vail with ski gear?", [
    { role: "user", content: "Airboat or covered swamp boat with kids in New Orleans?" },
    { role: "assistant", content: "Start with a covered swamp boat." },
  ]);
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.every((source) => ["colorado", "transportation"].includes(source.category)));
  assert.ok(!result.sources.some((source) => /swamp|new orleans/i.test(source.title)));
});

test("assistant text cannot supply a destination that the traveler never chose", () => {
  const result = getAskDccEvidence("What about the return buffer?", [
    { role: "user", content: "Can we do whales and a helicopter in Juneau?" },
    { role: "assistant", content: "New Orleans, DEN, Vail and cannabis-friendly airport pickup." },
  ]);
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.every((source) => source.category === "alaska"));
});

test("an ambiguous pickup question does not imply a destination or commercial handoff", () => {
  const result = getAskDccEvidence("We need hotel pickup with kids.");
  assert.equal(result.handoff, null);
  assert.equal(result.sources.length, 0);
  assert.equal(result.confidence, "low");
});

test("an unsupported destination does not turn generic family words into a booking recommendation", () => {
  const result = getAskDccEvidence("What should we do in Reykjavik with kids and hotel pickup?");
  assert.equal(result.handoff, null);
  assert.equal(result.sources.length, 0);
  assert.equal(result.confidence, "low");
});

test("an explicit switch to an unsupported destination does not inherit the earlier booking destination", () => {
  for (const question of ["Now what should we do in Reykjavik with kids?", "Switch to Paris instead of New Orleans."]) {
    const result = getAskDccEvidence(question, [
      { role: "user", content: "Airboat or covered swamp boat with kids in New Orleans?" },
    ]);
    assert.equal(result.handoff, null);
    assert.equal(result.sources.length, 0);
  }
});

test("Journey A: New Orleans swamp tour for a family with kids and no car provides sourced age/pickup rules, explicit unknowns, fair alternatives, and deep link", () => {
  const question = "Which New Orleans swamp tour fits a family with kids who do not have a car?";
  const evidence = getAskDccEvidence(question);
  const answer = fallbackAskDccAnswer(question, evidence);

  assert.equal(evidence.sources[0].href, "/guides/new-orleans-swamp-tour-with-kids");
  assert.ok(evidence.sources.some((s) => s.href === "/guides/new-orleans-swamp-tour-pickup-vs-self-drive"));
  assert.ok(evidence.sources.some((s) => s.href === "/guides/new-orleans-airboat-vs-covered-swamp-boat"));

  // Citations & checked dates verified on 2026-11-02
  assert.equal(evidence.verifiedAt, "2026-11-02");
  assert.ok(evidence.citations.length >= 5);
  assert.ok(evidence.citations.every((c) => c.checkedAt === "2026-11-02"));
  assert.ok(evidence.citations.some((c) => /cajunencounters\.com/i.test(c.url)));
  assert.ok(evidence.citations.some((c) => /airboatadventures\.com\/pickup-locations/i.test(c.url)));
  assert.ok(evidence.citations.some((c) => /airboatadventures\.com\/faqs/i.test(c.url)));
  assert.ok(evidence.citations.some((c) => /nps\.gov\/jela/i.test(c.url)));

  // Explicit unknowns & fair option comparison
  assert.ok(evidence.assumptionsAndUnknowns.length >= 3);
  assert.ok(evidence.optionComparison.length >= 4);
  assert.ok(evidence.optionComparison.some((o) => o.optionType === "public_or_free"));
  assert.ok(evidence.optionComparison.some((o) => o.optionType === "no_purchase"));

  // Primary-source answer content requirements
  assert.match(answer, /covered flat-bottom pontoon/i);
  assert.match(answer, /minimum age of 5|under 5/i);
  assert.match(answer, /\$30\/person/);
  assert.match(answer, /400 Toulouse St\./);
  assert.match(answer, /February 2, 2026/);
  assert.match(answer, /Twin Canals/);
  assert.match(answer, /Louisiana Wetlands Education Center/);
  assert.match(answer, /\$10 adults/);
  assert.match(answer, /verified 2026-11-02/i);

  // Specific context-preserving handoff URL using only parameters parsed by welcometotheswamp.com/plan
  assert.ok(evidence.handoff);
  const handoffUrl = new URL(evidence.handoff.href);
  assert.equal(handoffUrl.hostname, "welcometotheswamp.com");
  assert.equal(handoffUrl.pathname, "/plan");
  assert.equal(handoffUrl.searchParams.get("intent"), "compare");
  assert.equal(handoffUrl.searchParams.get("topic"), "swamp-tours");
  assert.equal(handoffUrl.searchParams.get("subtype"), "families");
  assert.equal(handoffUrl.searchParams.get("context"), "no-car");
  assert.equal(handoffUrl.searchParams.get("source"), "dcc");
  assert.equal(handoffUrl.searchParams.get("sourcePage"), "/new-orleans/swamp-tours/with-kids");
  assert.equal(handoffUrl.searchParams.has("pickup"), false);
});

test("Journey B: Juneau whale watching + helicopter combo refuses unqualified yes, states schedule assumptions/unknowns, labels 90-min buffer as planning margin, and deep links to /helicopter", () => {
  const question = "Can we do whale watching and a helicopter tour in Juneau and still get back to our ship?";
  const evidence = getAskDccEvidence(question);
  const answer = fallbackAskDccAnswer(question, evidence);

  assert.equal(evidence.sources[0].href, "/guides/can-you-do-whale-watching-and-helicopter-tour-in-juneau");
  assert.ok(evidence.citations.length >= 4);
  assert.ok(evidence.citations.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.checkedAt)));

  // Refuses unqualified yes when schedule is unknown
  assert.match(answer, /Do not assume 'yes'|cannot answer 'yes'/i);
  // Explicit schedule & berth/tender & buffer math
  assert.match(answer, /all-aboard/i);
  assert.match(answer, /berth|tender/i);
  assert.match(answer, /210–240 min/i);
  assert.match(answer, /180–255 min/i);
  assert.match(answer, /90-minute return margin is a planning buffer—not a guarantee/i);
  assert.match(answer, /verified 2026-10-23/i);

  // Fair comparison including public/free & no-purchase
  assert.ok(evidence.optionComparison.length >= 4);
  assert.ok(evidence.optionComparison.some((o) => o.optionType === "public_or_free"));
  assert.ok(evidence.optionComparison.some((o) => o.optionType === "no_purchase"));

  // Specific handoff URL to /helicopter without unconsumed query params
  assert.ok(evidence.handoff);
  const handoffUrl = new URL(evidence.handoff.href);
  assert.equal(handoffUrl.hostname, "juneauflightdeck.com");
  assert.equal(handoffUrl.pathname, "/helicopter");
  assert.equal(handoffUrl.searchParams.has("corridor"), false);
  assert.equal(handoffUrl.searchParams.has("goal"), false);
});

test("Journey C: 7 people from Denver airport to Vail with ski bags separates passenger vs. luggage capacity, sources vehicle caps/pricing, compares options fairly, and deep links to GoSno Vail page with recipient-parsed parameters", () => {
  const question = "How should seven people get from Denver airport to Vail with ski bags?";
  const evidence = getAskDccEvidence(question);
  const answer = fallbackAskDccAnswer(question, evidence);

  assert.equal(evidence.sources[0].href, "/guides/denver-airport-to-vail-rental-car-vs-private-transfer");
  assert.ok(evidence.sources.some((s) => s.href === "/guides/how-ski-gear-changes-colorado-airport-transfer-choice"));
  assert.ok(evidence.sources.some((s) => s.href === "/guides/how-does-group-size-change-airport-transportation"));
  assert.ok(!evidence.sources.some((s) => /argo|idaho springs|breckenridge/i.test(s.title)));

  // Citations & checked dates
  assert.ok(evidence.citations.length >= 4);
  assert.ok(evidence.citations.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.checkedAt)));
  assert.ok(evidence.citations.some((c) => /gosno\.co\/vail/i.test(c.url)));
  assert.ok(evidence.citations.some((c) => c.url === "https://www.epicmountainexpress.com/shuttle-rates" && c.checkedAt === "2026-11-02"));
  assert.ok(evidence.citations.some((c) => /codot\.gov/i.test(c.url)));

  // Capacity separation & honest pricing/unknowns
  assert.match(answer, /cannot fit in a single standard private SUV/i);
  assert.match(answer, /\$499/);
  assert.match(answer, /quoteOnly: true/);
  assert.match(answer, /C\.R\.S\. § 42-4-106/);
  assert.match(answer, /Bustang/i);
  assert.match(answer, /vary by travel date/i);
  assert.match(answer, /verified 2026-11-02/i);

  // Specific context-preserving handoff URL to GoSno /vail using parameters parsed by gosno.co/vail client bundle
  assert.ok(evidence.handoff);
  const handoffUrl = new URL(evidence.handoff.href);
  assert.equal(handoffUrl.hostname, "gosno.co");
  assert.equal(handoffUrl.pathname, "/vail");
  assert.equal(handoffUrl.searchParams.get("origin"), "DEN");
  assert.equal(handoffUrl.searchParams.get("destination"), "Vail");
  assert.equal(handoffUrl.searchParams.get("passengers"), "7");
  assert.equal(handoffUrl.searchParams.get("passengerCount"), "7");
  assert.equal(handoffUrl.searchParams.get("vehicleClass"), "van");
  assert.equal(handoffUrl.searchParams.has("partySize"), false);
  assert.equal(handoffUrl.searchParams.has("skiGear"), false);
});
