import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import {
  POST as requestInvitePost,
  setRequestInviteResendFetchForTests,
} from "@/app/api/request-invite/route";
import {
  POST as somersetQuotePost,
  setSomersetQuoteResendFetchForTests,
} from "@/app/api/somerset/quote/route";
import {
  deleteFactualErrorReportByIdForTests,
  resetFactualErrorRateLimitsForTests,
  setFactualErrorResendSenderForTests,
  submitFactualErrorReport,
} from "@/lib/dcc/earthos/factualErrorReports";
import {
  brands,
  DEFAULT_DCC_OWNER_RECIPIENT,
  DEFAULT_DCC_SYSTEM_FROM,
  DEFAULT_SOMERSET_DISPATCH_TO,
  DEFAULT_SOMERSET_FROM,
  DEFAULT_WNO_FROM,
  DEFAULT_WNO_REPLY_TO,
  isDeliverableMxRecipientAddress,
  isVerifiedResendSenderAddress,
  resolveSafeDccOwnerRecipients,
  resolveSafeDccReplyTo,
  resolveSafeDccSystemFrom,
  resolveSafeSomersetFrom,
  resolveSafeSomersetRecipients,
  resolveSafeWnoFrom,
  resolveSafeWnoReplyTo,
} from "@/lib/mailer/brands";
import {
  parseEmailList,
  sendMissionNotification,
  setSendMissionResendFactoryForTests,
} from "@/lib/mailer/send";
import { DccMissionApprovalEmail } from "@/lib/mailer/templates/dccMissionApproval";
import {
  sendDailyBriefs,
  setWnoDailyBriefOverridesForTests,
} from "@/lib/wno/dailyBrief";

type EnvBackup = Record<string, string | undefined>;

function saveEnv(keys: string[]): EnvBackup {
  const snapshot: EnvBackup = {};
  for (const key of keys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot: EnvBackup): void {
  for (const [key, val] of Object.entries(snapshot)) {
    if (val === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = val;
    }
  }
}

const MAILER_ENV_KEYS = [
  "DCC_RESEND_API_KEY",
  "RESEND_API_KEY",
  "MAIL_FROM_DCC",
  "MAIL_REPLY_TO_DCC",
  "EARTHOS_APPROVAL_TO",
  "EARTHOS_APPROVAL_CC",
  "EARTHOS_APPROVAL_BCC",
  "SOMERSET_FROM_EMAIL",
  "SOMERSET_DISPATCH_TO_EMAIL",
  "PARR_PRIVATE_FROM_EMAIL",
  "ARGO_FROM_EMAIL",
  "MAIL_FROM_WNO",
  "MAIL_REPLY_TO_WNO",
];

test("1. lib/mailer/brands.ts & lib/mailer/send.ts reject @destinations-cc.com (NXDOMAIN/403) and @destinationcommandcenter.com (0 MX) recipients while resolving verified DCC sender + live-MX owner mailbox", async () => {
  const backup = saveEnv(MAILER_ENV_KEYS);
  const capturedPayloads: Array<Record<string, unknown>> = [];

  try {
    assert.equal(isVerifiedResendSenderAddress("hello@destinations-cc.com"), false);
    assert.equal(
      isVerifiedResendSenderAddress("Shuttle <dispatch@shuttletosomersetamphitheater.com>"),
      false,
    );
    assert.equal(
      isVerifiedResendSenderAddress("Welcome <help@welcometoneworleanstours.com>"),
      false,
    );
    assert.equal(
      isVerifiedResendSenderAddress("DCC Ops <alerts@destinationcommandcenter.com>"),
      true,
    );

    assert.equal(isDeliverableMxRecipientAddress("admin@destinations-cc.com"), false);
    assert.equal(isDeliverableMxRecipientAddress("ops@destinationcommandcenter.com"), false);
    assert.equal(isDeliverableMxRecipientAddress("erichroeseler123@gmail.com"), true);
    assert.equal(isDeliverableMxRecipientAddress("hello@partyatredrocks.com"), true);
    assert.equal(isDeliverableMxRecipientAddress("help@welcometoneworleanstours.com"), true);

    // Simulate broken production Vercel env vars:
    // MAIL_FROM_DCC="hello@destinations-cc.com" (403 + NXDOMAIN)
    // EARTHOS_APPROVAL_TO="admin@destinations-cc.com" (NXDOMAIN)
    // MAIL_REPLY_TO_DCC="ops@destinationcommandcenter.com" (0 MX)
    process.env.DCC_RESEND_API_KEY = "re_test_dcc_verified_key_123456";
    process.env.MAIL_FROM_DCC = "hello@destinations-cc.com";
    process.env.MAIL_REPLY_TO_DCC = "ops@destinationcommandcenter.com";
    process.env.EARTHOS_APPROVAL_TO =
      "admin@destinations-cc.com, ops@destinationcommandcenter.com";
    process.env.EARTHOS_APPROVAL_CC =
      "cc@destinations-cc.com, alerts@juneauflightdeck.com";
    process.env.EARTHOS_APPROVAL_BCC = "bcc@destinationcommandcenter.com";

    assert.equal(brands.DCC.from, DEFAULT_DCC_SYSTEM_FROM);
    assert.equal(brands.DCC.replyTo, DEFAULT_DCC_OWNER_RECIPIENT);
    assert.equal(resolveSafeDccSystemFrom(process.env), DEFAULT_DCC_SYSTEM_FROM);
    assert.equal(resolveSafeDccReplyTo(process.env), DEFAULT_DCC_OWNER_RECIPIENT);
    assert.deepEqual(resolveSafeDccOwnerRecipients(process.env), [
      DEFAULT_DCC_OWNER_RECIPIENT,
    ]);
    assert.deepEqual(
      parseEmailList("admin@destinations-cc.com, ops@destinationcommandcenter.com"),
      [],
    );

    setSendMissionResendFactoryForTests(() => ({
      source: "DCC_RESEND_API_KEY",
      resend: {
        emails: {
          send: async (payload: unknown) => {
            capturedPayloads.push(payload as Record<string, unknown>);
            return { data: { id: "msg_mission_001" }, error: null } as never;
          },
        } as never,
      },
    }));

    const result = await sendMissionNotification({
      missionId: "MSN-AUDIT-001",
      brandId: "DCC",
      template: DccMissionApprovalEmail,
      context: {
        missionId: "MSN-AUDIT-001",
        priorityLevel: "Watch",
        decisionCorridor: "juneau",
        decisionAction: "verify_sender_recipient",
        approveUrl: "https://www.destinationcommandcenter.com/approve",
        rejectUrl: "https://www.destinationcommandcenter.com/reject",
        dccHandoffId: "dcc_ho_audit_1",
        timestamp: "2026-11-12T12:00:00.000Z",
      },
    });

    assert.equal(result.success, true);
    assert.equal(capturedPayloads.length, 1);
    assert.equal(capturedPayloads[0].from, DEFAULT_DCC_SYSTEM_FROM);
    assert.equal(capturedPayloads[0].replyTo, DEFAULT_DCC_OWNER_RECIPIENT);
    assert.deepEqual(capturedPayloads[0].to, [DEFAULT_DCC_OWNER_RECIPIENT]);
    assert.deepEqual(capturedPayloads[0].cc, ["alerts@juneauflightdeck.com"]);
    assert.equal(capturedPayloads[0].bcc, undefined);
  } finally {
    setSendMissionResendFactoryForTests(null);
    restoreEnv(backup);
  }
});

test("2. app/api/request-invite/route.ts rejects legacy @destinations-cc.com from/to and @partyatredrocks.com bleed, sending from DCC Ops <alerts@destinationcommandcenter.com> to live-MX owner recipient", async () => {
  const backup = saveEnv(MAILER_ENV_KEYS);
  const capturedBodies: Array<Record<string, unknown>> = [];

  try {
    process.env.DCC_RESEND_API_KEY = "re_test_dcc_invite_key_123456";
    process.env.MAIL_FROM_DCC = "hello@destinations-cc.com";
    process.env.PARR_PRIVATE_FROM_EMAIL =
      "Party at Red Rocks <bookings@partyatredrocks.com>";
    process.env.EARTHOS_APPROVAL_TO = "admin@destinations-cc.com";

    setRequestInviteResendFetchForTests(async (_input, init) => {
      const parsed = JSON.parse(String(init?.body || "{}")) as Record<
        string,
        unknown
      >;
      capturedBodies.push(parsed);
      return new Response(JSON.stringify({ id: "re_invite_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await requestInvitePost(
      new Request("https://www.destinationcommandcenter.com/api/request-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Jordan Mercer",
          email: "jordan.mercer@alaskacharters.org",
          phone: "907-555-0192",
          company: "Inside Passage Marine",
          notes: "Interested in Juneau direct operator invite.",
          isTest: true,
        }),
      }),
    );

    assert.equal(res.status, 200);
    const json = (await res.json()) as { ok: boolean; emailSent: boolean };
    assert.equal(json.ok, true);
    assert.equal(json.emailSent, true);
    assert.equal(capturedBodies.length, 1);

    const sent = capturedBodies[0];
    assert.equal(sent.from, DEFAULT_DCC_SYSTEM_FROM);
    assert.doesNotMatch(String(sent.from), /destinations-cc\.com|partyatredrocks\.com/i);
    assert.deepEqual(sent.to, [DEFAULT_DCC_OWNER_RECIPIENT]);
    assert.equal(sent.reply_to, "jordan.mercer@alaskacharters.org");
    assert.match(String(sent.text), /outbound-only system address; not a monitored reply mailbox/);
  } finally {
    setRequestInviteResendFetchForTests(null);
    restoreEnv(backup);
  }
});

test("3. app/api/somerset/quote/route.ts rejects unverified @shuttletosomersetamphitheater.com sender & NXDOMAIN/0-MX recipients, using verified Shuttle to Somerset sender + hello@partyatredrocks.com + DCC_RESEND_API_KEY", async () => {
  const backup = saveEnv(MAILER_ENV_KEYS);
  const capturedBodies: Array<Record<string, unknown>> = [];
  const capturedAuthHeaders: string[] = [];

  try {
    delete process.env.RESEND_API_KEY;
    process.env.DCC_RESEND_API_KEY = "re_test_dcc_somerset_key_998877";
    process.env.SOMERSET_FROM_EMAIL =
      "Shuttle to Somerset <dispatch@shuttletosomersetamphitheater.com>";
    process.env.SOMERSET_DISPATCH_TO_EMAIL = "ops@destinationcommandcenter.com";
    process.env.EARTHOS_APPROVAL_TO = "admin@destinations-cc.com";

    assert.equal(resolveSafeSomersetFrom(process.env), DEFAULT_SOMERSET_FROM);
    assert.deepEqual(resolveSafeSomersetRecipients(process.env), [
      DEFAULT_SOMERSET_DISPATCH_TO,
    ]);

    setSomersetQuoteResendFetchForTests(async (_input, init) => {
      const headers = new Headers(init?.headers);
      capturedAuthHeaders.push(headers.get("authorization") || "");
      const parsed = JSON.parse(String(init?.body || "{}")) as Record<
        string,
        unknown
      >;
      capturedBodies.push(parsed);
      return new Response(JSON.stringify({ id: "re_somerset_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await somersetQuotePost(
      new NextRequest("https://www.destinationcommandcenter.com/api/somerset/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Taylor Lindqvist",
          email: "taylor@twincitiesconcertgroup.org",
          phone: "612-555-0144",
          concertDate: "2027-07-24",
          artistOrEvent: "Hozier at Somerset Amphitheater",
          pickupCity: "Minneapolis",
          groupSize: 12,
          vehiclePreference: "van",
          notes: "Downtown hotel pickup for 12 guests.",
          isTest: true,
        }),
      }),
    );

    assert.equal(res.status, 200);
    const json = (await res.json()) as { ok: boolean; emailSent: boolean };
    assert.equal(json.ok, true);
    assert.equal(json.emailSent, true);
    assert.equal(capturedAuthHeaders[0], "Bearer re_test_dcc_somerset_key_998877");
    assert.equal(capturedBodies.length, 1);

    const sent = capturedBodies[0];
    assert.equal(sent.from, DEFAULT_SOMERSET_FROM);
    assert.doesNotMatch(String(sent.from), /shuttletosomersetamphitheater\.com|destinations-cc\.com/i);
    assert.deepEqual(sent.to, [DEFAULT_SOMERSET_DISPATCH_TO]);
    assert.equal(sent.reply_to, "taylor@twincitiesconcertgroup.org");
  } finally {
    setSomersetQuoteResendFetchForTests(null);
    restoreEnv(backup);
  }
});

test("4. lib/dcc/earthos/factualErrorReports.ts rejects legacy @destinations-cc.com from/to and @destinationcommandcenter.com 0-MX recipients while delivering to live-MX owner inbox", async () => {
  const backup = saveEnv(MAILER_ENV_KEYS);
  const capturedPayloads: Array<{
    from: string;
    to: string[];
    replyTo?: string;
    subject: string;
    text: string;
  }> = [];
  let createdReportId: string | null = null;

  try {
    resetFactualErrorRateLimitsForTests();
    process.env.DCC_RESEND_API_KEY = "re_test_dcc_fer_key_445566";
    process.env.MAIL_FROM_DCC = "hello@destinations-cc.com";
    process.env.EARTHOS_APPROVAL_TO =
      "admin@destinations-cc.com, ops@destinationcommandcenter.com";

    setFactualErrorResendSenderForTests(async (payload) => {
      capturedPayloads.push(payload);
      return { data: { id: "re_fer_001" }, error: null };
    });

    const submitRes = await submitFactualErrorReport({
      pagePath: "/juneau",
      nodeId: "juneau",
      citationId: "jun-tram-hours",
      disputedClaim: `Goldbelt Tram evening closing window (${Date.now()})`,
      explanation:
        "Observed seasonal September last-car-up posted 30 minutes earlier at the dock kiosk.",
      contactInfo: "reader@alaskatravelernotes.org",
      clientIp: "198.51.100.88",
      isTest: true,
      sendNotification: true,
    });

    assert.equal(submitRes.ok, true);
    if (submitRes.ok) {
      createdReportId = submitRes.report.reportId;
      assert.equal(submitRes.report.notificationStatus, "sent");
      assert.equal(submitRes.report.notificationMessageId, "re_fer_001");
    }

    assert.equal(capturedPayloads.length, 1);
    assert.equal(capturedPayloads[0].from, DEFAULT_DCC_SYSTEM_FROM);
    assert.deepEqual(capturedPayloads[0].to, [DEFAULT_DCC_OWNER_RECIPIENT]);
    assert.equal(capturedPayloads[0].replyTo, "reader@alaskatravelernotes.org");
    assert.match(
      capturedPayloads[0].text,
      /outbound-only system address; not a monitored reply mailbox/,
    );
  } finally {
    setFactualErrorResendSenderForTests(null);
    if (createdReportId) {
      await deleteFactualErrorReportByIdForTests(createdReportId);
    }
    restoreEnv(backup);
  }
});

test("5. lib/wno/dailyBrief.ts rejects unverified @welcometoneworleanstours.com / @destinations-cc.com senders and 0-MX @destinationcommandcenter.com replyTo or subscriber recipients", async () => {
  const backup = saveEnv(MAILER_ENV_KEYS);
  const capturedPayloads: Array<Record<string, unknown>> = [];

  try {
    // Unverified sender in MAIL_FROM_WNO + 0-MX replyTo in MAIL_REPLY_TO_WNO
    process.env.MAIL_FROM_WNO =
      "Welcome to New Orleans <help@welcometoneworleanstours.com>";
    process.env.MAIL_REPLY_TO_WNO = "updates@destinationcommandcenter.com";

    assert.equal(resolveSafeWnoFrom(process.env), DEFAULT_WNO_FROM);
    assert.equal(resolveSafeWnoReplyTo(process.env), DEFAULT_WNO_REPLY_TO);

    // Verified frenchquarterorientation.com sender IS permitted for WNO
    process.env.MAIL_FROM_WNO =
      "Welcome to New Orleans Tours <concierge@frenchquarterorientation.com>";
    assert.equal(
      resolveSafeWnoFrom(process.env),
      "Welcome to New Orleans Tours <concierge@frenchquarterorientation.com>",
    );

    // Broken @destinations-cc.com sender falls back to verified updates@destinationcommandcenter.com
    process.env.MAIL_FROM_WNO = "hello@destinations-cc.com";
    assert.equal(resolveSafeWnoFrom(process.env), DEFAULT_WNO_FROM);

    setWnoDailyBriefOverridesForTests({
      resendClient: {
        source: "DCC_RESEND_API_KEY",
        resend: {
          emails: {
            send: async (payload) => {
              capturedPayloads.push(payload);
              return { data: { id: "re_wno_brief_001" }, error: null };
            },
          },
        },
      },
      liveContext: async () => ({
        rainRisk: "low",
        outdoorFriendly: true,
        weather: {
          shortForecast: "Sunny and mild",
          maxTemperatureF: 78,
          precipitationChance: 10,
        },
        events: [],
        conciergePick: {
          slug: "french-quarter-walking",
          title: "French Quarter Orientation Walk",
          reason: "Clear morning weather for architectural walking.",
        },
      }),
      subscribers: async () => [
        { email: "guest@crescentcityvisitor.org", signupSource: "homepage" },
        { email: "ops@destinationcommandcenter.com", signupSource: "0mx_invalid" },
        { email: "admin@destinations-cc.com", signupSource: "nxdomain_invalid" },
      ],
      alreadySentToday: async () => false,
      recordSent: async () => {},
    });

    const briefResult = await sendDailyBriefs();
    assert.equal(briefResult.subscribers, 3);
    assert.equal(briefResult.sent, 1);
    assert.equal(briefResult.skipped, 2);
    assert.equal(briefResult.failed, 0);

    assert.equal(capturedPayloads.length, 1);
    assert.equal(capturedPayloads[0].from, DEFAULT_WNO_FROM);
    assert.equal(capturedPayloads[0].replyTo, DEFAULT_WNO_REPLY_TO);
    assert.equal(capturedPayloads[0].to, "guest@crescentcityvisitor.org");
  } finally {
    setWnoDailyBriefOverridesForTests(null);
    restoreEnv(backup);
  }
});
