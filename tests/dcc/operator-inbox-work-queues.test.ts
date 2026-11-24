import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOperatorTriageFindingId,
  getUnifiedOperatorInbox,
  normalizeInquiryNotificationStatus,
  type RawFindingRowInput,
} from "@/lib/dcc/operatorInbox";

const channel = "saveonthestrip-help-request";

function inquiry(id: string, metadata: Record<string, unknown> = {}): RawFindingRowInput {
  return {
    finding_id: `control-map:transactional-submission:production:${channel}:${id}`,
    created_at: "2026-11-22T10:00:00Z",
    metadata: {
      submissionId: id,
      email: `${id}@family-mail.test`,
      message: "Could you help arrange a tour for our family?",
      ...metadata,
    },
  };
}

function triage(id: string, status: string, updatedAt = "2026-11-23T12:00:00Z"): RawFindingRowInput {
  const itemKey = `dcc:${channel}:${id}`;
  return {
    finding_id: buildOperatorTriageFindingId(itemKey),
    metadata: { itemKey, triageStatus: status, updatedAt },
  };
}

const findings: RawFindingRowInput[] = [
  inquiry("blocked", { notificationStatus: "sent", createdAt: "2026-11-01T09:00:00Z" }),
  inquiry("provider-down", { notificationStatus: "failed", emailReason: "resend_http_503" }),
  inquiry("missing-config", { notificationStatus: "not_configured", emailSent: false }),
  inquiry("legacy"),
  inquiry("already-called", { notificationStatus: "sent" }),
  inquiry("closed", { notificationStatus: "sent" }),
  inquiry("probe-failure", { isTest: true, notificationStatus: "failed" }),
  {
    finding_id: "control-map:factual-error-report:production:deliberate-skip",
    metadata: {
      reportId: "deliberate-skip",
      contactInfo: "qa@family-mail.test",
      explanation: "End-to-end live production verification of durable factual-error reporting.",
      isTest: true,
      notificationStatus: "skipped_disabled",
    },
  },
  triage("blocked", "booking_blocked"),
  triage("already-called", "contacted"),
  triage("closed", "archived"),
];

function inbox(view: string, rows = findings) {
  return getUnifiedOperatorInbox({
    view,
    findingsOverride: rows,
    argoLegacyOverride: [],
    cpAdminKey: "local-fixture",
    cpFetchOverride: async () => Response.json({ inquiries: [] }),
  });
}

test("reply queue follows customer triage independently of the saved alert result", async () => {
  const replies = await inbox("customer_replies");
  assert.equal(replies.items[0]?.sourceId, "blocked");
  assert.equal(replies.items[0].customerReplyPriority, "booking_blocked");
  assert.deepEqual(replies.items.map((item) => item.sourceId).sort(), [
    "blocked", "legacy", "missing-config", "provider-down",
  ]);
  assert.equal(replies.kpis.customerRepliesNeededCount, replies.items.length);

  const resolved = await inbox("customer_replies", [
    ...findings, triage("blocked", "resolved", "2026-11-24T12:00:00Z"),
  ]);
  assert.equal(resolved.kpis.customerRepliesNeededCount, 3);
  assert.ok(!resolved.items.some((item) => item.sourceId === "blocked"));
});

test("counts and drill-downs separate failed deliveries, missing setup and deliberate skips", async () => {
  const failed = await inbox("notification_failures");
  assert.deepEqual(failed.items.map((item) => item.sourceId), ["provider-down"]);
  assert.equal(failed.kpis.deliveryFailureCount, failed.totalMatchingCount);

  const setup = await inbox("notification_configuration");
  assert.deepEqual(setup.items.map((item) => item.sourceId), ["missing-config"]);
  assert.equal(setup.kpis.notificationConfigurationCount, setup.totalMatchingCount);

  const skipped = await inbox("skipped_notifications");
  assert.deepEqual(skipped.items.map((item) => item.sourceId), ["deliberate-skip"]);
  assert.equal(skipped.items[0].notificationStatus, "intentionally_skipped");
  assert.equal(skipped.kpis.intentionallySkippedCount, skipped.totalMatchingCount);

  const audit = await inbox("all");
  assert.equal(audit.kpis.totalStoredCount, 8);
  assert.equal(audit.items.length, 8);
  assert.equal(audit.items.find((item) => item.sourceId === "probe-failure")?.notificationStatus, "failed");
});

test("a customer's stated booking blocker comes first even when their staff alert was disabled", async () => {
  const rows = [
    inquiry("blocked-by-link", {
      createdAt: "2026-11-01T09:00:00Z",
      message: "The booking link does not work. Can you help?",
      notificationStatus: "skipped_disabled",
    }),
    inquiry("price-question", { message: "What is the price for two adults?" }),
  ];
  const replies = await inbox("customer_replies", rows);
  assert.deepEqual(replies.items.map((item) => [item.sourceId, item.customerReplyPriority]), [
    ["blocked-by-link", "booking_blocked"],
    ["price-question", "needs_reply"],
  ]);
  assert.equal(replies.kpis.deliveryFailureCount, 0);
  assert.equal(replies.kpis.intentionallySkippedCount, 1);
});

test("today's mail configuration cannot establish a past submission's delivery result", () => {
  for (const resendConfigured of [true, false]) {
    const status = (metadata: Record<string, unknown>) =>
      normalizeInquiryNotificationStatus(channel, metadata, resendConfigured).notificationStatus;
    assert.equal(status({}), "unknown");
    assert.equal(status({ emailSent: false, emailReason: "suppressed_test_submission" }), "intentionally_skipped");
    assert.equal(status({ emailSent: false, emailReason: "missing_email_config" }), "not_configured");
  }
});

test("a closed waitlist entry stays out of replies even when an open forwarded copy remains", async () => {
  const swamp = "welcometotheswamp-inquiry";
  const forwarded = {
    finding_id: `control-map:transactional-submission:production:${swamp}:optout`,
    metadata: { submissionId: "optout", email: "guest@family-mail.test", notificationStatus: "failed" },
  };
  const result = await getUnifiedOperatorInbox({
    view: "all",
    findingsOverride: [forwarded],
    argoLegacyOverride: [],
    wtsWaitlistOverride: [{ id: "optout", email: "guest@family-mail.test", status: "unsubscribed" }],
    jfdWaitlistOverride: [{ id: "completed", email: "pilot@family-mail.test", status: "booking_confirmed" }],
    cpAdminKey: "local-fixture",
    cpFetchOverride: async () => Response.json({ inquiries: [] }),
  });
  assert.equal(result.kpis.totalStoredCount, 2);
  assert.equal(result.kpis.customerRepliesNeededCount, 0);
  assert.equal(result.kpis.deliveryFailureCount, 1);
  assert.ok(result.items.every((item) => item.triageStatus === "resolved"));
});
