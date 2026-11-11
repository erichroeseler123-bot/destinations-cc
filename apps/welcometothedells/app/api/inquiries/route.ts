import { NextRequest, NextResponse } from "next/server";
import {
  escapeHtml,
  forwardSpecialistInquiryToDcc,
  sendResendEmailSafe,
  type SpecialistNotificationStatus,
} from "../../../../../lib/dcc/shared/specialistInquiryClient";

export const runtime = "nodejs";

const VALID_INQUIRY_TYPES = [
  "activity_booking",
  "group_planning",
  "resort_help",
  "operator_listing",
  "general",
] as const;

type InquiryType = (typeof VALID_INQUIRY_TYPES)[number];

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

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Welcome to the Dells Inquiries & Trip Desk API",
    supportedTypes: VALID_INQUIRY_TYPES,
    version: "1.2.0",
  });
}

export async function POST(request: NextRequest) {
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

    const {
      name,
      email,
      phone,
      inquiryType,
      message,
      partySize,
      dates,
      contextTitle,
      sourcePath,
      isTest: rawIsTest,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: "Name is required." },
        { status: 400 },
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Valid email address is required." },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: "Message or trip details are required." },
        { status: 400 },
      );
    }

    const rawType = String(inquiryType || "general").toLowerCase().trim();
    const finalType: InquiryType = (
      VALID_INQUIRY_TYPES as readonly string[]
    ).includes(rawType)
      ? (rawType as InquiryType)
      : "general";

    const refCode = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const referenceId = `WTD-INQ-${refCode}`;
    const receivedAt = new Date().toISOString();
    const environment = resolveRuntimeEnvironmentTag();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanPartySize = partySize ? String(partySize).trim() : null;
    const cleanDates = dates ? String(dates).trim() : null;
    const cleanContextTitle = contextTitle ? String(contextTitle).trim() : null;
    const cleanMessage = message.trim();
    const cleanSourcePath =
      typeof sourcePath === "string" && sourcePath.trim().startsWith("/")
        ? sourcePath.trim()
        : "/contact";

    const isTest =
      Boolean(rawIsTest) ||
      environment === "test" ||
      hasTestMarker(cleanName, cleanMessage, cleanContextTitle);

    let emailSent = false;
    let emailReason: string | null = null;
    let emailProviderId: string | null = null;
    let notificationStatus: SpecialistNotificationStatus = "not_configured";

    if (isTest) {
      notificationStatus = "suppressed_test";
      emailReason = "suppressed_test";
    } else {
      const emailHtml = `
        <h2>New Wisconsin Dells Visitor Inquiry</h2>
        <p><strong>Reference ID:</strong> ${escapeHtml(referenceId)}</p>
        <p><strong>Environment:</strong> ${escapeHtml(environment)}</p>
        <p><strong>Type:</strong> ${escapeHtml(finalType)}</p>
        <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(cleanPhone || "Not provided")}</p>
        <p><strong>Party Size:</strong> ${escapeHtml(cleanPartySize || "Not specified")}</p>
        <p><strong>Dates:</strong> ${escapeHtml(cleanDates || "Not specified")}</p>
        <p><strong>Context/Activity:</strong> ${escapeHtml(cleanContextTitle || "General")}</p>
        <hr />
        <h3>Message / Request:</h3>
        <p style="white-space: pre-wrap;">${escapeHtml(cleanMessage)}</p>
        <hr />
        <p style="font-size: 11px; color: #888;">Dispatched from Welcome to the Dells (welcometothedells.com)</p>
      `;

      const emailDispatch = await sendResendEmailSafe({
        apiKey: process.env.RESEND_API_KEY,
        from: "Welcome to the Dells <inquiries@welcometothedells.com>",
        to: ["hello@welcometothedells.com"],
        replyTo: cleanEmail,
        subject: `[Dells Inquiry] ${finalType.toUpperCase()} - ${cleanName.replace(/[\r\n]+/g, " ")} (Ref: ${referenceId})`,
        html: emailHtml,
      });

      emailSent = emailDispatch.emailSent;
      emailReason = emailDispatch.emailReason;
      emailProviderId = emailDispatch.emailProviderId;
      notificationStatus = emailDispatch.notificationStatus;
    }

    const parsedPartySize =
      cleanPartySize && /^\d+$/.test(cleanPartySize)
        ? Number.parseInt(cleanPartySize, 10)
        : undefined;

    const forwarded = await forwardSpecialistInquiryToDcc({
      submissionId: referenceId,
      channel: "welcometothedells-inquiry",
      sourceSite: "welcometothedells.com",
      sourcePath: cleanSourcePath,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || undefined,
      partySize: parsedPartySize,
      travelDate: cleanDates || undefined,
      tourInterest: cleanContextTitle || finalType,
      notes: cleanMessage,
      isTest,
      emailSent,
      emailReason,
      emailProviderId,
      notificationStatus,
      metadata: {
        referenceId,
        receivedAt,
        inquiryType: finalType,
        partySizeRaw: cleanPartySize,
        datesRaw: cleanDates,
        contextTitle: cleanContextTitle,
        environment,
      },
    });

    if (!forwarded.ok) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error:
            "Inquiry persistence is temporarily unavailable. Please try again shortly.",
          emailSent,
          emailDispatched: emailSent,
          notificationStatus,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      referenceId,
      inquiryType: finalType,
      environment,
      isTest,
      emailSent,
      emailDispatched: emailSent,
      notificationStatus,
      message:
        "Thank you! Your inquiry has been received. Our Wisconsin Dells planning desk will review and follow up shortly.",
      receivedAt,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal server error processing inquiry." },
      { status: 500 },
    );
  }
}
