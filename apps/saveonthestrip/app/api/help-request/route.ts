import { NextRequest, NextResponse } from "next/server";
import { emitDccEvent } from "../../../lib/dcc";
import {
  escapeHtml,
  forwardSpecialistInquiryToDcc,
  sendResendEmailSafe,
  type SpecialistNotificationStatus,
} from "../../../../../lib/dcc/shared/specialistInquiryClient";

export const runtime = "nodejs";

function resolveRuntimeEnvironmentTag(): "production" | "preview" | "development" | "test" {
  const vercelEnv = (process.env.VERCEL_ENV || "").trim().toLowerCase();
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (vercelEnv === "development") return "development";
  const nodeEnv = (process.env.NODE_ENV || "").trim().toLowerCase();
  if (nodeEnv === "test") return "test";
  if (nodeEnv === "production") return "production";
  return "development";
}

function hasTestMarker(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => typeof value === "string" && /\[test\]/i.test(value));
}

function readValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function parseHelpRequestInput(request: NextRequest): Promise<{
  isJsonRequest: boolean;
  name: string;
  email: string;
  phone: string;
  requestType: string;
  notes: string;
  sourcePath: string;
  handoffId: string;
  isTest: boolean;
}> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return {
      isJsonRequest: true,
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim(),
      phone: String(body.phone || "").trim(),
      requestType: String(body.requestType || "general_help").trim() || "general_help",
      notes: String(body.notes || body.message || "").trim(),
      sourcePath: String(body.sourcePath || "/deals").trim() || "/deals",
      handoffId:
        String(body.handoffId || "").trim() || `sots_help_${Date.now()}`,
      isTest: Boolean(body.isTest),
    };
  }

  const formData = await request.formData();
  const isTestRaw = readValue(formData, "isTest").toLowerCase();
  return {
    isJsonRequest: false,
    name: readValue(formData, "name"),
    email: readValue(formData, "email"),
    phone: readValue(formData, "phone"),
    requestType: readValue(formData, "requestType") || "general_help",
    notes: readValue(formData, "notes"),
    sourcePath: readValue(formData, "sourcePath") || "/deals",
    handoffId: readValue(formData, "handoffId") || `sots_help_${Date.now()}`,
    isTest: isTestRaw === "1" || isTestRaw === "true",
  };
}

export async function POST(request: NextRequest) {
  const {
    isJsonRequest,
    name,
    email,
    phone,
    requestType,
    notes,
    sourcePath,
    handoffId,
    isTest: rawIsTest,
  } = await parseHelpRequestInput(request);

  const environment = resolveRuntimeEnvironmentTag();
  const acceptHeader = (request.headers.get("accept") || "").toLowerCase();
  const wantsJson =
    isJsonRequest ||
    (acceptHeader.includes("application/json") &&
      !acceptHeader.includes("text/html"));
  const safeSourcePath = sourcePath.startsWith("/") ? sourcePath : "/contact";
  const redirectUrl = new URL(safeSourcePath, request.url);

  if (!email && !phone) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: "Please provide an email address or phone number." },
        { status: 400 },
      );
    }
    redirectUrl.searchParams.set("error", "contact");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const isTest =
    rawIsTest ||
    environment === "test" ||
    hasTestMarker(name, notes, requestType);

  let emailSent = false;
  let emailReason: string | null = null;
  let emailProviderId: string | null = null;
  let notificationStatus: SpecialistNotificationStatus = "not_configured";

  const fromEmail =
    process.env.SOTS_CONTACT_FROM_EMAIL?.trim() ||
    process.env.ARGO_FROM_EMAIL?.trim() ||
    "contact@saveonthestrip.com";

  if (isTest) {
    notificationStatus = "suppressed_test";
    emailReason = "suppressed_test";
  } else {
    const emailHtml = `
      <h2>New Save On The Strip Contact Request</h2>
      <p><strong>Environment:</strong> ${escapeHtml(environment)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name || "Not provided")}</p>
      <p><strong>Email:</strong> ${escapeHtml(email || "Not provided")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
      <p><strong>Request Type:</strong> ${escapeHtml(requestType || "general_help")}</p>
      <p><strong>Source Path:</strong> ${escapeHtml(safeSourcePath)}</p>
      <p><strong>Handoff ID:</strong> ${escapeHtml(handoffId)}</p>
      <hr />
      <h3>Notes</h3>
      <p style="white-space: pre-wrap;">${escapeHtml(notes || "No notes provided.")}</p>
    `;

    const textLines = [
      "New Save On The Strip contact request",
      "",
      `Environment: ${environment}`,
      `Name: ${name || "Not provided"}`,
      `Email: ${email || "Not provided"}`,
      `Phone: ${phone || "Not provided"}`,
      `Request type: ${requestType || "general_help"}`,
      `Source path: ${safeSourcePath}`,
      `Handoff ID: ${handoffId}`,
      "",
      "Notes:",
      notes || "No notes provided.",
    ];

    const emailDispatch = await sendResendEmailSafe({
      apiKey: process.env.RESEND_API_KEY,
      from: fromEmail,
      to: ["laurensanders123@gmail.com"],
      replyTo: email || undefined,
      subject: `Save On The Strip contact: ${(requestType || "general_help").replace(/[\r\n]+/g, " ")}`,
      html: emailHtml,
      text: textLines.join("\n"),
    });

    emailSent = emailDispatch.emailSent;
    emailReason = emailDispatch.emailReason;
    emailProviderId = emailDispatch.emailProviderId;
    notificationStatus = emailDispatch.notificationStatus;
  }

  const normalizedEmail =
    email && email.includes("@")
      ? email.trim().toLowerCase()
      : "phone-only-lead@saveonthestrip.com";

  const forwarded = await forwardSpecialistInquiryToDcc({
    submissionId: handoffId,
    channel: "saveonthestrip-help-request",
    sourceSite: "saveonthestrip.com",
    sourcePath: safeSourcePath,
    name: name || "Vegas Visitor",
    email: normalizedEmail,
    phone: phone || undefined,
    handoffId,
    tourInterest: requestType || "general_help",
    notes: notes || (phone ? `Phone-only contact request: ${phone}` : undefined),
    isTest,
    emailSent,
    emailReason,
    emailProviderId,
    notificationStatus,
    metadata: {
      handoffId,
      requestType: requestType || "general_help",
      emailProvided: Boolean(email),
      phoneProvided: Boolean(phone),
      environment,
    },
  });

  if (!forwarded.ok) {
    if (wantsJson) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Help-request persistence is temporarily unavailable. Please try again shortly.",
          emailSent,
          notificationStatus,
        },
        { status: 503 },
      );
    }
    redirectUrl.searchParams.set("error", "1");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  await Promise.all([
    emitDccEvent({
      handoffId,
      satelliteId: "saveonthestrip",
      eventType: "lead_captured",
      source: "saveonthestrip",
      sourcePath: safeSourcePath,
      status: "captured",
      stage: "help_request",
      message: notes || undefined,
      traveler: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
      },
      attribution: {
        sourceSlug: "saveonthestrip-help",
        sourcePage: safeSourcePath,
        topicSlug: "vegas-deals",
      },
      booking: {
        citySlug: "las-vegas",
      },
      metadata: {
        requestType,
        directHelpRequest: true,
        networkHub: "dcc",
        environment,
        isTest,
        notificationStatus,
      },
    }).catch(() => ({ ok: false, skipped: false })),
    emitDccEvent({
      handoffId,
      satelliteId: "saveonthestrip",
      eventType: "status_updated",
      source: "saveonthestrip",
      sourcePath: safeSourcePath,
      status: emailSent ? "forwarded" : "captured",
      stage: "help_request_followup",
      message: emailSent
        ? "Contact request emailed to Lauren."
        : "Contact request captured durably without email forwarding.",
      metadata: {
        requestType: requestType || "general_help",
        emailForwarded: emailSent,
        emailForwardReason: emailReason,
        notificationStatus,
        environment,
        isTest,
      },
    }).catch(() => null),
  ]);

  if (wantsJson) {
    return NextResponse.json(
      {
        ok: true,
        id: handoffId,
        environment,
        isTest,
        emailSent,
        notificationStatus,
      },
      { status: 201 },
    );
  }

  redirectUrl.searchParams.set("sent", "1");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
