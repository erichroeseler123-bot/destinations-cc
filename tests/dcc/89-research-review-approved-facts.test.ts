import test from "node:test";
import assert from "node:assert/strict";
import {
  clearNonceReplayCacheForTesting,
  signServiceRequest,
} from "@/lib/dcc/auth/hmac-service-auth";
import {
  COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE,
  clearSyncedReviewDeskPayloadForTesting,
  evaluateApprovedFactFeed,
  evaluateResearchFactRecord,
  getVerifiedFactsForExactProduct,
  type RawResearchDeskFactRow,
} from "@/lib/dcc/research/approvedFactsFeed";
import { evaluateJuneauOperatorProductFacts } from "@/lib/dcc/juneauPortDayEngine";
import {
  GET as getApprovedFactsRoute,
  POST as postApprovedFactsRoute,
} from "@/app/api/internal/research/approved-facts/route";
import { GET as getCruisePortRoute } from "@/app/api/internal/cruises/port/[slug]/route";

const CP_KEY_ID = "cp_service_key";
const CP_SECRET = "test_cp_to_dcc_hmac_secret_2026";

const COASTAL_DURATION_CONFIRMED_FIXTURE: RawResearchDeskFactRow = {
  id: "20a56628f0ce1e5cc2299a68",
  fact_id: "20a56628f0ce1e5cc2299a68",
  cluster: "alaska-juneau",
  product_id: "coastal-helicopters-icefield-excursion-direct",
  constraint_type: "total_duration",
  source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
  source_excerpt: "Total Duration: 2 hours, 35 minutes (155 minutes)",
  source_hash:
    "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
  current_source_hash:
    "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
  checked_at: "2026-04-20T00:13:07.887822+00:00",
  value: "155",
  unit: "minutes",
  conditions:
    "Includes round-trip downtown/cruise port shuttle transportation; approximately 55 minutes from pickup to return plus 40–45 minutes on the Herbert Glacier.",
  status: "Confirmed",
  verified_on: "2026-04-20",
  verified_by: "Erich Roeseler",
  reviewer_id: "erich@destinationcommandcenter.com",
  review_due_on: "2026-07-19",
  revision: 2,
  active: 1,
  healthy: 1,
  consumers: [
    "dcc:juneau/port-day-engine",
    "dcc:api/internal/cruises/port/juneau",
    "cruisepromenade:ports/juneau",
    "cruisepromenade:api/excursions",
  ],
};

test.beforeEach(() => {
  process.env.DCC_CP_SERVICE_KEY_ID = CP_KEY_ID;
  process.env.DCC_CP_SERVICE_SECRET = CP_SECRET;
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";
  clearNonceReplayCacheForTesting();
  clearSyncedReviewDeskPayloadForTesting();
});

test("DCC Research Review Approved-Fact Integration Suite", async (t) => {
  await t.test(
    "1. Machine candidates are never automatically approved and remain needs_confirmation",
    () => {
      const evaluation = evaluateApprovedFactFeed(
        COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE,
        { nowMs: Date.parse("2026-04-20T12:00:00Z") },
      );

      assert.equal(evaluation.total_evaluated, 6);
      assert.equal(evaluation.verified_count, 0);
      assert.equal(evaluation.verified_facts.length, 0);

      for (const fact of evaluation.all_evaluated_facts) {
        assert.equal(fact.verified, false);
        assert.equal(fact.eligibility_status, "needs_confirmation");
        assert.equal(fact.disqualification_reason, "unconfirmed_candidate");
      }
    },
  );

  await t.test(
    "2. Human-confirmed Coastal Helicopters 155-minute duration fact preserves exact IDs, value, conditions, source, revision, and dates",
    () => {
      const nowMs = Date.parse("2026-04-20T12:00:00Z");
      const evaluated = evaluateResearchFactRecord(
        COASTAL_DURATION_CONFIRMED_FIXTURE,
        { nowMs },
      );

      assert.equal(evaluated.verified, true);
      assert.equal(evaluated.eligibility_status, "verified");
      assert.equal(evaluated.disqualification_reason, null);
      assert.equal(evaluated.fact_id, "20a56628f0ce1e5cc2299a68");
      assert.equal(evaluated.operator_id, "coastal-helicopters");
      assert.equal(evaluated.operator_name, "Coastal Helicopters");
      assert.equal(
        evaluated.product_id,
        "coastal-helicopters-icefield-excursion-direct",
      );
      assert.equal(evaluated.port_slug, "juneau");
      assert.equal(evaluated.constraint_type, "total_duration");
      assert.equal(evaluated.value, "155");
      assert.equal(evaluated.unit, "minutes");
      assert.equal(
        evaluated.conditions,
        "Includes round-trip downtown/cruise port shuttle transportation; approximately 55 minutes from pickup to return plus 40–45 minutes on the Herbert Glacier.",
      );
      assert.equal(
        evaluated.source_url,
        "https://coastalhelicopters.com/tours/icefield-excursion/",
      );
      assert.equal(
        evaluated.source_hash,
        "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
      );
      assert.equal(evaluated.revision, 2);
      assert.equal(evaluated.verified_on, "2026-04-20");
      assert.equal(evaluated.verified_by, "Erich Roeseler");
      assert.equal(evaluated.review_due_on, "2026-07-19");
      assert.equal(evaluated.non_transferable_to_other_tours, true);
    },
  );

  await t.test(
    "3. Non-transferability and qualification: Coastal Helicopters approval never applies to TEMSCO or NorthStar, and duration alone does not establish port-day fit",
    () => {
      const rows: RawResearchDeskFactRow[] = [
        COASTAL_DURATION_CONFIRMED_FIXTURE,
        ...COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE.filter(
          (r) => r.fact_id !== "20a56628f0ce1e5cc2299a68",
        ),
      ];
      const evaluation = evaluateApprovedFactFeed(rows, {
        nowMs: Date.parse("2026-04-20T12:00:00Z"),
      });

      const coastalFacts = getVerifiedFactsForExactProduct(
        evaluation.verified_facts,
        "coastal-helicopters-icefield-excursion-direct",
      );
      const temscoFacts = getVerifiedFactsForExactProduct(
        evaluation.verified_facts,
        "temsco-mendenhall-glacier-pilot-choice-direct",
      );
      const northstarFacts = getVerifiedFactsForExactProduct(
        evaluation.verified_facts,
        "northstar-glacier-walkabout-direct",
      );

      assert.equal(coastalFacts.length, 1);
      assert.equal(coastalFacts[0].fact_id, "20a56628f0ce1e5cc2299a68");
      assert.equal(temscoFacts.length, 0);
      assert.equal(northstarFacts.length, 0);

      const coastalSummary = evaluateJuneauOperatorProductFacts(
        "coastal-helicopters-icefield-excursion-direct",
        evaluation.verified_facts,
      );
      assert.ok(coastalSummary);
      assert.equal(
        coastalSummary.verifiedDurationFact?.fact_id,
        "20a56628f0ce1e5cc2299a68",
      );
      assert.equal(coastalSummary.verifiedTransportFact, null);
      assert.equal(coastalSummary.verifiedAgeFact, null);
      assert.equal(coastalSummary.verifiedWeightFact, null);
      assert.equal(coastalSummary.fitsPortDayEstablished, false);
      assert.deepEqual(coastalSummary.missingConstraintTypes, [
        "pickup_and_transport",
        "age_and_seat_policy",
        "mobility_and_weight",
      ]);

      const temscoSummary = evaluateJuneauOperatorProductFacts(
        "temsco-mendenhall-glacier-pilot-choice-direct",
        evaluation.verified_facts,
      );
      assert.ok(temscoSummary);
      assert.equal(temscoSummary.verifiedDurationFact, null);
      assert.equal(temscoSummary.allProductVerifiedFacts.length, 0);
    },
  );

  await t.test(
    "4. Withdrawn, expired, conflicted, source-changed, and unhealthy facts immediately lose verified status and cap Cache-Control",
    () => {
      const nowMs = Date.parse("2026-04-20T12:00:00Z");

      // Withdrawn
      const withdrawn = evaluateResearchFactRecord(
        { ...COASTAL_DURATION_CONFIRMED_FIXTURE, active: 0 },
        { nowMs },
      );
      assert.equal(withdrawn.verified, false);
      assert.equal(withdrawn.eligibility_status, "withdrawn");
      assert.equal(withdrawn.disqualification_reason, "withdrawn_fact");

      // Expired (at or after review_due_on 00:00:00Z)
      const expired = evaluateResearchFactRecord(
        COASTAL_DURATION_CONFIRMED_FIXTURE,
        { nowMs: Date.parse("2026-07-19T00:00:00Z") },
      );
      assert.equal(expired.verified, false);
      assert.equal(expired.eligibility_status, "expired");
      assert.equal(expired.disqualification_reason, "review_deadline_expired");

      // Conflicted
      const conflicted = evaluateResearchFactRecord(
        { ...COASTAL_DURATION_CONFIRMED_FIXTURE, conflicted: true },
        { nowMs },
      );
      assert.equal(conflicted.verified, false);
      assert.equal(conflicted.eligibility_status, "conflicted");
      assert.equal(conflicted.disqualification_reason, "conflicted_evidence");

      // Source hash changed
      const sourceChanged = evaluateResearchFactRecord(
        {
          ...COASTAL_DURATION_CONFIRMED_FIXTURE,
          current_source_hash:
            "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        },
        { nowMs },
      );
      assert.equal(sourceChanged.verified, false);
      assert.equal(sourceChanged.eligibility_status, "source_changed");
      assert.equal(sourceChanged.disqualification_reason, "source_hash_drift");

      // Source unhealthy
      const unhealthy = evaluateResearchFactRecord(
        { ...COASTAL_DURATION_CONFIRMED_FIXTURE, healthy: 0 },
        { nowMs },
      );
      assert.equal(unhealthy.verified, false);
      assert.equal(unhealthy.eligibility_status, "source_unhealthy");
      assert.equal(unhealthy.disqualification_reason, "source_unhealthy");

      // Cache-Control capping near deadline (42 seconds before review_due_on UTC midnight)
      const nearExpiryEval = evaluateApprovedFactFeed(
        [COASTAL_DURATION_CONFIRMED_FIXTURE],
        {
          nowMs: Date.parse("2026-07-19T00:00:00Z") - 42_000,
        },
      );
      assert.equal(nearExpiryEval.verified_count, 1);
      assert.equal(nearExpiryEval.recommended_max_age_seconds, 42);
      assert.equal(
        nearExpiryEval.cache_control_header,
        "private, max-age=42, s-maxage=42, must-revalidate",
      );

      // Cache-Control after expiry becomes no-store
      const postExpiryEval = evaluateApprovedFactFeed(
        [COASTAL_DURATION_CONFIRMED_FIXTURE],
        {
          nowMs: Date.parse("2026-07-19T00:00:01Z"),
        },
      );
      assert.equal(postExpiryEval.verified_count, 0);
      assert.equal(postExpiryEval.recommended_max_age_seconds, 0);
      assert.equal(
        postExpiryEval.cache_control_header,
        "private, no-store, max-age=0, must-revalidate",
      );
    },
  );

  await t.test(
    "5. Authenticated /api/internal/research/approved-facts and /api/internal/cruises/port/juneau enforce HMAC auth and return verified Coastal fact",
    async () => {
      // Unauthenticated GET must fail with 401
      const unauthRes = await getApprovedFactsRoute(
        new Request(
          "https://destinationcommandcenter.com/api/internal/research/approved-facts?port=juneau",
        ),
      );
      assert.equal(unauthRes.status, 401);

      // Authenticated POST sync of confirmed Coastal duration fact + 5 unconfirmed candidates
      const syncBody = JSON.stringify({
        action: "sync",
        now: "2026-04-20T12:00:00Z",
        rows: [
          COASTAL_DURATION_CONFIRMED_FIXTURE,
          ...COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE.filter(
            (r) => r.fact_id !== "20a56628f0ce1e5cc2299a68",
          ),
        ],
      });
      const signedPost = signServiceRequest({
        keyId: CP_KEY_ID,
        secret: CP_SECRET,
        method: "POST",
        pathname: "/api/internal/research/approved-facts",
        body: syncBody,
      });

      const postRes = await postApprovedFactsRoute(
        new Request(
          "https://destinationcommandcenter.com/api/internal/research/approved-facts",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...signedPost.headers,
            },
            body: syncBody,
          },
        ),
      );
      assert.equal(postRes.status, 200);
      const postJson = await postRes.json();
      assert.equal(postJson.ok, true);
      assert.equal(postJson.verified_count, 1);
      assert.equal(
        postJson.verified_facts[0].fact_id,
        "20a56628f0ce1e5cc2299a68",
      );

      // Authenticated GET from Cruise Promenade for Juneau approved facts
      const query = "port=juneau&now=2026-04-20T12%3A00%3A00Z";
      const signedGet = signServiceRequest({
        keyId: CP_KEY_ID,
        secret: CP_SECRET,
        method: "GET",
        pathname: "/api/internal/research/approved-facts",
        searchParams: query,
      });

      const getRes = await getApprovedFactsRoute(
        new Request(
          `https://destinationcommandcenter.com/api/internal/research/approved-facts?${query}`,
          {
            method: "GET",
            headers: signedGet.headers,
          },
        ),
      );
      assert.equal(getRes.status, 200);
      const getJson = await getRes.json();
      assert.equal(getJson.ok, true);
      assert.equal(getJson.verified_count, 1);
      assert.equal(
        getJson.verified_facts[0].product_id,
        "coastal-helicopters-icefield-excursion-direct",
      );
      assert.equal(getJson.verified_facts[0].value, "155");
      assert.equal(getJson.verified_facts[0].unit, "minutes");

      // Authenticated GET to /api/internal/cruises/port/juneau includes approved_research_facts
      const portQuery = "now=2026-04-20T12%3A00%3A00Z";
      const signedPortGet = signServiceRequest({
        keyId: CP_KEY_ID,
        secret: CP_SECRET,
        method: "GET",
        pathname: "/api/internal/cruises/port/juneau",
        searchParams: portQuery,
      });
      const portRes = await getCruisePortRoute(
        new Request(
          `https://destinationcommandcenter.com/api/internal/cruises/port/juneau?${portQuery}`,
          {
            method: "GET",
            headers: signedPortGet.headers,
          },
        ),
        { params: Promise.resolve({ slug: "juneau" }) },
      );
      assert.equal(portRes.status, 200);
      const portJson = await portRes.json();
      assert.equal(portJson.approved_research_facts.verified_count, 1);
      assert.equal(
        portJson.approved_research_facts.verified_facts[0].fact_id,
        "20a56628f0ce1e5cc2299a68",
      );
    },
  );
});
