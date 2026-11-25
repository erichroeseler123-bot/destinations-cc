import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "next/dist/compiled/node-html-parser";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HostedCruisesAdminClient from "@/app/admin/hosted-cruises/HostedCruisesAdminClient";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue } from "@/lib/adminAccess";
import {
  GET as hostedAdminGet,
  POST as hostedAdminPost,
} from "@/app/api/admin/hosted-cruises/route";
import {
  resolveCruisePromenadeAdminTarget,
  type HostedCruisesAdminBridgeSnapshot,
} from "@/lib/dcc/hostedCruisesAdminBridge";

const emptySnapshot: HostedCruisesAdminBridgeSnapshot = {
  generatedAt: new Date().toISOString(),
  environment: "preview",
  health: {
    cpStorageReady: true,
    dccServiceSecretConfigured: true,
    rollCallBridgeSecretConfigured: true,
    rollCallOps: {
      reachable: true,
      allAutomatedChecksGreen: true,
      databaseReady: true,
      bridgeSigningConfigured: true,
      emailProviderEnabled: true,
      resendApiKeyConfigured: true,
      emailFromConfigured: true,
      emailFromDomain: "rollcallusa.com",
      liveEmailDeliveryReady: true,
    },
  },
  organizers: [],
  sailings: [],
  claims: [],
  opsFailures: [],
};

test("113a. /api/admin/hosted-cruises fails closed with 401 and noindex/no-store headers when unauthenticated", async () => {
  process.env.ADMIN_ACCESS_KEY = "test-admin-secret-hosted-113";

  const unauthGet = await hostedAdminGet(
    new Request("https://destinationcommandcenter.com/api/admin/hosted-cruises"),
  );
  assert.equal(unauthGet.status, 401);
  assert.match(unauthGet.headers.get("cache-control") || "", /no-store/i);
  assert.match(unauthGet.headers.get("x-robots-tag") || "", /noindex/i);

  const unauthPost = await hostedAdminPost(
    new Request("https://destinationcommandcenter.com/api/admin/hosted-cruises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_ops_failures" }),
    }),
  );
  assert.equal(unauthPost.status, 401);
});

test("113b. resolveCruisePromenadeAdminTarget locks production to cruisepromenade.com and rejects unapproved preview hosts", () => {
  const prevEnv = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = "production";
    const prodResolved = resolveCruisePromenadeAdminTarget({
      cpBaseUrlOverride: "https://evil.example.com",
      rollcallBaseUrlOverride: "https://evil.example.com",
    });
    assert.equal(prodResolved.cpBaseUrl, "https://cruisepromenade.com");
    assert.equal(prodResolved.rollcallBaseUrlOverride, null);

    process.env.VERCEL_ENV = "preview";
    const evilPreview = resolveCruisePromenadeAdminTarget({
      cpBaseUrlOverride: "https://evil.example.com",
    });
    assert.match(evilPreview.cpBaseUrl, /cruisepromenade.*\.vercel\.app$/);

    const validPreview = resolveCruisePromenadeAdminTarget({
      cpBaseUrlOverride: "https://cruisepromenade-gttmt0yzj-erichroeseler123-bots-projects.vercel.app/",
    });
    assert.equal(
      validPreview.cpBaseUrl,
      "https://cruisepromenade-gttmt0yzj-erichroeseler123-bots-projects.vercel.app",
    );
  } finally {
    if (prevEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = prevEnv;
    }
  }
});

test("113c. Authenticated /api/admin/hosted-cruises GET & POST forward x-dcc-cp-service-secret to Cruise Promenade", async () => {
  process.env.ADMIN_ACCESS_KEY = "test-admin-secret-hosted-113";
  process.env.DCC_CP_SERVICE_SECRET = "test-dcc-cp-service-secret-113";
  process.env.VERCEL_ENV = "preview";

  const sessionToken = buildAdminSessionValue();
  const capturedCalls: Array<{ url: string; method: string; serviceSecret: string | null }> = [];

  let forwardedBody: unknown;
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const headers = new Headers(init?.headers);
    if (init?.body) forwardedBody = JSON.parse(String(init.body));
    capturedCalls.push({
      url: urlStr,
      method: init?.method || "GET",
      serviceSecret: headers.get("x-dcc-cp-service-secret"),
    });
    return new Response(
      JSON.stringify({
        ok: true,
        snapshot: emptySnapshot,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const getRes = await hostedAdminGet(
      new Request("https://destinationcommandcenter.com/api/admin/hosted-cruises", {
        headers: { Cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}` },
      }),
    );
    assert.equal(getRes.status, 200);
    const getData = (await getRes.json()) as { ok: boolean };
    assert.equal(getData.ok, true);

    const approval = {
      action: "review_claim",
      claimId: "hclm_test123",
      ownerAction: "verify_and_approve",
      ownerConfirmedIdentity: true,
    };
    const postRes = await hostedAdminPost(
      new Request("https://destinationcommandcenter.com/api/admin/hosted-cruises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}`,
        },
        body: JSON.stringify(approval),
      }),
    );
    assert.equal(postRes.status, 200);
    assert.deepEqual(forwardedBody, {
      ...approval,
      rollcallBaseUrlOverride: resolveCruisePromenadeAdminTarget().rollcallBaseUrlOverride,
    });

    assert.equal(capturedCalls.length, 2);
    assert.equal(capturedCalls[0]?.serviceSecret, "test-dcc-cp-service-secret-113");
    assert.equal(capturedCalls[1]?.serviceSecret, "test-dcc-cp-service-secret-113");
    assert.match(capturedCalls[0]?.url || "", /\/api\/v2\/hosted-cruises\/admin/);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("113d. Each pending claim needs its own explicit owner confirmation", () => {
  const organizers: HostedCruisesAdminBridgeSnapshot["organizers"] = [
    { organizerName: "Coast Cruises", organizerSlug: "coast" },
    { organizerName: "Bay Cruises", organizerSlug: "bay" },
  ].map((organizer) => ({
    ...organizer,
    claimedStatus: "pending_verification",
    officialDomain: `${organizer.organizerSlug}.example`,
    officialWebsiteUrl: `https://${organizer.organizerSlug}.example`,
    publicSummary: "",
  }));
  const claims: HostedCruisesAdminBridgeSnapshot["claims"] = organizers.map((organizer) => ({
    claimId: `claim-${organizer.organizerSlug}`,
    organizerSlug: organizer.organizerSlug,
    claimantName: `Host for ${organizer.organizerSlug}`,
    claimantRole: "Organizer",
    claimantEmailDomain: organizer.officialDomain,
    claimantEmailRedacted: `h***@${organizer.officialDomain}`,
    domainMatchesOfficial: true,
    status: "pending_verification",
    sailingSlug: null,
    verificationNote: "",
    createdAt: emptySnapshot.generatedAt,
    updatedAt: emptySnapshot.generatedAt,
  }));
  const html = renderToStaticMarkup(createElement(HostedCruisesAdminClient, {
    initialBridge: {
      ok: true,
      cpBaseUrl: "https://cp.example",
      dccServiceSecretPresent: true,
      snapshot: { ...emptySnapshot, organizers, claims },
    },
  }));

  const document = parse(html);
  assert.match(document.querySelector("#organizer-profile-heading")?.text ?? "", /Coast Cruises/);
  for (const [index, claim] of claims.entries()) {
    const card = document.querySelector(`[data-testid="dcc-claim-card-${claim.claimId}"]`);
    const checkbox = card?.querySelector(`[data-testid="dcc-claim-identity-${claim.claimId}"]`);
    assert.equal(checkbox?.getAttribute("type"), "checkbox");
    assert.equal(checkbox.hasAttribute("checked"), false);
    const label = checkbox.closest("label").text;
    assert.ok(label.includes(claim.claimantName));
    assert.ok(label.includes(organizers[index].organizerName));
    const approve = card.querySelector(`[data-testid="dcc-claim-approve-btn-${claim.claimId}"]`);
    const reject = card.querySelector(`[data-testid="dcc-claim-reject-btn-${claim.claimId}"]`);
    assert.equal(approve?.hasAttribute("disabled"), true);
    assert.equal(reject?.hasAttribute("disabled"), false);
  }
});
