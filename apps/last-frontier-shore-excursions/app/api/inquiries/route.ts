import { NextResponse } from "next/server";
import {
  escapeHtml,
  forwardSpecialistInquiryToDcc,
  sendResendEmailSafe,
} from "../../../../../lib/dcc/shared/specialistInquiryClient";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase().slice(0, 160)
        : "";
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 40)
        : null;
    const shipName =
      typeof body.shipName === "string" && body.shipName.trim()
        ? body.shipName.trim().slice(0, 100)
        : null;
    const cruiseLine =
      typeof body.cruiseLine === "string" && body.cruiseLine.trim()
        ? body.cruiseLine.trim().slice(0, 100)
        : null;
    const portDate =
      typeof body.portDate === "string" && body.portDate.trim()
        ? body.portDate.trim().slice(0, 80)
        : typeof body.dates === "string" && body.dates.trim()
          ? body.dates.trim().slice(0, 80)
          : null;
    const portsOfCall =
      typeof body.portsOfCall === "string" && body.portsOfCall.trim()
        ? body.portsOfCall.trim().slice(0, 140)
        : "Juneau / Skagway / Ketchikan";
    const partySize = Math.max(
      1,
      Math.min(120, Math.round(Number(body.partySize ?? body.groupSize ?? 2) || 2)),
    );
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim().slice(0, 1200)
        : typeof body.message === "string" && body.message.trim()
          ? body.message.trim().slice(0, 1200)
          : null;
    const sourcePage =
      typeof body.sourcePage === "string" && body.sourcePage.trim()
        ? body.sourcePage.trim().slice(0, 160)
        : "/contact";

    if (name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please enter your name (at least 2 characters)." },
        { status: 400 },
      );
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").toLowerCase();
    const isPreviewRuntime =
      process.env.VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "development" ||
      host.includes(".vercel.app") ||
      host.includes("localhost") ||
      host.includes("127.0.0.1");

    const hasTestMarker =
      body.isTest === true ||
      /\[test\]/i.test(name) ||
      /\[test\]/i.test(notes || "");

    const isTest = Boolean(isPreviewRuntime || hasTestMarker);
    const submissionId = `LFSE-${Date.now().toString(36).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const toEmail =
      (process.env.LFSE_CONCIERGE_TO_EMAIL || process.env.EARTHOS_APPROVAL_TO || "").trim() ||
      null;
    const fromEmail =
      (process.env.LFSE_CONCIERGE_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "").trim() ||
      null;

    const headline = `Alaska Multi-Cabin & Port Logistics Inquiry — ${shipName || portsOfCall} (${partySize} guests)`;

    const emailDelivery = await sendResendEmailSafe({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      suppressForTest: isTest,
      subject: `${isTest ? "[TEST] " : ""}[LFSE] ${headline}`,
      html: `
        <h2>Alaska Multi-Cabin &amp; Port Logistics Inquiry</h2>
        <p><strong>Submission ID:</strong> ${escapeHtml(submissionId)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
        <p><strong>Ship / Line:</strong> ${escapeHtml([cruiseLine, shipName].filter(Boolean).join(" · ") || "Not specified")}</p>
        <p><strong>Port Window / Sail Date:</strong> ${escapeHtml(portDate || "Not specified")}</p>
        <p><strong>Ports of Call:</strong> ${escapeHtml(portsOfCall)}</p>
        <p><strong>Party Size:</strong> ${escapeHtml(partySize)}</p>
        <p><strong>Notes:</strong><br/>${escapeHtml(notes || "None")}</p>
      `,
    });

    const ingestResult = await forwardSpecialistInquiryToDcc({
      channel: "lastfrontiershoreexcursions-inquiry",
      submissionId,
      name,
      email,
      phone,
      cruiseLine,
      shipName,
      portDate,
      dates: portDate,
      partySize,
      notes,
      sourcePage,
      sourcePath: sourcePage,
      intendedDestination: toEmail || "concierge@lastfrontiershoreexcursions.com",
      isTest,
      attribution:
        body.attribution && typeof body.attribution === "object"
          ? (body.attribution as Record<string, unknown>)
          : undefined,
      emailSent: emailDelivery.emailSent,
      emailReason: emailDelivery.emailReason,
      notificationStatus: emailDelivery.notificationStatus,
      emailProviderId: emailDelivery.emailProviderId,
      extraMetadata: {
        headline,
        routeOrLocation: [shipName, portsOfCall].filter(Boolean).join(" · "),
      },
    });

    if (!ingestResult.ok && !emailDelivery.emailSent) {
      return NextResponse.json(
        {
          ok: false,
          error:
            ingestResult.error ||
            "Inquiry intake is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        submissionId: ingestResult.submissionId || submissionId,
        persisted: ingestResult.ok,
        isTest,
        notificationStatus: emailDelivery.notificationStatus,
        message:
          "Your Alaska port-day inquiry has been logged for human concierge review. No payment or card hold is collected on Last Frontier Shore Excursions; we reply with cruise-safe timing comparisons and direct operator or verified partner booking links.",
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Unable to process Alaska excursion inquiry.",
      },
      { status: 500 },
    );
  }
}
