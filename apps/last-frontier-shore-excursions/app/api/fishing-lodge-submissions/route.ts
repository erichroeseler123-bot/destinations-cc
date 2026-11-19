import { NextResponse } from "next/server";
import {
  escapeHtml,
  forwardSpecialistInquiryToDcc,
  sendResendEmailSafe,
} from "../../../../../lib/dcc/shared/specialistInquiryClient";
import { assessOperatorClaimAndIntegrationSubmission } from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import { findPublishedSoutheastAlaskaFishingLodgeBySlug } from "../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesData";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECRET_LIKE_PATTERN =
  /\b(sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|rk_live_[A-Za-z0-9]+|Bearer\s+[A-Za-z0-9._-]{12,}|api[_-]?secret|private[_-]?key)\b/i;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON payload." },
        { status: 400 },
      );
    }

    // Honeypot anti-bot field
    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid submission." },
        { status: 400 },
      );
    }

    const submissionType =
      body.submissionType === "lodge_profile_claim"
        ? "lodge_profile_claim"
        : body.submissionType === "factual_correction"
          ? "factual_correction"
          : null;

    if (!submissionType) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'submissionType must be "factual_correction" or "lodge_profile_claim".',
        },
        { status: 400 },
      );
    }

    const lodgeSlug = String(body.lodgeSlug || "")
      .trim()
      .toLowerCase();
    if (!lodgeSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing lodgeSlug." },
        { status: 400 },
      );
    }

    const found = findPublishedSoutheastAlaskaFishingLodgeBySlug(lodgeSlug);
    if (!found) {
      return NextResponse.json(
        { ok: false, error: "Published lodge fact sheet not found." },
        { status: 404 },
      );
    }
    const { lodge } = found;

    const contactName = String(body.contactName || "").trim().slice(0, 120);
    const emailRaw = String(body.email || "")
      .trim()
      .toLowerCase()
      .slice(0, 160);
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 40)
        : null;
    const roleOrRelationship = String(
      body.roleTitle || body.relationship || "Public Contributor",
    )
      .trim()
      .slice(0, 120);
    const targetSectionOrClaimId = String(body.targetClaimScope || "general")
      .trim()
      .slice(0, 120);
    const evidenceUrl =
      typeof body.evidenceUrl === "string" && body.evidenceUrl.trim()
        ? body.evidenceUrl.trim().slice(0, 320)
        : null;
    const details = String(body.details || body.notes || "")
      .trim()
      .slice(0, 1600);

    if (SECRET_LIKE_PATTERN.test(`${details} ${evidenceUrl || ""}`)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Do not include raw secret API keys or tokens in public forms.",
        },
        { status: 400 },
      );
    }

    if (contactName.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please enter your name (at least 2 characters)." },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(emailRaw)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }
    if (submissionType === "factual_correction" && details.length < 10) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Please describe the specific fact to correct (at least 10 characters) and include an official source link if available.",
        },
        { status: 400 },
      );
    }

    const host = (
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      ""
    ).toLowerCase();
    const isPreviewRuntime =
      process.env.VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "development" ||
      host.includes(".vercel.app") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1");

    const isTest = Boolean(
      isPreviewRuntime ||
        body.isTest === true ||
        /\[test\]/i.test(contactName) ||
        /\[test\]/i.test(details),
    );

    const prefix =
      submissionType === "lodge_profile_claim" ? "LFSE-LCLAIM" : "LFSE-LCORR";
    const submissionId = `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const sourcePage = `/southeast-alaska/fishing-lodges/${lodge.slug}`;

    const toEmail =
      (
        process.env.LFSE_CONCIERGE_TO_EMAIL ||
        process.env.EARTHOS_APPROVAL_TO ||
        ""
      ).trim() || null;
    const fromEmail =
      (
        process.env.LFSE_CONCIERGE_FROM_EMAIL ||
        process.env.RESEND_FROM_EMAIL ||
        ""
      ).trim() || null;

    // Evaluate identity match separately from factual verification!
    const identityAssessment =
      submissionType === "lodge_profile_claim"
        ? assessOperatorClaimAndIntegrationSubmission({
            operator: {
              operatorId: lodge.operatingCompany.operatorId,
              name: lodge.operatingCompany.legalOrDisplayName,
              officialEmailDomain: lodge.operatingCompany.officialEmailDomain,
              officialWebsite: lodge.operatingCompany.officialWebsite,
              officialPhone: lodge.operatingCompany.officialPhone,
            },
            claimantEmail: emailRaw,
            claimantPhone: phone,
            requestedDirectIntegration: false,
          })
        : null;

    // 1. Write-ahead durable submission to DCC Operator/Steward Inbox BEFORE optional email
    const ingestResult = await forwardSpecialistInquiryToDcc({
      channel: "lastfrontiershoreexcursions-inquiry",
      submissionId,
      name: `${contactName} (${roleOrRelationship} — ${lodge.displayName})`,
      email: emailRaw,
      phone,
      tourType:
        submissionType === "lodge_profile_claim"
          ? "fishing_lodge_profile_claim"
          : "fishing_lodge_fact_correction",
      bookingMode:
        submissionType === "lodge_profile_claim"
          ? "free_lodge_identity_claim_facts_quarantined"
          : "quarantined_fact_correction_pending_steward_review",
      notes: [
        `[${submissionType === "lodge_profile_claim" ? "Free Lodge Listing Claim" : "Lodge Fact Correction"}]`,
        `Lodge: ${lodge.displayName} (${lodge.lodgeId})`,
        `Operator: ${lodge.operatingCompany.legalOrDisplayName} (${lodge.operatingCompany.operatorId})`,
        `Scope: ${targetSectionOrClaimId}`,
        evidenceUrl ? `Evidence URL: ${evidenceUrl}` : null,
        identityAssessment
          ? `Identity Check: ${identityAssessment.verificationMethod} (${identityAssessment.resultingClaimState})`
          : null,
        "Fact Verification Rule: Submitted facts remain quarantined until steward primary-source review.",
        details || null,
      ]
        .filter(Boolean)
        .join(" | "),
      sourcePage,
      sourcePath: sourcePage,
      intendedDestination:
        toEmail || "concierge@lastfrontiershoreexcursions.com",
      isTest,
      extraMetadata: {
        actionType: submissionType,
        lodgeId: lodge.lodgeId,
        lodgeSlug: lodge.slug,
        lodgeName: lodge.displayName,
        operatorId: lodge.operatingCompany.operatorId,
        roleOrRelationship,
        targetSectionOrClaimId,
        evidenceUrl,
        identityVerificationState: identityAssessment
          ? identityAssessment.resultingClaimState
          : "not_applicable_correction_only",
        identityVerificationMethod: identityAssessment
          ? identityAssessment.verificationMethod
          : null,
        submittedFactsVerificationState:
          "quarantined_pending_steward_evidence_review",
        autoPublishesSubmittedFacts: false,
      },
    });

    // 2. Optional notification (STRICTLY SUPPRESSED in Preview / localhost / isTest!)
    const emailResult = await sendResendEmailSafe({
      from: fromEmail,
      to: toEmail,
      replyTo: emailRaw,
      suppressForTest: isTest,
      subject: `${isTest ? "[TEST] " : ""}[LFSE Lodge ${submissionType === "lodge_profile_claim" ? "Claim" : "Correction"}] ${lodge.displayName}`,
      html: `
        <h2>Southeast Alaska Fishing Lodge ${submissionType === "lodge_profile_claim" ? "Free Listing Claim" : "Suggested Update"}</h2>
        <p><strong>Submission ID:</strong> ${escapeHtml(submissionId)}</p>
        <p><strong>Lodge:</strong> ${escapeHtml(lodge.displayName)} (${escapeHtml(lodge.lodgeId)})</p>
        <p><strong>Submitter:</strong> ${escapeHtml(contactName)} (${escapeHtml(roleOrRelationship)})</p>
        <p><strong>Email:</strong> ${escapeHtml(emailRaw)}</p>
        <p><strong>Scope:</strong> ${escapeHtml(targetSectionOrClaimId)}</p>
        <p><strong>Evidence URL:</strong> ${escapeHtml(evidenceUrl || "None provided")}</p>
        <p><strong>Details:</strong><br/>${escapeHtml(details || "None")}</p>
      `,
    });

    return NextResponse.json(
      {
        ok: true,
        submissionId,
        submissionType,
        lodgeId: lodge.lodgeId,
        lodgeSlug: lodge.slug,
        isTest,
        emailSent: emailResult.emailSent,
        emailNotificationStatus: emailResult.notificationStatus,
        emailSuppressedForTest: emailResult.notificationStatus === "suppressed_test",
        durableForwarded: ingestResult.ok,
        durableFindingId: ingestResult.findingId ?? null,
        identityVerificationState: identityAssessment
          ? identityAssessment.resultingClaimState
          : "not_applicable_correction_only",
        identityVerificationMethod: identityAssessment
          ? identityAssessment.verificationMethod
          : null,
        identitySummary: identityAssessment ? identityAssessment.summary : null,
        submittedFactsVerificationState:
          "quarantined_pending_steward_evidence_review",
        autoPublishesSubmittedFacts: false,
        message:
          submissionType === "lodge_profile_claim"
            ? `Free listing claim received (${submissionId}) for ${lodge.displayName}. Claiming confirms your business contact; any updates are checked against published sources before appearing on the page.`
            : `Suggested update received (${submissionId}) for ${lodge.displayName}. Our team will check the source before updating the listing.`,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to record lodge submission right now." },
      { status: 500 },
    );
  }
}
