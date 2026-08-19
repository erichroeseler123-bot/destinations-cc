import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DOMAIN = "redrocksdd.com";
const TOKEN = "rrdd-mail-setup-20260818-9f6a2c4d7b1e";
const INBOUND_TOKEN = process.env.REDROCKSDD_INBOUND_TOKEN;

async function resend(path: string, init?: RequestInit) {
  const apiKey = process.env.DCC_RESEND_API_KEY;
  if (!apiKey) throw new Error("DCC_RESEND_API_KEY is not configured");
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || body?.error || `Resend ${path} failed (${res.status})`);
  return body;
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!INBOUND_TOKEN) {
    return NextResponse.json({ ok: false, error: "REDROCKSDD_INBOUND_TOKEN is not configured" }, { status: 503 });
  }
  try {
    const listed = await resend("/domains");
    let domain = Array.isArray(listed?.data) ? listed.data.find((x: any) => String(x?.name).toLowerCase() === DOMAIN) : null;
    if (!domain) {
      domain = await resend("/domains", {
        method: "POST",
        body: JSON.stringify({ name: DOMAIN, capabilities: { sending: "enabled", receiving: "enabled" } }),
      });
    } else {
      domain = await resend(`/domains/${domain.id}`, {
        method: "PATCH",
        body: JSON.stringify({ capabilities: { sending: "enabled", receiving: "enabled" } }),
      });
    }
    const fullDomain = await resend(`/domains/${domain.id}`);
    const endpoint = `https://destinations-cc.vercel.app/api/redrocksdd/inbound?token=${encodeURIComponent(INBOUND_TOKEN)}`;
    let webhook: any = null;
    try {
      const hooks = await resend("/webhooks");
      webhook = Array.isArray(hooks?.data) ? hooks.data.find((x: any) => x?.endpoint === endpoint) : null;
    } catch {}
    if (!webhook) {
      webhook = await resend("/webhooks", {
        method: "POST",
        body: JSON.stringify({ endpoint, events: ["email.received"] }),
      });
    }
    return NextResponse.json({ ok: true, domain: fullDomain, webhook, endpoint });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "setup_failed" }, { status: 500 });
  }
}
