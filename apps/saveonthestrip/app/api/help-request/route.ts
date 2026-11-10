import { NextRequest, NextResponse } from "next/server";
import { emitDccEvent } from "../../../lib/dcc";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "../../../../../lib/dcc/storage/transactionalSubmissions";

export const runtime = "nodejs";

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

async function maybeForwardHelpRequestEmail({
  name,
  email,
  phone,
  requestType,
  notes,
  sourcePath,
  handoffId,
  environment,
  isTest,
}: {
  name: string;
  email: string;
  phone: string;
  requestType: string;
  notes: string;
  sourcePath: string;
  handoffId: string;
  environment: string;
  isTest: boolean;
}) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.SOTS_CONTACT_FROM_EMAIL?.trim() ||
    process.env.ARGO_FROM_EMAIL?.trim() ||
    "contact@saveonthestrip.com";

  if (!resendKey || !fromEmail) {
    return { sent: false, reason: "missing_email_config" as const };
  }

  const lines = [
    "New Save On The Strip contact request",
    "",
    `Environment: ${environment}${isTest ? " (TEST)" : ""}`,
    `Name: ${name || "Not provided"}`,
    `Email: ${email || "Not provided"}`,
    `Phone: ${phone || "Not provided"}`,
    `Request type: ${requestType || "general_help"}`,
    `Source path: ${sourcePath}`,
    `Handoff ID: ${handoffId}`,
    "",
    "Notes:",
    notes || "No notes provided.",
  ];

  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ["laurensanders123@gmail.com"],
        subject: `Save On The Strip contact${isTest ? " [TEST]" : ""}: ${requestType || "general_help"}`,
        reply_to: email || undefined,
        text: lines.join("\n"),
      }),
      cache: "no-store",
    });

    return {
      sent: upstream.ok,
      reason: upstream.ok ? undefined : await upstream.text(),
    };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "email_dispatch_failed",
    };
  }
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
    isTest,
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

  const createdAt = new Date().toISOString();
  const persisted = await persistDurableTransactionalSubmission({
    submissionId: handoffId,
    channel: "saveonthestrip-help-request",
    status: "captured",
    summaryNote: `Save On The Strip help request ${handoffId} (${requestType})`,
    payload: {
      handoffId,
      name: name || null,
      email: email || null,
      phone: phone || null,
      requestType,
      notes: notes || null,
      sourcePath: safeSourcePath,
      environment,
      isTest,
      createdAt,
    },
    environment,
    isTest,
    createdAt,
  });

  if (!persisted.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Help-request persistence is temporarily unavailable. Please try again shortly.",
        emailSent: false,
      },
      { status: 503 },
    );
  }

  const [, emailResult] = await Promise.all([
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
      },
    }).catch(() => ({ ok: false, skipped: false })),
    maybeForwardHelpRequestEmail({
      name,
      email,
      phone,
      requestType,
      notes,
      sourcePath: safeSourcePath,
      handoffId,
      environment,
      isTest,
    }),
  ]);

  await emitDccEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: "status_updated",
    source: "saveonthestrip",
    sourcePath: safeSourcePath,
    status: emailResult.sent ? "forwarded" : "captured",
    stage: "help_request_followup",
    message: emailResult.sent
      ? "Contact request emailed to Lauren."
      : "Contact request captured durably without email forwarding.",
    metadata: {
      requestType: requestType || "general_help",
      emailForwarded: Boolean(emailResult.sent),
      emailForwardReason: emailResult.reason || null,
      environment,
      isTest,
    },
  }).catch(() => null);

  if (wantsJson) {
    return NextResponse.json(
      {
        ok: true,
        id: handoffId,
        environment,
        isTest,
        emailSent: Boolean(emailResult.sent),
      },
      { status: 201 },
    );
  }

  redirectUrl.searchParams.set("sent", "1");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
