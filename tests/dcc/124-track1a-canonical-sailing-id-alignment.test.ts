import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  buildHostedSailingId,
  buildPhysicalSailingId,
  buildPrivateCommunityId,
  buildTravelerPlanReference,
  resolvePhysicalSailingIdStrict,
} from "@/lib/dcc/cruise/canonicalHostedCruiseContract";
import {
  getDccCanonicalHostedCatalogSnapshot,
  resolveDccPhysicalSailingIdentity,
} from "@/lib/dcc/cruise/hostedCatalogRegistry";
import { listDccFactVerificationQueue } from "@/lib/dcc/cruise/canonicalLocationsAndRoutePatterns";
import {
  computeStrongRfc8785Etag,
  getSignedHostedCatalogSnapshotEnvelope,
} from "@/lib/dcc/cruise/hostedProvenanceLedger";
import {
  jwsCompactVerifyEdDsa,
  rfc8785Canonicalize,
} from "@/lib/dcc/machine/v03/rfc8785AndJws";
import { GET as getHostedCatalog } from "@/app/api/v1/cruises/hosted-catalog/route";

test("Track 1A DCC 1: 4-step lineCode resolution order & refusal to guess from ship name", () => {
  // Step 1: Verified physical-sailing record's canonical cruise-line field wins first
  const step1 = resolveDccPhysicalSailingIdentity({
    shipSlug: "symphony-of-the-seas",
    sailDate: "2027-01-31",
    verifiedSailingCruiseLine: "rccl",
    cruiseLineInput: "Unknown Label",
    isSyntheticTest: true,
  });
  assert.equal(step1.physicalSailingId, "sailing:rccl:symphony-of-the-seas:2027-01-31");
  assert.equal(step1.resolutionSource, "verified_sailing_record");
  assert.equal(step1.verificationFindingId, null);

  // Step 2: DCC cruise-line alias/canonicalization resolver
  const step2 = resolveDccPhysicalSailingIdentity({
    shipSlug: "custom-charter-vessel",
    sailDate: "2027-03-15",
    verifiedSailingCruiseLine: null,
    cruiseLineInput: "Norwegian Cruise Line",
    datedShipRegistryOverride: [],
    isSyntheticTest: true,
  });
  assert.equal(step2.physicalSailingId, "sailing:ncl:custom-charter-vessel:2027-03-15");
  assert.equal(step2.resolutionSource, "cruise_line_alias_resolver");

  // Step 3: Explicitly sourced dated ship/operator registry ONLY when exactly one assignment is effective on sailDate
  const step3Unambiguous = resolveDccPhysicalSailingIdentity({
    shipSlug: "royal-princess",
    sailDate: "2027-06-10",
    verifiedSailingCruiseLine: null,
    cruiseLineInput: null,
    datedShipRegistryOverride: [
      {
        shipSlug: "royal-princess",
        canonicalLineCode: "pcl",
        sourceUrl: "https://www.princess.com/ships-and-experience/ships/rp-royal-princess",
        verifiedAtIso: "2026-11-17T00:00:00Z",
        effectiveFromIsoDate: "2013-06-16",
        effectiveThroughIsoDate: null,
      },
    ],
    isSyntheticTest: true,
  });
  // Crucial proof: "royal-princess" resolves to "pcl" from sourced dated registry, NEVER "rccl" from "royal-" prefix
  assert.equal(step3Unambiguous.physicalSailingId, "sailing:pcl:royal-princess:2027-06-10");
  assert.equal(step3Unambiguous.resolutionSource, "dated_ship_operator_registry");

  // Step 3 rejects debutYear/unsourced entries and NEVER infers operator history from current brand or debutYear
  const noDebutYearInference = resolveDccPhysicalSailingIdentity({
    shipSlug: "adventure-of-the-seas",
    sailDate: "2028-04-12",
    verifiedSailingCruiseLine: null,
    cruiseLineInput: null,
    isSyntheticTest: true,
  });
  assert.equal(noDebutYearInference.physicalSailingId, null);
  assert.equal(noDebutYearInference.resolutionSource, "unresolved");
  assert.ok(noDebutYearInference.verificationFindingId?.includes("unrecognized_or_missing_line_code"));

  // Step 3 ambiguous multi-operator date window -> falls through to Step 4 null + verification finding
  const step3Ambiguous = resolveDccPhysicalSailingIdentity({
    shipSlug: "transferred-ocean-ship",
    sailDate: "2027-05-01",
    verifiedSailingCruiseLine: null,
    cruiseLineInput: null,
    datedShipRegistryOverride: [
      {
        shipSlug: "transferred-ocean-ship",
        canonicalLineCode: "cel",
        sourceUrl: "https://www.celebritycruises.com/cruise-ships",
        verifiedAtIso: "2026-11-17T00:00:00Z",
        effectiveFromIsoDate: "2020-01-01",
        effectiveThroughIsoDate: "2027-12-31",
      },
      {
        shipSlug: "transferred-ocean-ship",
        canonicalLineCode: "tui",
        sourceUrl: "https://www.meinschiff.com/",
        verifiedAtIso: "2026-11-17T00:00:00Z",
        effectiveFromIsoDate: "2027-01-01",
        effectiveThroughIsoDate: null,
      },
    ],
    isSyntheticTest: true,
  });
  assert.equal(step3Ambiguous.physicalSailingId, null);
  assert.equal(step3Ambiguous.resolutionSource, "unresolved");
  assert.ok(step3Ambiguous.verificationFindingId?.includes("ambiguous_dated_ship_operator"));

  // Step 4: Unresolved vessel whose shipSlug starts with "carnival-" must NOT guess "ccl" from ship name alone!
  const step4Unresolved = resolvePhysicalSailingIdStrict({
    shipSlug: "carnival-named-unverified-yacht",
    sailDate: "2027-08-19",
    verifiedSailingCruiseLine: null,
    cruiseLineInput: "Unverified Private Charter LLC",
    datedShipRegistry: [],
    isSyntheticTest: true,
    onUnresolvedFinding: () => "vf_test_unresolved_1",
  });
  assert.equal(step4Unresolved.physicalSailingId, null);
  assert.equal(step4Unresolved.lineCode, null);
  assert.equal(step4Unresolved.resolutionSource, "unresolved");
  assert.equal(step4Unresolved.verificationFindingId, "vf_test_unresolved_1");

  const findings = listDccFactVerificationQueue({ includeSyntheticTest: true });
  assert.ok(
    findings.some(
      (f) =>
        f.verificationId === step3Ambiguous.verificationFindingId &&
        f.entityType === "physical_sailing" &&
        f.state === "needs_review",
    ),
  );
  // Synthetic findings never pollute the production verification queue
  const prodFindings = listDccFactVerificationQueue({ includeSyntheticTest: false });
  assert.equal(
    prodFindings.some((f) => f.verificationId === step3Ambiguous.verificationFindingId),
    false,
  );
});

test("Track 1A DCC 2: Co-hosted departures share physicalSailingId while retaining distinct hostedSailingId & communityId", () => {
  const snap = getDccCanonicalHostedCatalogSnapshot({});
  const symphonyCoSailings = snap.hostedSailings.filter(
    (s) => s.physicalSailingId === "sailing:rccl:symphony-of-the-seas:2027-01-31",
  );
  assert.ok(symphonyCoSailings.length >= 2, "Expected >= 2 co-sailings on Symphony of the Seas 2027-01-31");

  const arno = symphonyCoSailings.find((s) => s.organizerSlug === "arnos-bear-cruises");
  const rgv = symphonyCoSailings.find((s) => s.organizerSlug === "welcome-home-rgv");
  assert.ok(arno);
  assert.ok(rgv);

  assert.equal(arno.physicalSailingId, "sailing:rccl:symphony-of-the-seas:2027-01-31");
  assert.equal(rgv.physicalSailingId, "sailing:rccl:symphony-of-the-seas:2027-01-31");
  assert.notEqual(arno.hostedSailingId, rgv.hostedSailingId);
  assert.equal(
    arno.hostedSailingId,
    buildHostedSailingId("arnos-bear-cruises", "rccl", "symphony-of-the-seas", "2027-01-31"),
  );
  assert.equal(
    rgv.hostedSailingId,
    buildHostedSailingId("welcome-home-rgv", "rccl", "symphony-of-the-seas", "2027-01-31"),
  );
  assert.notEqual(arno.communityId, rgv.communityId);
  assert.equal(
    arno.communityId,
    buildPrivateCommunityId("arnos-bear-cruises", "symphony-of-the-seas", "2027-01-31"),
  );

  const legacyPlanRef = buildTravelerPlanReference({
    lineInput: "rccl",
    shipSlug: "symphony-of-the-seas",
    sailDate: "2027-01-31",
    organizerSlug: "arnos-bear-cruises",
  });
  assert.deepEqual(legacyPlanRef, {
    sailingId: "sailing:rccl:symphony-of-the-seas:2027-01-31",
    hostedSailingId: arno.hostedSailingId,
    communityId: arno.communityId,
  });

  const expandedPlanRef = buildTravelerPlanReference({
    lineInput: "rccl",
    shipSlug: "symphony-of-the-seas",
    sailDate: "2027-01-31",
    organizerSlug: "arnos-bear-cruises",
    includePhysicalSailingId: true,
  });
  assert.equal(
    expandedPlanRef.physicalSailingId,
    buildPhysicalSailingId("rccl", "symphony-of-the-seas", "2027-01-31"),
  );
  assert.equal(expandedPlanRef.sailingId, expandedPlanRef.physicalSailingId);
  assert.equal(expandedPlanRef.hostedSailingId, arno.hostedSailingId);
  assert.equal(expandedPlanRef.communityId, arno.communityId);
});

test("Track 1A DCC 3: Signed payload & strong RFC 8785 ETag compatibility on /api/v1/cruises/hosted-catalog", async () => {
  // Legacy object projection without optional fields remains byte-for-byte canonical-equivalent
  const legacyObj = {
    hostedSailingId: "hosted-sailing:arnos-bear-cruises:rccl:symphony-of-the-seas:2027-01-31",
    physicalSailingId: "sailing:rccl:symphony-of-the-seas:2027-01-31",
    sailingSlug: "symphony-of-the-seas-2027-01-31",
  };
  const omittedOptionalObj = {
    hostedSailingId: "hosted-sailing:arnos-bear-cruises:rccl:symphony-of-the-seas:2027-01-31",
    physicalSailingId: "sailing:rccl:symphony-of-the-seas:2027-01-31",
    sailingSlug: "symphony-of-the-seas-2027-01-31",
    ...(undefined ? { communityId: "unused" } : {}),
  };
  assert.equal(rfc8785Canonicalize(legacyObj), rfc8785Canonicalize(omittedOptionalObj));

  // Expanded representation produces a distinct ETag and returns 304 ONLY for the matching ETag
  const expandedObj = {
    ...legacyObj,
    communityId: "community:arnos-bear-cruises:symphony-of-the-seas:2027-01-31",
  };
  const legacyEtag = computeStrongRfc8785Etag(legacyObj).etag;
  const expandedEtag = computeStrongRfc8785Etag(expandedObj).etag;
  assert.notEqual(legacyEtag, expandedEtag);

  const req1 = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog?organizer=arnos-bear-cruises",
  );
  const res1 = await getHostedCatalog(req1);
  assert.equal(res1.status, 200);
  const etag1 = res1.headers.get("etag");
  assert.ok(etag1);
  const body1 = await res1.json();
  assert.equal(body1.snapshot.contractVersion, "2026-11-15.v1");
  assert.equal(
    body1.snapshot.hostedSailings[0].physicalSailingId,
    "sailing:rccl:symphony-of-the-seas:2027-01-31",
  );
  assert.equal(
    body1.snapshot.hostedSailings[0].communityId,
    "community:arnos-bear-cruises:symphony-of-the-seas:2027-01-31",
  );

  // Matching ETag -> 304 Not Modified
  const reqMatch = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog?organizer=arnos-bear-cruises",
    { headers: { "If-None-Match": etag1 } },
  );
  const resMatch = await getHostedCatalog(reqMatch);
  assert.equal(resMatch.status, 304);

  // Stale/different ETag -> 200 OK with fresh ETag (never reuses stale ETag)
  const reqStale = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog?organizer=arnos-bear-cruises",
    { headers: { "If-None-Match": legacyEtag } },
  );
  const resStale = await getHostedCatalog(reqStale);
  assert.equal(resStale.status, 200);
  assert.equal(resStale.headers.get("etag"), etag1);

  // Signed JWS envelope verifies cleanly for expanded snapshot
  const snap = getDccCanonicalHostedCatalogSnapshot({ organizerSlug: "arnos-bear-cruises" });
  const signedEnv = await getSignedHostedCatalogSnapshotEnvelope(snap);
  assert.ok(signedEnv.jwsCompact);
  if (signedEnv.alg === "EdDSA" && signedEnv.publicKeyJwk) {
    const verified = jwsCompactVerifyEdDsa(signedEnv.jwsCompact, signedEnv.publicKeyJwk);
    assert.equal(verified.valid, true);
  }
});
