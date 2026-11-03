import test from "node:test";
import assert from "node:assert/strict";
import {
  clearNonceReplayCacheForTesting,
  signServiceRequest,
} from "@/lib/dcc/auth/hmac-service-auth";
import {
  COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE,
  WISCONSIN_CHETEK_CANDIDATE_BASELINE,
  applyDurableResearchSyncMutation,
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
const PRODUCER_KEY_ID = "review_desk_service_key";
const PRODUCER_SECRET = "test_review_desk_producer_hmac_secret_2026";

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
  checked_at: "2026-11-03T00:00:00.000Z",
  value: "155",
  unit: "minutes",
  conditions:
    "Includes round-trip downtown/cruise port shuttle transportation; approximately 55 minutes from pickup to return plus 40–45 minutes on the Herbert Glacier.",
  status: "Confirmed",
  verified_on: "2026-11-03",
  verified_by: "Erich Roeseler",
  reviewer_id: "erich@destinationcommandcenter.com",
  review_due_on: "2026-12-03",
  revision: 4,
  active: 1,
  healthy: 1,
  consumers: [
    "dcc:juneau/port-day-engine",
    "dcc:api/internal/cruises/port/juneau",
    "cruisepromenade:ports/juneau",
    "cruisepromenade:api/excursions",
    "lfse:ports/juneau",
    "lfse:juneau/helicopter-glacier-tours",
  ],
};

test.beforeEach(() => {
  process.env.DCC_CP_SERVICE_KEY_ID = CP_KEY_ID;
  process.env.DCC_CP_SERVICE_SECRET = CP_SECRET;
  process.env.DCC_SERVICE_SECRET_REVIEW_DESK_SERVICE_KEY = PRODUCER_SECRET;
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";
  clearNonceReplayCacheForTesting();
});

test("DCC Research Review Approved-Fact Integration Suite", async (t) => {
  await t.test(
    "1. Machine candidates are never automatically approved and remain needs_confirmation",
    () => {
      const evaluation = evaluateApprovedFactFeed([
        ...COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE,
        ...WISCONSIN_CHETEK_CANDIDATE_BASELINE,
      ]);

      assert.equal(evaluation.total_evaluated, 12);
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
    "2. Human-confirmed Coastal Helicopters 155-minute duration fact (revision 4, verified 2026-11-03, due 2026-12-03) preserves exact IDs, value, conditions, source, revision, and dates under server time",
    () => {
      const evaluated = evaluateResearchFactRecord(
        COASTAL_DURATION_CONFIRMED_FIXTURE,
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
      assert.equal(evaluated.revision, 4);
      assert.equal(evaluated.verified_on, "2026-11-03");
      assert.equal(evaluated.verified_by, "Erich Roeseler");
      assert.equal(evaluated.review_due_on, "2026-12-03");
      assert.equal(evaluated.non_transferable_to_other_tours, true);
    },
  );

  await t.test(
    "3. Non-transferability and qualification: Coastal Helicopters approval never applies to TEMSCO, NorthStar, Ketchikan umbrella bundles, or Chetek tours, and duration alone does not establish port-day fit",
    () => {
      const rows: RawResearchDeskFactRow[] = [
        COASTAL_DURATION_CONFIRMED_FIXTURE,
        ...COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE.filter(
          (r) => r.fact_id !== "20a56628f0ce1e5cc2299a68",
        ),
        {
          ...COASTAL_DURATION_CONFIRMED_FIXTURE,
          id: "blocked-ketchikan-umbrella",
          fact_id: "blocked-ketchikan-umbrella",
          cluster: "alaska-ketchikan",
          product_id: "cape-fox-saxman-highlights-lumberjack",
        },
      ];
      const evaluation = evaluateApprovedFactFeed(rows);

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
      const blockedUmbrellaFact = evaluation.all_evaluated_facts.find(
        (f) => f.fact_id === "blocked-ketchikan-umbrella",
      );

      assert.equal(coastalFacts.length, 1);
      assert.equal(coastalFacts[0].fact_id, "20a56628f0ce1e5cc2299a68");
      assert.equal(temscoFacts.length, 0);
      assert.equal(northstarFacts.length, 0);
      assert.ok(blockedUmbrellaFact);
      assert.equal(blockedUmbrellaFact.verified, false);
      assert.equal(
        blockedUmbrellaFact.disqualification_reason,
        "blocked_umbrella_product",
      );

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
      const nowMs = Date.parse("2026-11-03T12:00:00Z");

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
        { nowMs: Date.parse("2026-12-03T00:00:00Z") },
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
          nowMs: Date.parse("2026-12-03T00:00:00Z") - 42_000,
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
          nowMs: Date.parse("2026-12-03T00:00:01Z"),
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
    "5. Durable synchronization handles upsert, withdrawal, source-change invalidation, and prevents resurrection of revoked revisions",
    () => {
      const nowMs = Date.parse("2026-11-03T12:00:00Z");

      // Step A: Upsert confirmed revision 4
      const stateAfterUpsert = applyDurableResearchSyncMutation(
        null,
        {
          action: "sync",
          rows: [COASTAL_DURATION_CONFIRMED_FIXTURE],
        },
        nowMs,
      );
      const evalAfterUpsert = evaluateApprovedFactFeed(
        Object.values(stateAfterUpsert.rows_by_fact_id),
        {
          nowMs,
          sourceFingerprintsByUrl: stateAfterUpsert.sources_by_url,
          revokedRevisionsByFactId: stateAfterUpsert.revoked_revisions_by_fact_id,
        },
      );
      assert.equal(evalAfterUpsert.verified_count, 1);
      assert.equal(evalAfterUpsert.verified_facts[0].revision, 4);

      // Step B: Source-change invalidates revision 4 and records it in revoked_revisions_by_fact_id
      const stateAfterSourceDrift = applyDurableResearchSyncMutation(
        stateAfterUpsert,
        {
          action: "update_sources",
          sources: [
            {
              source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
              current_source_hash:
                "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
              healthy: true,
            },
          ],
        },
        nowMs + 1000,
      );
      assert.equal(
        stateAfterSourceDrift.revoked_revisions_by_fact_id["20a56628f0ce1e5cc2299a68"],
        4,
      );
      const evalAfterSourceDrift = evaluateApprovedFactFeed(
        Object.values(stateAfterSourceDrift.rows_by_fact_id),
        {
          nowMs: nowMs + 1000,
          sourceFingerprintsByUrl: stateAfterSourceDrift.sources_by_url,
          revokedRevisionsByFactId:
            stateAfterSourceDrift.revoked_revisions_by_fact_id,
        },
      );
      assert.equal(evalAfterSourceDrift.verified_count, 0);

      // Step C: Attempting to re-replay revision 4 even with matching source hash cannot resurrect it
      const stateReplayRev4 = applyDurableResearchSyncMutation(
        stateAfterSourceDrift,
        {
          action: "sync",
          rows: [COASTAL_DURATION_CONFIRMED_FIXTURE],
          sources: [
            {
              source_url: "https://coastalhelicopters.com/tours/icefield-excursion/",
              current_source_hash:
                "8c193318f4d1c67ad35058592ac74dffb7747be317a0cdd20319687a7a9638f5",
              healthy: true,
            },
          ],
        },
        nowMs + 2000,
      );
      const evalReplayRev4 = evaluateApprovedFactFeed(
        Object.values(stateReplayRev4.rows_by_fact_id),
        {
          nowMs: nowMs + 2000,
          sourceFingerprintsByUrl: stateReplayRev4.sources_by_url,
          revokedRevisionsByFactId: stateReplayRev4.revoked_revisions_by_fact_id,
        },
      );
      assert.equal(evalReplayRev4.verified_count, 0);

      // Step D: Explicit human re-approval at higher revision 5 restores eligibility, and subsequent withdrawal revokes revision 5
      const stateRev5 = applyDurableResearchSyncMutation(
        stateReplayRev4,
        {
          action: "sync",
          rows: [{ ...COASTAL_DURATION_CONFIRMED_FIXTURE, revision: 5 }],
        },
        nowMs + 3000,
      );
      const evalRev5 = evaluateApprovedFactFeed(
        Object.values(stateRev5.rows_by_fact_id),
        {
          nowMs: nowMs + 3000,
          sourceFingerprintsByUrl: stateRev5.sources_by_url,
          revokedRevisionsByFactId: stateRev5.revoked_revisions_by_fact_id,
        },
      );
      assert.equal(evalRev5.verified_count, 1);
      assert.equal(evalRev5.verified_facts[0].revision, 5);

      const stateWithdrawn = applyDurableResearchSyncMutation(
        stateRev5,
        {
          action: "withdraw",
          withdraw_fact_ids: ["20a56628f0ce1e5cc2299a68"],
        },
        nowMs + 4000,
      );
      const evalWithdrawn = evaluateApprovedFactFeed(
        Object.values(stateWithdrawn.rows_by_fact_id),
        {
          nowMs: nowMs + 4000,
          sourceFingerprintsByUrl: stateWithdrawn.sources_by_url,
          revokedRevisionsByFactId: stateWithdrawn.revoked_revisions_by_fact_id,
        },
      );
      assert.equal(evalWithdrawn.verified_count, 0);
      assert.equal(
         evalWithdrawn.all_evaluated_facts[0].eligibility_status,
        "withdrawn",
      );
    },
  );

  await t.test(
    "6. Production routes enforce producer-only writes (403 on consumer POST), read-only consumer GETs, real server time, and 400 on test clock/clear controls",
    async () => {
      // Unauthenticated GET must fail with 401
      const unauthRes = await getApprovedFactsRoute(
        new Request(
          "https://destinationcommandcenter.com/api/internal/research/approved-facts?port=juneau",
        ),
      );
      assert.equal(unauthRes.status, 401);

      // Authenticated GET with ?now= must be rejected with 400 PRODUCTION_TEST_CONTROL_FORBIDDEN
      const forbiddenQuery = "port=juneau&now=2026-11-03T12%3A00%3A00Z";
      const signedForbiddenGet = signServiceRequest({
        keyId: CP_KEY_ID,
        secret: CP_SECRET,
        method: "GET",
        pathname: "/api/internal/research/approved-facts",
        searchParams: forbiddenQuery,
      });
      const forbiddenGetRes = await getApprovedFactsRoute(
        new Request(
          `https://destinationcommandcenter.com/api/internal/research/approved-facts?${forbiddenQuery}`,
          {
            method: "GET",
            headers: signedForbiddenGet.headers,
          },
        ),
      );
      assert.equal(forbiddenGetRes.status, 400);
      const forbiddenGetJson = await forbiddenGetRes.json();
      assert.equal(forbiddenGetJson.code, "PRODUCTION_TEST_CONTROL_FORBIDDEN");

      // Consumer credentials (cp_service_key) attempting POST must be rejected with 403 FORBIDDEN_CONSUMER_WRITE
      const consumerWriteBody = JSON.stringify({
        action: "sync",
        rows: [COASTAL_DURATION_CONFIRMED_FIXTURE],
      });
      const signedConsumerWrite = signServiceRequest({
        keyId: CP_KEY_ID,
        secret: CP_SECRET,
        method: "POST",
        pathname: "/api/internal/research/approved-facts",
        body: consumerWriteBody,
      });
      const consumerWriteRes = await postApprovedFactsRoute(
        new Request(
          "https://destinationcommandcenter.com/api/internal/research/approved-facts",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...signedConsumerWrite.headers,
            },
            body: consumerWriteBody,
          },
        ),
      );
      assert.equal(consumerWriteRes.status, 403);
      const consumerWriteJson = await consumerWriteRes.json();
      assert.equal(consumerWriteJson.code, "FORBIDDEN_CONSUMER_WRITE");

      // Producer POST with action: "clear" must be rejected with 400 PRODUCTION_TEST_CONTROL_FORBIDDEN
      const clearBody = JSON.stringify({ action: "clear" });
      const signedClearPost = signServiceRequest({
        keyId: PRODUCER_KEY_ID,
        secret: PRODUCER_SECRET,
        method: "POST",
        pathname: "/api/internal/research/approved-facts",
        body: clearBody,
      });
      const clearPostRes = await postApprovedFactsRoute(
        new Request(
          "https://destinationcommandcenter.com/api/internal/research/approved-facts",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...signedClearPost.headers,
            },
            body: clearBody,
          },
        ),
      );
      assert.equal(clearPostRes.status, 400);
      const clearPostJson = await clearPostRes.json();
      assert.equal(clearPostJson.code, "PRODUCTION_TEST_CONTROL_FORBIDDEN");

      // Dedicated producer POST (review_desk_service_key) sync of confirmed Coastal duration fact (revision 4)
      const syncBody = JSON.stringify({
        action: "sync",
        rows: [
          COASTAL_DURATION_CONFIRMED_FIXTURE,
          ...COASTAL_HELICOPTERS_ICEFIELD_CANDIDATE_BASELINE.filter(
            (r) => r.fact_id !== "20a56628f0ce1e5cc2299a68",
          ),
        ],
      });
      const signedPost = signServiceRequest({
        keyId: PRODUCER_KEY_ID,
        secret: PRODUCER_SECRET,
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
      assert.equal(postJson.producer_key_id, "review_desk_service_key");
      assert.equal(postJson.verified_count, 1);
      assert.equal(
        postJson.verified_facts[0].fact_id,
        "20a56628f0ce1e5cc2299a68",
      );
      assert.equal(postJson.verified_facts[0].revision, 4);
      assert.equal(postJson.verified_facts[0].verified_on, "2026-11-03");
      assert.equal(postJson.verified_facts[0].review_due_on, "2026-12-03");

      // Authenticated GET from Cruise Promenade for Juneau approved facts (using server time)
      const query = "port=juneau";
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
      assert.equal(getJson.verified_facts[0].revision, 4);

      // Authenticated GET to /api/internal/cruises/port/juneau includes approved_research_facts
      const signedPortGet = signServiceRequest({
        keyId: CP_KEY_ID,
        secret: CP_SECRET,
        method: "GET",
        pathname: "/api/internal/cruises/port/juneau",
        searchParams: "",
      });
      const portRes = await getCruisePortRoute(
        new Request(
          "https://destinationcommandcenter.com/api/internal/cruises/port/juneau",
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
      assert.equal(
        portJson.approved_research_facts.verified_facts[0].revision,
        4,
      );
    },
  );
});
