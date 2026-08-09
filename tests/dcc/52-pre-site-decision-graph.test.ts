import test from "node:test";
import assert from "node:assert/strict";
import { PUBLISHED_DECISION_GUIDES } from "../../src/data/published-decision-guides";
import { DECISION_CATEGORIES, getDecisionCategory, relatedDecisionGuides } from "../../src/data/decision-taxonomy";
import { DECISION_OPPORTUNITY_QUEUE } from "../../src/data/decision-opportunity-queue";
import { NETWORK_GRAPH, SUITE_SITES } from "../../src/data/network-graph";

test("every published guide belongs to a known decision category", () => {
  for (const guide of PUBLISHED_DECISION_GUIDES) {
    assert.ok(getDecisionCategory(guide.category), `unknown category for ${guide.slug}`);
  }
});

test("every published guide has one specialist handoff into the governed suite", () => {
  const suiteOrigins = SUITE_SITES.map((site) => site.url);
  for (const guide of PUBLISHED_DECISION_GUIDES) {
    assert.ok(
      suiteOrigins.some((origin) => guide.nextStep.href.startsWith(origin)),
      `handoff for ${guide.slug} is outside the suite: ${guide.nextStep.href}`,
    );
  }
});

test("category hubs cover all published guides and have graph edges", () => {
  assert.equal(NETWORK_GRAPH.hierarchyEdges.length, PUBLISHED_DECISION_GUIDES.length);
  for (const category of DECISION_CATEGORIES) {
    assert.ok(
      PUBLISHED_DECISION_GUIDES.some((guide) => guide.category === category.slug),
      `category ${category.slug} has no published guide`,
    );
  }
});

test("related graph never points a guide to itself", () => {
  for (const guide of PUBLISHED_DECISION_GUIDES) {
    const related = relatedDecisionGuides(guide.slug, 10);
    assert.ok(related.every((candidate) => candidate.slug !== guide.slug));
  }
});

test("published slugs are unique", () => {
  const slugs = new Set<string>();
  for (const guide of PUBLISHED_DECISION_GUIDES) {
    assert.ok(!slugs.has(guide.slug), `duplicate published guide slug ${guide.slug}`);
    slugs.add(guide.slug);
  }
});

test("opportunity queue remains governed rather than becoming automatic public routes", () => {
  const ids = new Set<string>();
  assert.ok(DECISION_OPPORTUNITY_QUEUE.length >= 40, "expected a meaningful governed expansion queue");
  for (const opportunity of DECISION_OPPORTUNITY_QUEUE) {
    assert.equal(opportunity.status, "research_required");
    assert.ok(!ids.has(opportunity.id), `duplicate opportunity id ${opportunity.id}`);
    ids.add(opportunity.id);
  }
});
