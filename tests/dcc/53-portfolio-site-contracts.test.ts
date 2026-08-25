import test from "node:test";
import assert from "node:assert/strict";
import { SUITE_SITES } from "@/src/data/network-graph";
import {
  PORTFOLIO_SITE_CONTRACTS,
  getPortfolioSiteContract,
} from "@/src/data/portfolio-site-contracts";

test("every network-graph site has a portfolio role contract", () => {
  const contractedIds = new Set(PORTFOLIO_SITE_CONTRACTS.map((site) => site.id));

  for (const site of SUITE_SITES) {
    assert.equal(
      contractedIds.has(site.id),
      true,
      `${site.id} must have an explicit portfolio site-role contract`,
    );
  }
});

test("portfolio jobs and canonical URLs are unique", () => {
  const jobKeys = PORTFOLIO_SITE_CONTRACTS.map((site) => site.jobKey);
  assert.equal(new Set(jobKeys).size, jobKeys.length, "jobKey values must be unique");

  const urls = PORTFOLIO_SITE_CONTRACTS.flatMap((site) =>
    site.canonicalUrl ? [site.canonicalUrl] : [],
  );
  assert.equal(new Set(urls).size, urls.length, "canonical URLs must be unique");
});

test("every property declares a real customer job and explicit ownership boundary", () => {
  for (const site of PORTFOLIO_SITE_CONTRACTS) {
    assert.ok(site.job.length >= 60, `${site.id} needs a specific customer job`);
    assert.ok(site.owns.length > 0, `${site.id} needs at least one owned capability`);
    assert.ok(site.mustNotOwn.length > 0, `${site.id} needs at least one explicit boundary`);
    assert.ok(site.handoffRule.length >= 40, `${site.id} needs a meaningful handoff rule`);

    const overlap = site.owns.filter((capability) => site.mustNotOwn.includes(capability));
    assert.deepEqual(overlap, [], `${site.id} cannot both own and forbid the same capability`);
  }
});

test("child properties reference a real parent", () => {
  const ids = new Set(PORTFOLIO_SITE_CONTRACTS.map((site) => site.id));

  for (const site of PORTFOLIO_SITE_CONTRACTS) {
    if (!site.parentId) continue;
    assert.equal(ids.has(site.parentId), true, `${site.id} parent ${site.parentId} must exist`);
    assert.notEqual(site.parentId, site.id, `${site.id} cannot parent itself`);
  }

  assert.equal(getPortfolioSiteContract("bigsky-gosno")?.parentId, "gosno");
});

test("DCC remains intelligence and routing rather than transaction authority", () => {
  const dcc = getPortfolioSiteContract("dcc");
  assert.ok(dcc);
  assert.equal(dcc.owns.includes("location_intelligence"), true);
  assert.equal(dcc.owns.includes("decision_routing"), true);
  assert.equal(dcc.mustNotOwn.includes("customer_checkout"), true);
  assert.equal(dcc.mustNotOwn.includes("operator_inventory"), true);
  assert.equal(dcc.mustNotOwn.includes("customer_payment"), true);
});

test("Cruise Promenade stays a private shared planner rather than a social network", () => {
  const cp = getPortfolioSiteContract("cp");
  assert.ok(cp);
  assert.equal(cp.jobKey, "private_shared_cruise_planning");
  assert.equal(cp.owns.includes("private_group_plans"), true);
  assert.equal(cp.owns.includes("share_links"), true);
  assert.equal(cp.mustNotOwn.includes("public_social_network"), true);
});

test("New Orleans properties own distinct decisions", () => {
  const wno = getPortfolioSiteContract("wtonot");
  const fqo = getPortfolioSiteContract("fqo");
  const swamp = getPortfolioSiteContract("swamp");
  assert.ok(wno && fqo && swamp);

  assert.equal(wno.jobKey, "new_orleans_experience_choice");
  assert.equal(fqo.jobKey, "french_quarter_first_hour_orientation");
  assert.equal(swamp.jobKey, "new_orleans_swamp_choice");
  assert.equal(wno.mustNotOwn.includes("french_quarter_first_hour_orientation"), true);
  assert.equal(fqo.mustNotOwn.includes("general_new_orleans_tour_catalog"), true);
  assert.equal(swamp.mustNotOwn.includes("general_new_orleans_experience_catalog"), true);
});

test("Red Rocks properties cannot silently collapse into the same product", () => {
  const parr = getPortfolioSiteContract("parr");
  const rrdd = getPortfolioSiteContract("rrdd");
  const fastPass = getPortfolioSiteContract("rrfp");
  assert.ok(parr && rrdd && fastPass);

  assert.equal(parr.jobKey, "red_rocks_private_transport");
  assert.equal(rrdd.jobKey, "red_rocks_designated_driver_network");
  assert.equal(parr.mustNotOwn.includes("red_rocks_designated_driver_network"), true);
  assert.equal(rrdd.mustNotOwn.includes("red_rocks_private_transport"), true);
  assert.equal(fastPass.strategy, "review");
});

test("overlap-risk properties are explicitly governed instead of expanded by default", () => {
  assert.equal(getPortfolioSiteContract("lfse")?.strategy, "review");
  assert.equal(getPortfolioSiteContract("vegas")?.strategy, "review");
  assert.equal(getPortfolioSiteContract("shuttleya")?.strategy, "prove");
});
