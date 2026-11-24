import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import {
  GET as getHostedCatalogRoute,
  HEAD as headHostedCatalogRoute,
} from "@/app/api/v1/cruises/hosted-catalog/route";
import {
  GET as getHostedCatalogChangesRoute,
  HEAD as headHostedCatalogChangesRoute,
} from "@/app/api/v1/cruises/hosted-catalog/changes/route";
import {
  DCC_RECENT_CATALOG_CHANGE_EVENTS,
  getDccCanonicalHostedCatalogSnapshot,
} from "@/lib/dcc/cruise/hostedCatalogRegistry";
import { getOrganizerActivationCohort } from "@/lib/dcc/cruise/organizerActivationCohort";
import {
  assertHostedFieldMutationPermitted,
  buildHostedCatalogFieldProvenance,
  clearSignedHostedCatalogCacheForTests,
  computeVerifiedOnceFingerprint,
  evaluateVerifyOnceReuse,
  getSignedHostedCatalogSnapshotEnvelope,
  HOSTED_FIELD_AUTHORITY_MATRIX,
  HOSTED_SOURCE_AUTHORITY_DEFINITIONS,
  HOSTED_USAGE_RIGHTS_DEFINITIONS,
  HostedCanonicalIdentifierRegistry,
  HostedCatalogProvenanceLedger,
  HostedFieldPermissionDeniedError,
  HostedIdentifierRecyclingForbiddenError,
  verifySignedHostedCatalogSnapshotEnvelope,
  ZERO_FEE_ORGANIZER_POLICY,
} from "@/lib/dcc/cruise/hostedProvenanceLedger";

describe("Phase 1 + Phase 2 DCC Provenance, Signing & Zero-Fee Organizer Contract", () => {
  it("enforces the permanent $0 Organizer Workspace fee policy", () => {
    assert.equal(ZERO_FEE_ORGANIZER_POLICY.permanent, true);
    assert.equal(ZERO_FEE_ORGANIZER_POLICY.listingFeeUsd, 0);
    assert.equal(ZERO_FEE_ORGANIZER_POLICY.subscriptionFeeUsd, 0);
    assert.equal(ZERO_FEE_ORGANIZER_POLICY.leadFeeUsd, 0);
    assert.equal(ZERO_FEE_ORGANIZER_POLICY.cabinSaleCommissionPct, 0);
    assert.equal(ZERO_FEE_ORGANIZER_POLICY.paidOrganicRankingBoostWeight, 0);
    assert.equal(ZERO_FEE_ORGANIZER_POLICY.directOfficialCabinHandoffOnly, true);
  });

  it("classifies source authorities and usage rights cleanly", () => {
    assert.equal(HOSTED_SOURCE_AUTHORITY_DEFINITIONS.official_cruise_line.trustedForIndexation, true);
    assert.equal(
      HOSTED_SOURCE_AUTHORITY_DEFINITIONS.verified_organizer_workspace.trustedForIndexation,
      true,
    );
    assert.equal(HOSTED_SOURCE_AUTHORITY_DEFINITIONS.unverified_public_lead.trustedForIndexation, false);

    assert.equal(HOSTED_USAGE_RIGHTS_DEFINITIONS.link_only_no_copy.allowPublicDisplay, true);
    assert.equal(HOSTED_USAGE_RIGHTS_DEFINITIONS.internal_verification_only.allowPublicDisplay, false);
  });

  it("enforces provider-controlled vs DCC-controlled field permissions with 403 error", () => {
    const allowedProviderFields = [
      "officialWebsiteUrl",
      "officialSailingPageUrl",
      "officialReservationFormUrl",
      "officialItineraryUrl",
      "officialPolicyUrl",
      "officialReviewUrl",
      "officialSocialLinks",
      "organizerProvidedDescription",
      "welcomeNote",
      "typicalHostedProgramming",
      "announcedHostedProgramming",
      "soloSupport",
      "cabinAvailabilityStatus",
      "cabinAvailabilityNote",
      "cabinBlockModelNote",
      "inclusionsSummary",
      "pinnedHighlights",
      "pinnedSailingSlugs",
      "membershipMode",
    ];

    for (const field of allowedProviderFields) {
      const spec = assertHostedFieldMutationPermitted("verified_organizer", field);
      assert.equal(spec.authority, "provider_or_dcc_owner");
    }

    const dccOnlyFields = [
      "organizerId",
      "hostedSailingId",
      "physicalSailingId",
      "communityId",
      "reputationEntityId",
      "reputationSailingEntityId",
      "organizerSlug",
      "aliases",
      "canonicalShipSlug",
      "canonicalSailDate",
      "independentSummary",
      "nonAffiliationNotice",
      "cabinBookingPolicyNote",
      "scheduleHoldReason",
      "isIndexable",
      "organicRankingScore",
      "reviewRatingsAndText",
      "reviewModerationStatus",
    ];

    for (const field of dccOnlyFields) {
      assert.throws(
        () => assertHostedFieldMutationPermitted("verified_organizer", field),
        (err: unknown) =>
          err instanceof HostedFieldPermissionDeniedError && err.statusCode === 403,
      );
      assert.equal(assertHostedFieldMutationPermitted("dcc_owner", field).authority, "dcc_only");
    }

    assert.ok(Object.keys(HOSTED_FIELD_AUTHORITY_MATRIX).length >= 30);
  });

  it("enforces verify-once-reuse-everywhere when RFC 8785 verifiedOnceFingerprint matches", () => {
    const entityId = "hosted-sailing:arnos-bear-cruises:cel:celebrity-edge:2028-10-17";
    const fieldName = "officialSailingPageUrl";
    const url = "https://www.arnoscruises.com/australia-new-zealand-bear-cruise-2028";

    const noPrior = evaluateVerifyOnceReuse({
      entityId,
      fieldName,
      candidateValue: url,
      existingProvenance: null,
    });
    assert.equal(noPrior.requiresHumanVerification, true);
    assert.equal(noPrior.reason, "missing_prior_verification");

    const verifiedProvenance = {
      suppliedBy: "dcc:catalog-research",
      suppliedAt: "2026-11-15T12:00:00Z",
      sourceAuthority: "official_organizer_domain" as const,
      usageRights: "link_only_no_copy" as const,
      dccVerified: true,
      lastCheckedAt: "2026-11-15T12:00:00Z",
      verifiedOnceFingerprint: computeVerifiedOnceFingerprint(entityId, fieldName, url),
    };

    const reused = evaluateVerifyOnceReuse({
      entityId,
      fieldName,
      candidateValue: url,
      existingProvenance: verifiedProvenance,
    });
    assert.equal(reused.requiresHumanVerification, false);
    assert.equal(reused.reusedExistingVerification, true);
    assert.equal(reused.reason, "already_verified_fingerprint_match");

    const changed = evaluateVerifyOnceReuse({
      entityId,
      fieldName,
      candidateValue: "https://www.arnoscruises.com/new-path-2028",
      existingProvenance: verifiedProvenance,
    });
    assert.equal(changed.requiresHumanVerification, true);
    assert.equal(changed.reusedExistingVerification, false);
    assert.equal(changed.reason, "material_value_changed");
  });

  it("enforces permanent canonical entity IDs, alias resolution, and zero ID recycling", () => {
    const reg = new HostedCanonicalIdentifierRegistry(true);
    const counts = reg.getSummaryCounts();
    assert.ok(counts.totalAllocated >= 37 + 44 + 44);

    assert.equal(
      reg.resolveOrganizerId("arnos-bear-cruises"),
      "hosted-organizer:arnos-bear-cruises",
    );
    assert.equal(
      reg.resolveOrganizerId("arno-bear-cruises"),
      "hosted-organizer:arnos-bear-cruises",
    );

    assert.throws(
      () => reg.registerOrganizerAlias("arno-bear-cruises", "hosted-organizer:vacaya"),
      HostedIdentifierRecyclingForbiddenError,
    );

    assert.throws(
      () =>
        reg.registerEntityId({
          entityId: "sailing:cel:celebrity-edge:2028-10-17",
          entityKind: "physical_sailing",
          bindingSignature: "ship:cel:celebrity-beyond:2029-01-01",
        }),
      HostedIdentifierRecyclingForbiddenError,
    );

    const tempId = "hosted-sailing:test-org:rccl:oasis-of-the-seas:2030-05-01";
    reg.registerEntityId({
      entityId: tempId,
      entityKind: "hosted_sailing",
      bindingSignature: "hosted:test-org:sailing:rccl:oasis-of-the-seas:2030-05-01",
    });
    reg.retireEntityIdPermanently(tempId, "2026-11-15T14:00:00Z");
    assert.throws(
      () =>
        reg.registerEntityId({
          entityId: tempId,
          entityKind: "hosted_sailing",
          bindingSignature: "hosted:test-org:sailing:rccl:oasis-of-the-seas:2030-05-01",
        }),
      HostedIdentifierRecyclingForbiddenError,
    );
  });

  it("maintains an append-only RFC 8785 hash-chained ledger with rollback & cursor slicing", () => {
    const ledger = new HostedCatalogProvenanceLedger(true);
    const initialCursor = ledger.getLatestCursor();
    assert.equal(initialCursor, DCC_RECENT_CATALOG_CHANGE_EVENTS.length);
    assert.ok(initialCursor >= 1);

    const updatedEv = ledger.appendEventSync({
      eventType: "provider_field_updated",
      actorRole: "verified_organizer",
      suppliedBy: "organizer:arnos-bear-cruises",
      sourceAuthority: "verified_organizer_workspace",
      usageRights: "provider_granted_display",
      entityType: "hosted_sailing",
      entityId: "hosted-sailing:arnos-bear-cruises:cel:celebrity-edge:2028-10-17",
      changedFields: ["welcomeNote", "officialItineraryUrl"],
      beforeValues: { welcomeNote: null, officialItineraryUrl: null },
      afterValues: {
        welcomeNote: "Welcome to Sydney embarkation!",
        officialItineraryUrl: "https://www.arnoscruises.com/australia-new-zealand-bear-cruise-2028",
      },
      dccVerified: true,
      summary: "Verified organizer updated welcome note and itinerary link.",
    });

    assert.equal(updatedEv.cursor, initialCursor + 1);
    assert.equal(updatedEv.preservesCommunityIdentity, true);

    assert.throws(
      () =>
        ledger.appendEventSync({
          eventType: "provider_field_updated",
          actorRole: "verified_organizer",
          suppliedBy: "organizer:arnos-bear-cruises",
          sourceAuthority: "verified_organizer_workspace",
          usageRights: "factual_reference_reusable",
          entityType: "hosted_organizer",
          entityId: "hosted-organizer:arnos-bear-cruises",
          changedFields: ["independentSummary"],
          beforeValues: { independentSummary: "Old" },
          afterValues: { independentSummary: "Overwritten" },
          dccVerified: true,
          summary: "Attempted override of editorial summary.",
        }),
      HostedFieldPermissionDeniedError,
    );

    const rolledBack = ledger.rollbackEventSync({
      targetEventId: updatedEv.eventId,
      actorRole: "verified_organizer",
      suppliedBy: "organizer:arnos-bear-cruises",
    });
    assert.equal(rolledBack.eventType, "rollback_applied");
    assert.equal(rolledBack.rolledBackEventId, updatedEv.eventId);
    assert.equal(rolledBack.afterValues.welcomeNote, null);
    assert.equal(ledger.getAllEvents().length, initialCursor + 2);

    const chainCheck = ledger.verifyHashChainIntegrity();
    assert.equal(chainCheck.valid, true);
    assert.equal(chainCheck.checkedCount, initialCursor + 2);

    const delta = ledger.getIncrementalChangesSince(`dcc-hc-cur-${initialCursor}`);
    assert.equal(delta.events.length, 2);
    assert.equal(delta.upToDate, false);

    const upToDate = ledger.getIncrementalChangesSince(ledger.getLatestCursorToken());
    assert.equal(upToDate.events.length, 0);
    assert.equal(upToDate.upToDate, true);
  });

  it("projects field-level provenance and signs/verifies snapshots with caching", async () => {
    clearSignedHostedCatalogCacheForTests();
    const snapshot = getDccCanonicalHostedCatalogSnapshot();
    const provenance = buildHostedCatalogFieldProvenance(snapshot);
    assert.ok(provenance.summary.verifiedFieldCount > 500);
    assert.equal(provenance.summary.heldUnverifiedFieldCount, 12);

    // Verify reputation IDs, sailings, and held-evidence records in the current snapshot.
    assert.equal(snapshot.organizers.length, 68);
    assert.equal((snapshot.franchises || []).length, 104);
    assert.equal(snapshot.hostedSailings.length, 136);
    assert.equal(snapshot.hostedSailings.filter((s) => !s.scheduleHoldReason).length, 133);
    assert.equal(snapshot.hostedSailings.filter((s) => Boolean(s.scheduleHoldReason)).length, 3);
    assert.equal((snapshot.heldInsufficientEvidenceItems || []).length, 55);
    for (const org of snapshot.organizers) {
      assert.match(org.reputationEntityId || "", /^rep:hosted-organizer:/);
    }
    for (const sailing of snapshot.hostedSailings) {
      assert.match(sailing.reputationSailingEntityId || "", /^rep:hosted-sailing:/);
    }

    // Verify Priority 10 Organizer Activation Cohort packages & zero-outreach default
    const activationCohort = await getOrganizerActivationCohort();
    assert.equal(activationCohort.length, 10);
    for (const pkg of activationCohort) {
      assert.equal(pkg.trackingState, "not_contacted");
      assert.equal(pkg.outreachSent, false);
      assert.ok(pkg.publicProfileUrl.startsWith("https://cruisepromenade.com/hosted-cruises/"));
      assert.ok(pkg.freeClaimUrl.startsWith("https://cruisepromenade.com/organizer/hosted/"));
      assert.ok(pkg.telephoneScript.length > 40);
      assert.ok(pkg.emailDraft.body.length > 80);
    }

    const env1 = await getSignedHostedCatalogSnapshotEnvelope(snapshot, "dcc-hc-cur-2");
    const env2 = await getSignedHostedCatalogSnapshotEnvelope(snapshot, "dcc-hc-cur-2");
    assert.equal(env2, env1);

    const verified = await verifySignedHostedCatalogSnapshotEnvelope({
      jwsCompact: env1.jwsCompact,
      snapshot,
    });
    assert.equal(verified.valid, true);
    assert.equal(verified.snapshotRfc8785Sha256, env1.snapshotRfc8785Sha256);

    const tampered = structuredClone(snapshot);
    tampered.organizers[0]!.independentSummary = "Tampered summary";
    const tamperedCheck = await verifySignedHostedCatalogSnapshotEnvelope({
      jwsCompact: env1.jwsCompact,
      snapshot: tampered,
    });
    assert.equal(tamperedCheck.valid, false);
    assert.equal(tamperedCheck.reason, "SNAPSHOT_CONTENT_SHA256_MISMATCH");
  });

  it("serves GET/HEAD /api/v1/cruises/hosted-catalog and /changes with ETag -> 304 and signed envelopes", async () => {
    const getRes = await getHostedCatalogRoute(
      new NextRequest(
        "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog?provenance=1&signed=1",
      ),
    );
    assert.equal(getRes.status, 200);
    const etag = getRes.headers.get("etag");
    const cursor = getRes.headers.get("x-dcc-ledger-cursor");
    assert.match(etag ?? "", /^"sha256-[0-9a-f]{64}"$/);
    assert.match(cursor ?? "", /^dcc-hc-cur-\d+$/);

    const body = await getRes.json();
    assert.equal(body.ok, true);
    assert.equal(body.zeroFeeOrganizerPolicy.listingFeeUsd, 0);
    assert.equal(body.ledgerIntegrity.valid, true);
    assert.ok(
      body.fieldProvenance.organizersByEntityId["hosted-organizer:arnos-bear-cruises"],
    );
    assert.ok(body.signedSnapshot?.jwsCompact);

    const notModifiedRes = await getHostedCatalogRoute(
      new NextRequest(
        "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog?provenance=1&signed=1",
        { headers: { "If-None-Match": etag! } },
      ),
    );
    assert.equal(notModifiedRes.status, 304);

    const headRes = await headHostedCatalogRoute(
      new NextRequest("https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog"),
    );
    assert.equal(headRes.status, 200);
    assert.match(headRes.headers.get("etag") ?? "", /^"sha256-[0-9a-f]{64}"$/);

    const changesRes = await getHostedCatalogChangesRoute(
      new NextRequest(
        "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog/changes?since=0",
      ),
    );
    assert.equal(changesRes.status, 200);
    const changesEtag = changesRes.headers.get("etag");
    const changesBody = await changesRes.json();
    assert.equal(changesBody.ok, true);
    assert.equal(changesBody.hashChainIntegrity.valid, true);
    assert.equal(changesBody.eventCount, DCC_RECENT_CATALOG_CHANGE_EVENTS.length);

    const changes304 = await headHostedCatalogChangesRoute(
      new NextRequest(
        "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog/changes?since=0",
        { headers: { "If-None-Match": changesEtag! } },
      ),
    );
    assert.equal(changes304.status, 304);
  });
});
