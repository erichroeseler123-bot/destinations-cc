import { NextResponse } from "next/server";
import {
  escapeHtml,
  forwardSpecialistInquiryToDcc,
  sendResendEmailSafe,
} from "../../../../../lib/dcc/shared/specialistInquiryClient";
import { assessOperatorClaimAndIntegrationSubmission } from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import { findSoutheastAlaskaOperatorBySlugOrAlias } from "../../../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

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

    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid submission." },
        { status: 400 },
      );
    }

    const operatorSlug = String(
      body.operatorSlug || body.operatorId || "",
    )
      .trim()
      .replace(/^operator:/i, "");
    const contactName = String(body.contactName || "").trim().slice(0, 120);
    const roleTitle = String(body.roleTitle || "Operator Representative")
      .trim()
      .slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 40)
        : null;
    const requestDirectApiConnection = Boolean(body.requestDirectApiConnection);
    const bookingSystemIdentifier =
      typeof body.bookingSystemIdentifier === "string" &&
      body.bookingSystemIdentifier.trim()
        ? body.bookingSystemIdentifier.trim().slice(0, 120)
        : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim().slice(0, 1400)
        : null;

    if (!operatorSlug) {
      return NextResponse.json(
        { ok: false, error: "Missing operator identifier." },
        { status: 400 },
      );
    }
    if (contactName.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please enter your name (at least 2 characters)." },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid business email address." },
        { status: 400 },
      );
    }

    const combinedText = `${bookingSystemIdentifier || ""} ${notes || ""}`;
    if (SECRET_LIKE_PATTERN.test(combinedText)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Do not include raw secret API keys here. Enter only your company shortname or account handle; credentials are exchanged securely after owner verification.",
        },
        { status: 400 },
      );
    }

    const found = findSoutheastAlaskaOperatorBySlugOrAlias(operatorSlug);
    if (!found) {
      return NextResponse.json(
        { ok: false, error: "Operator profile not found." },
        { status: 404 },
      );
    }

    const assessment = assessOperatorClaimAndIntegrationSubmission({
      operator: found.operator,
      claimantEmail: email,
      claimantPhone: phone,
      requestedDirectIntegration: requestDirectApiConnection,
    });

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
        /\[test\]/i.test(notes || ""),
    );

    const submissionId = `LFSE-CLAIM-${Date.now().toString(36).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
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

    // 1. Forward durably to DCC Owner Inbox BEFORE optional notification
    const ingestResult = await forwardSpecialistInquiryToDcc({
      channel: "lastfrontiershoreexcursions-inquiry",
      submissionId,
      name: `${contactName} (${roleTitle} — ${found.operator.name})`,
      email,
      phone,
      tourType: "operator_profile_claim",
      bookingMode: requestDirectApiConnection
        ? "claim_plus_direct_api_request_pending_owner_approval"
        : "free_profile_claim_only",
      notes: [
        `[Operator Claim: ${found.operator.operatorId}]`,
        `Ports: ${found.operator.publicPortSlugs.join(", ")}`,
        `Verification Method: ${assessment.verificationMethod}`,
        requestDirectApiConnection
          ? `Direct API Connection Requested (${found.operator.bookingPlatform}${bookingSystemIdentifier ? ` · ${bookingSystemIdentifier}` : ""}) — REQUIRES EXPLICIT OWNER APPROVAL`
          : "Free Profile Claim ($0)",
        notes || "",
      ]
        .filter(Boolean)
        .join(" | "),
      sourcePage: `/operators/${found.operator.slug}`,
      sourcePath: `/operators/${found.operator.slug}`,
      intendedDestination:
        toEmail || "concierge@lastfrontiershoreexcursions.com",
      isTest,
      extraMetadata: {
        actionType: "operator_profile_claim",
        operatorId: found.operator.operatorId,
        operatorSlug: found.operator.slug,
        operatorName: found.operator.name,
        portsOfCall: found.operator.publicPortSlugs,
        roleTitle,
        requestDirectApiConnection,
        bookingSystemIdentifier,
        assessment,
        liveAvailabilityActive: false,
        directCheckout10PctActive: false,
      },
    });

    // 2. Optional notification (suppressed in preview/test)
    await sendResendEmailSafe({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      suppressForTest: isTest,
      subject: `${isTest ? "[TEST] " : ""}[LFSE Operator Claim] ${found.operator.name} (${assessment.verificationMethod})`,
      html: `
        <h2>Southeast Alaska Operator Profile Claim ($0 Free Profile)</h2>
        <p><strong>Submission ID:</strong> ${escapeHtml(submissionId)}</p>
        <p><strong>Operator:</strong> ${escapeHtml(found.operator.name)} (${escapeHtml(found.operator.operatorId)})</p>
        <p><strong>Contact:</strong> ${escapeHtml(contactName)} (${escapeHtml(roleTitle)})</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
        <p><strong>Verification Path:</strong> ${escapeHtml(assessment.verificationMethod)}</p>
        <p><strong>Direct API Requested:</strong> ${requestDirectApiConnection ? "Yes — Pending Owner Approval" : "No"}</p>
        <p><strong>Booking Handle:</strong> ${escapeHtml(bookingSystemIdentifier || "None")}</p>
        <p><strong>Notes:</strong><br/>${escapeHtml(notes || "None")}</p>
      `,
    });

    return NextResponse.json(
      {
        ok: true,
        submissionId,
        durableForwarded: ingestResult.ok,
        verificationMethod: assessment.verificationMethod,
        verificationSummary: assessment.summary,
        liveAvailabilityConnected: false,
        directCheckoutConnected: false,
        message: `Claim request recorded (${submissionId}) for ${found.operator.name}. Profile control and any API connection remain pending verification and owner approval.`,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to record operator claim right now." },
      { status: 500 },
    );
  }
}
