import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const FORWARD_TO = "erichroeseler123@gmail.com";
const SUPPORT_ADDRESS = "hello@redrocksdd.com";

export async function GET() {
  return NextResponse.json({ ok: true, service: "redrocksdd-inbound", forwardsTo: FORWARD_TO });
}

export async function POST(req: NextRequest) {
  const token = process.env.REDROCKSDD_INBOUND_TOKEN;
  if (!token || req.nextUrl.searchParams.get("token") !== token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DCC_RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "resend_not_configured" }, { status: 503 });
  }

  const event = await req.json().catch(() => null) as null | {
    type?: string;
    data?: { email_id?: string; to?: string[] };
  };

  if (!event || event.type !== "email.received" || !event.data?.email_id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const recipients = Array.isArray(event.data.to) ? event.data.to.map((x) => String(x).toLowerCase()) : [];
  if (recipients.length && !recipients.includes(SUPPORT_ADDRESS)) {
    return NextResponse.json({ ok: true, ignored: true, reason: "not_redrocksdd_support" });
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.receiving.forward({
    emailId: event.data.email_id,
    to: FORWARD_TO,
    from: `Red Rocks DD <${SUPPORT_ADDRESS}>`,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, forwarded: true, id: data?.id || null });
}
