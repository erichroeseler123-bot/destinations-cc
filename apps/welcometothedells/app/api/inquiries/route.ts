import { NextRequest, NextResponse } from "next/server";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "../../../../../lib/dcc/storage/transactionalSubmissions";

export const runtime = "nodejs";

const VALID_INQUIRY_TYPES = [
  "activity_booking",
  "group_planning",
  "resort_help",
  "operator_listing",
  "general",
] as const;

type InquiryType = (typeof VALID_INQUIRY_TYPES)[number];

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Welcome to the Dells Inquiries & Trip Desk API",
    supportedTypes: VALID_INQUIRY_TYPES,
    version: "1.1.0",
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
    const isTest = Boolean(rawIsTest);

    const record = {
      referenceId,
      receivedAt,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      inquiryType: finalType,
      partySize: partySize ? String(partySize).trim() : null,
      dates: dates ? String(dates).trim() : null,
      contextTitle: contextTitle ? String(contextTitle).trim() : null,
      message: message.trim(),
      environment,
      isTest,
    };

    const persisted = await persistDurableTransactionalSubmission({
      submissionId: referenceId,
      channel: "welcometothedells-inquiry",
      status: "captured",
      summaryNote: `Welcome to the Dells inquiry ${referenceId} (${finalType})`,
      payload: record,
      environment,
      isTest,
      createdAt: receivedAt,
    });

    if (!persisted.ok) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error:
            "Inquiry persistence is temporarily unavailable. Please try again shortly.",
          emailSent: false,
          emailDispatched: false,
        },
        { status: 503 },
      );
    }

    let emailDispatched = false;
    const resendApiKey = (process.env.RESEND_API_KEY || "").trim();

    if (resendApiKey) {
      try {
        const emailHtml = `
          <h2>New Wisconsin Dells Visitor Inquiry</h2>
          <p><strong>Reference ID:</strong> ${referenceId}</p>
          <p><strong>Environment:</strong> ${environment}${isTest ? " (TEST)" : ""}</p>
          <p><strong>Type:</strong> ${finalType}</p>
          <p><strong>Name:</strong> ${record.name}</p>
          <p><strong>Email:</strong> ${record.email}</p>
          <p><strong>Phone:</strong> ${record.phone || "Not provided"}</p>
          <p><strong>Party Size:</strong> ${record.partySize || "Not specified"}</p>
          <p><strong>Dates:</strong> ${record.dates || "Not specified"}</p>
          <p><strong>Context/Activity:</strong> ${record.contextTitle || "General"}</p>
          <hr />
          <h3>Message / Request:</h3>
          <p style="white-space: pre-wrap;">${record.message}</p>
          <hr />
          <p style="font-size: 11px; color: #888;">Dispatched from Welcome to the Dells (welcometothedells.com)</p>
        `;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Welcome to the Dells <inquiries@welcometothedells.com>",
            to: ["hello@welcometothedells.com"],
            subject: `[Dells Inquiry${isTest ? " TEST" : ""}] ${finalType.toUpperCase()} - ${record.name} (Ref: ${referenceId})`,
            html: emailHtml,
            reply_to: record.email,
          }),
        });

        if (resendRes.ok) {
          emailDispatched = true;
        }
      } catch {
        emailDispatched = false;
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      referenceId,
      inquiryType: finalType,
      environment,
      isTest,
      emailSent: Boolean(emailDispatched),
      emailDispatched: Boolean(emailDispatched),
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
