import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "@/lib/dcc/storage/durableTransactionalStore";

export const runtime = "nodejs";

type WaitlistBody = {
  email?: string;
  name?: string;
  source?: string;
  preferredMonth?: string;
  partySize?: number;
  isTest?: boolean;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function maybeSendArgoWaitlistEmail(record: {
  id: string;
  email: string;
  name: string | null;
  source: string;
  preferredMonth: string | null;
  partySize: number | null;
  environment: string;
  isTest: boolean;
}): Promise<boolean> {
  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  const fromEmail = (process.env.ARGO_FROM_EMAIL || "").trim();
  const toEmail = (process.env.ARGO_ALERT_TO_EMAIL || "").trim();
  if (!resendKey || !fromEmail || !toEmail) {
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: record.email,
        subject: `[Argo Waitlist${record.isTest ? " TEST" : ""}] ${record.email} (${record.id})`,
        text: [
          `Waitlist ID: ${record.id}`,
          `Environment: ${record.environment}`,
          `Email: ${record.email}`,
          `Name: ${record.name || "Not provided"}`,
          `Source: ${record.source}`,
          `Preferred Month: ${record.preferredMonth || "Not specified"}`,
          `Party Size: ${record.partySize ?? "Not specified"}`,
        ].join("\n"),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as WaitlistBody;
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const source = (body.source || "argo-page").trim();
  const preferredMonth = (body.preferredMonth || "").trim() || null;
  const partySizeRaw = Number(body.partySize || 0);
  const partySize =
    Number.isFinite(partySizeRaw) && partySizeRaw > 0
      ? Math.max(1, Math.min(20, Math.round(partySizeRaw)))
      : null;
  const isTest = Boolean(body?.isTest);
  const environment = resolveRuntimeEnvironmentTag();

  if (!isValidEmail(email)) {
    return Response.json(
      { ok: false, error: "Please provide a valid email." },
      { status: 400 },
    );
  }

  const submissionId = `argo_wl_${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const record = {
    id: submissionId,
    createdAt,
    email,
    name: name || null,
    source,
    preferredMonth,
    partySize,
    environment,
    isTest,
  };

  const persisted = await persistDurableTransactionalSubmission({
    submissionId,
    channel: "argo-waitlist",
    status: "captured",
    summaryNote: `Argo waitlist signup ${submissionId} (${source})`,
    payload: record,
    environment,
    isTest,
    createdAt,
  });

  if (!persisted.ok) {
    return Response.json(
      {
        ok: false,
        error: "Waitlist persistence is temporarily unavailable. Please try again shortly.",
        emailSent: false,
      },
      { status: 503 },
    );
  }

  const emailSent = await maybeSendArgoWaitlistEmail(record);

  return Response.json({
    ok: true,
    id: submissionId,
    environment,
    isTest,
    emailSent: Boolean(emailSent),
  });
}
