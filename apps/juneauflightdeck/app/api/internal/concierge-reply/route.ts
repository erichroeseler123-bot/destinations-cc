import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

const DEFAULT_JFD_FROM = "Juneau Flight Deck <press@juneauflightdeck.com>";

function constantTimeEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

function resolveSafeJfdFrom(requestedFrom?: string | null): string {
  const candidate = (
    requestedFrom ||
    process.env.DEPLOY_TEST_EMAIL_FROM ||
    DEFAULT_JFD_FROM
  ).trim();
  if (!candidate || /partyatredrocks\.com/i.test(candidate)) {
    return DEFAULT_JFD_FROM;
  }
  return candidate;
}

export async function POST(request: Request) {
  const configuredSecret = (process.env.DCC_INTERNAL_API_SECRET || "").trim();
  const providedSecret = (
    request.headers.get("x-dcc-internal-secret") || ""
  ).trim();

  if (
    !configuredSecret ||
    !providedSecret ||
    !constantTimeEquals(providedSecret, configuredSecret)
  ) {
    return NextResponse.json(
      {
        ok: false,
        resendId: null,
        status: 401,
        error: "UNAUTHORIZED_INTERNAL_SECRET",
        fromUsed: null,
      },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        resendId: null,
        status: 400,
        error: "INVALID_JSON",
        fromUsed: null,
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const dryRunSandbox = body.dryRunSandbox === true;
  const rawTo = body.to;
  const recipientList = dryRunSandbox
    ? ["delivered@resend.dev"]
    : Array.isArray(rawTo)
      ? rawTo.map((v) => String(v || "").trim()).filter(Boolean)
      : typeof rawTo === "string" && rawTo.trim()
        ? [rawTo.trim()]
        : [];

  const subject = String(body.subject || "").trim();
  const text = String(body.text || body.textBody || "").trim();
  const html = typeof body.html === "string" && body.html.trim() ? body.html.trim() : undefined;
  const replyTo =
    typeof body.reply_to === "string" && body.reply_to.trim()
      ? body.reply_to.trim()
      : typeof body.replyTo === "string" && body.replyTo.trim()
        ? body.replyTo.trim()
        : undefined;
  const fromUsed = resolveSafeJfdFrom(
    typeof body.from === "string" ? body.from : null,
  );

  if (recipientList.length === 0 || !subject || !text) {
    return NextResponse.json(
      {
        ok: false,
        resendId: null,
        status: 400,
        error: "MISSING_REQUIRED_EMAIL_FIELDS",
        fromUsed,
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!resendApiKey) {
    return NextResponse.json(
      {
        ok: false,
        resendId: null,
        status: 503,
        error: "RESEND_API_KEY_NOT_CONFIGURED",
        fromUsed,
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromUsed,
        to: recipientList,
        subject,
        text,
        ...(html ? { html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      cache: "no-store",
    });

    const data = (await resendRes.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!resendRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          resendId: null,
          status: resendRes.status,
          error: data.message || data.name || `RESEND_HTTP_${resendRes.status}`,
          fromUsed,
        },
        { status: resendRes.status, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        resendId: data.id || null,
        status: resendRes.status,
        error: null,
        fromUsed,
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        resendId: null,
        status: 502,
        error: err instanceof Error ? err.message : "RESEND_NETWORK_ERROR",
        fromUsed,
      },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
