import { NextRequest, NextResponse } from "next/server";
import { emitDccEvent } from "@/lib/dcc";

function readValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function maybeForwardHelpRequestEmail({
  name,
  email,
  phone,
  requestType,
  notes,
  sourcePath,
  handoffId,
}: {
  name: string;
  email: string;
  phone: string;
  requestType: string;
  notes: string;
  sourcePath: string;
  handoffId: string;
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

  const upstream = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: ["laurensanders123@gmail.com"],
      subject: `Save On The Strip contact: ${requestType || "general_help"}`,
      reply_to: email || undefined,
      text: lines.join("\n"),
    }),
    cache: "no-store",
  });

  return {
    sent: upstream.ok,
    reason: upstream.ok ? undefined : await upstream.text(),
  };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = readValue(formData, "name");
  const email = readValue(formData, "email");
  const phone = readValue(formData, "phone");
  const requestType = readValue(formData, "requestType") || "general_help";
  const notes = readValue(formData, "notes");
  const sourcePath = readValue(formData, "sourcePath") || "/deals";
  const handoffId = readValue(formData, "handoffId") || `sots_help_${Date.now()}`;
  const redirectUrl = new URL(sourcePath, request.url);

  if (!email && !phone) {
    redirectUrl.searchParams.set("error", "contact");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const [eventResult, emailResult] = await Promise.all([
    emitDccEvent({
      handoffId,
      satelliteId: "saveonthestrip",
      eventType: "lead_captured",
      source: "saveonthestrip",
      sourcePath,
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
        sourcePage: sourcePath,
        topicSlug: "vegas-deals",
      },
      booking: {
        citySlug: "las-vegas",
      },
      metadata: {
        requestType,
        directHelpRequest: true,
        networkHub: "dcc",
      },
    }),
    maybeForwardHelpRequestEmail({
      name,
      email,
      phone,
      requestType,
      notes,
      sourcePath,
      handoffId,
    }),
  ]);

  if (!eventResult.ok && !eventResult.skipped && !emailResult.sent) {
    redirectUrl.searchParams.set("error", "contact");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  await emitDccEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: emailResult.sent ? "status_updated" : "status_updated",
    source: "saveonthestrip",
    sourcePath,
    status: emailResult.sent ? "forwarded" : "captured",
    stage: "help_request_followup",
    message: emailResult.sent ? "Contact request emailed to Lauren." : "Contact request captured without email forwarding.",
    metadata: {
      requestType: requestType || "general_help",
      emailForwarded: emailResult.sent,
      emailForwardReason: emailResult.reason || null,
    },
  });

  redirectUrl.searchParams.set("sent", "1");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
