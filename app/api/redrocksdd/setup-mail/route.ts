import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TOKEN = "pn_5yH48NQml7-furtZ6ZT5xcbQntohBvTObScsS9AM";
const DOMAIN = "redrocksdd.com";
const WEBHOOK_ENDPOINT = `https://destinations-cc-erichroeseler123-bots-projects.vercel.app/api/redrocksdd/inbound?token=${TOKEN}`;

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

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const listed = await resend("/domains");
    let domain = Array.isArray(listed?.data) ? listed.data.find((x: any) => String(x?.name).toLowerCase() === DOMAIN) : null;

    if (!domain) {
      domain = await resend("/domains", {
        method: "POST",
        body: JSON.stringify({
          name: DOMAIN,
          capabilities: { sending: "enabled", receiving: "enabled" },
        }),
      });
    } else {
      domain = await resend(`/domains/${domain.id}`, {
        method: "PATCH",
        body: JSON.stringify({ capabilities: { sending: "enabled", receiving: "enabled" } }),
      });
    }

    const fullDomain = await resend(`/domains/${domain.id}`);

    let webhook: any = null;
    try {
      const hooks = await resend("/webhooks");
      webhook = Array.isArray(hooks?.data) ? hooks.data.find((x: any) => x?.endpoint === WEBHOOK_ENDPOINT) : null;
    } catch {}

    if (!webhook) {
      webhook = await resend("/webhooks", {
        method: "POST",
        body: JSON.stringify({ endpoint: WEBHOOK_ENDPOINT, events: ["email.received"] }),
      });
    }

    return NextResponse.json({
      ok: true,
      domain: {
        id: fullDomain?.id,
        name: fullDomain?.name,
        status: fullDomain?.status,
        capabilities: fullDomain?.capabilities,
        records: fullDomain?.records,
      },
      webhook: {
        id: webhook?.id,
        endpoint: WEBHOOK_ENDPOINT,
        events: webhook?.events || ["email.received"],
      },
      supportAddress: "hello@redrocksdd.com",
      forwardsTo: "erichroeseler123@gmail.com",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "setup_failed" }, { status: 500 });
  }
}
