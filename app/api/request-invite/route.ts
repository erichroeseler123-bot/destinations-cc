import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isValidAdminAccessKey } from "@/lib/adminAccess";
import {
  persistDurableTransactionalSubmission,
  readDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "@/lib/dcc/storage/durableTransactionalStore";
import {
  extractEmailAddress,
  isDeliverableMxRecipientAddress,
  resolveSafeDccOwnerRecipients,
  resolveSafeDccSystemFrom,
} from "@/lib/mailer/brands";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

let customInviteResendFetchForTests: typeof fetch | null = null;

export function setRequestInviteResendFetchForTests(
  fn: typeof fetch | null,
): void {
  customInviteResendFetchForTests = fn;
}

function isAuthorizedAdminInviteReader(request: Request): boolean {
  const bearer = (request.headers.get("authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  const headerKey = (
    request.headers.get("x-admin-access-key") ||
    request.headers.get("x-earthos-admin-key") ||
    request.headers.get("x-dcc-internal-key") ||
    ""
  ).trim();
  const candidate = bearer || headerKey;
  if (!candidate) return false;

  if (isValidAdminAccessKey(candidate)) {
    return true;
  }

  const allowedEnvSecrets = [
    process.env.DCC_ADMIN_SECRET,
    process.env.EARTHOS_ADMIN_KEY,
    process.env.EARTHOS_API_KEY,
    process.env.DCC_COMMERCE_ADMIN_SECRET,
    process.env.DCC_INTERNAL_API_KEY,
    process.env.INTERNAL_API_SECRET,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean);

  return allowedEnvSecrets.includes(candidate);
}

async function maybeSendInviteNotificationEmail(record: {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  happeningTitle: string | null;
  environment: string;
  isTest: boolean;
}): Promise<boolean> {
  const resendKey = (
    process.env.DCC_RESEND_API_KEY ||
    process.env.RESEND_API_KEY ||
    ""
  ).trim();
  const fromEmail = resolveSafeDccSystemFrom(process.env);
  const toEmails = resolveSafeDccOwnerRecipients(process.env, record.email);

  if (!resendKey || !fromEmail || toEmails.length === 0) {
    return false;
  }

  const candidateReplyTo = extractEmailAddress(record.email);
  const safeReplyTo =
    candidateReplyTo && isDeliverableMxRecipientAddress(candidateReplyTo)
      ? candidateReplyTo
      : undefined;
  const isUnmonitoredDccSender = /@destinationcommandcenter\.com>?$/i.test(
    fromEmail,
  );
  const fetchImpl = customInviteResendFetchForTests || fetch;

  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmails,
        ...(safeReplyTo ? { reply_to: safeReplyTo } : {}),
        subject: `[DCC Request Invite${record.isTest ? " TEST" : ""}] ${record.happeningTitle || record.company || record.name || record.id}`,
        text: [
          `Invite ID: ${record.id}`,
          `Environment: ${record.environment}`,
          `Happening: ${record.happeningTitle || "General invite"}`,
          `Name: ${record.name || "Not provided"}`,
          `Company: ${record.company || "Not provided"}`,
          `Email: ${record.email || "Not provided"}`,
          `Phone: ${record.phone || "Not provided"}`,
          `Notes: ${record.notes || "None"}`,
          isUnmonitoredDccSender
            ? `\n---\nAutomated internal owner alert dispatched via ${fromEmail} (outbound-only system address; not a monitored reply mailbox).`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing transmission ID" },
        { status: 400 },
      );
    }

    let record = await readDurableTransactionalSubmission("request-invite", id);
    if (!record && redis) {
      const redisData = await redis.get(`invite_req:${id}`);
      if (redisData) {
        record = (
          typeof redisData === "string" ? JSON.parse(redisData) : redisData
        ) as Record<string, unknown>;
      }
    }

    if (!record) {
      return NextResponse.json(
        { ok: false, error: "Transmission record not found" },
        { status: 404 },
      );
    }

    const resolvedId = String(
      record.id || record.transmissionId || record.submissionId || id,
    );
    const status = String(record.status || "pending");
    const createdAt = String(
      record.createdAt || record.timestamp || new Date().toISOString(),
    );

    if (!isAuthorizedAdminInviteReader(request)) {
      return NextResponse.json({
        ok: true,
        id: resolvedId,
        status,
        createdAt,
      });
    }

    return NextResponse.json({
      ok: true,
      success: true,
      id: resolvedId,
      status,
      createdAt,
      transmission: record,
    });
  } catch (error) {
    console.error("Invite request lookup error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error during lookup." },
      { status: 500 },
    );
  }
}

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

    const happeningId = body.happeningId ? String(body.happeningId).trim() : null;
    const happeningTitle = body.happeningTitle
      ? String(body.happeningTitle).trim()
      : null;
    const placeId = body.placeId ? String(body.placeId).trim() : null;
    const partySize =
      body.partySize !== undefined && body.partySize !== null
        ? Number(body.partySize)
        : null;
    const price =
      body.price !== undefined && body.price !== null
        ? Number(body.price)
        : null;
    const name = body.name ? String(body.name).trim() : null;
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const company = body.company ? String(body.company).trim() : null;
    const notes = body.notes
      ? String(body.notes).trim()
      : body.note
        ? String(body.note).trim()
        : null;
    const isTest = Boolean(body.isTest);
    const environment = resolveRuntimeEnvironmentTag();

    const isHappeningFlow = Boolean(happeningId || happeningTitle);
    if (isHappeningFlow) {
      if (
        !happeningId ||
        !happeningTitle ||
        !partySize ||
        !notes ||
        !placeId ||
        price === null ||
        Number.isNaN(price) ||
        !phone
      ) {
        return NextResponse.json(
          { ok: false, error: "Missing required payload parameters" },
          { status: 400 },
        );
      }
    } else if (!email && !phone) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please provide an email address or phone number.",
        },
        { status: 400 },
      );
    }

    const transmissionId = randomUUID();
    const createdAt = new Date().toISOString();

    const requestPayload = {
      id: transmissionId,
      transmissionId,
      happeningId,
      happeningTitle,
      partySize,
      name,
      email,
      phone,
      company,
      note: notes,
      notes,
      placeId,
      price,
      status: "pending",
      createdAt,
      timestamp: createdAt,
      environment,
      isTest,
    };

    const persisted = await persistDurableTransactionalSubmission({
      submissionId: transmissionId,
      channel: "request-invite",
      status: "pending",
      summaryNote: `Invite request ${transmissionId}${happeningTitle ? ` for ${happeningTitle}` : ""}`,
      payload: requestPayload,
      environment,
      isTest,
      createdAt,
    });

    let redisSaved = false;
    if (redis) {
      try {
        await redis.set(
          `invite_req:${transmissionId}`,
          JSON.stringify(requestPayload),
        );
        redisSaved = true;
      } catch {
        redisSaved = false;
      }
    }

    if (!persisted.ok && !redisSaved) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invite request persistence is temporarily unavailable. Please try again shortly.",
          emailSent: false,
        },
        { status: 503 },
      );
    }

    const emailSent = await maybeSendInviteNotificationEmail({
      id: transmissionId,
      name,
      email,
      phone,
      company,
      notes,
      happeningTitle,
      environment,
      isTest,
    });

    return NextResponse.json({
      ok: true,
      success: true,
      message: "Transmission received and logged successfully",
      id: transmissionId,
      transmissionId,
      status: "pending",
      createdAt,
      environment,
      isTest,
      emailSent: Boolean(emailSent),
    });
  } catch (error) {
    console.error("Invite request processing error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error. Database transmission abort." },
      { status: 500 },
    );
  }
}
