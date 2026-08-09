import test from "node:test";
import assert from "node:assert/strict";
import { PRE_SITE_GUIDES } from "../../src/data/pre-site-guides";
import { DECISION_CATEGORIES, getDecisionCategory, relatedDecisionGuides } from "../../src/data/decision-taxonomy";
import { DECISION_OPPORTUNITY_QUEUE } from "../../src/data/decision-opportunity-queue";
import { NETWORK_GRAPH, SUITE_SITES } from "../../src/data/network-graph";

test("every published guide belongs to a known decision category", () => {
  for (const guide of PRE_SITE_GUIDES) {
    assert.ok(getDecisionCategory(guide.category), `unknown category for ${guide.slug}`);
  }
});

test("every published guide has one specialist handoff into the governed suite", () => {
  const suiteOrigins = SUITE_SITES.map((site) => site.url);
  for (const guide of PRE_SITE_GUIDES) {
    assert.ok(
      suiteOrigins.some((origin) => guide.nextStep.href.startsWith(origin)),
      `handoff for ${guide.slug} is outside the suite: ${guide.nextStep.href}`,
    );
  }
});

test("category hubs cover all published guides and have graph edges", () => {
  assert.equal(NETWORK_GRAPH.hierarchyEdges.length, PRE_SITE_GUIDES.length);
  for (const category of DECISION_CATEGORIES) {
    assert.ok(
      PRE_SITE_GUIDES.some((guide) => guide.category === category.slug),
      `category ${category.slug} has no published guide`,
    );
  }
});

test("related graph never points a guide to itself", () => {
  for (const guide of PRE_SITE_GUIDES) {
    const related = relatedDecisionGuides(guide.slug, 10);
    assert.ok(related.every((candidate) => candidate.slug !== guide.slug));
  }
});

test("opportunity queue is governed and never masquerades as published content", () => {
  const publishedSlugs = new Set(PRE_SITE_GUIDES.map((guide) => guide.slug));
  const ids = new Set<string>();
  assert.ok(DECISION_OPPORTUNITY_QUEUE.length >= 40, "expected a meaningful governed expansion queue");
  for (const opportunity of DECISION_OPPORTUNITY_QUEUE) {
    assert.equal(opportunity.status, "research_required");
    assert.ok(!publishedSlugs.has(opportunity.id), `queued item ${opportunity.id} collides with a published guide`);
    assert.ok(!ids.has(opportunity.id), `duplicate opportunity id ${opportunity.id}`);
    ids.add(opportunity.id);
  }
});
