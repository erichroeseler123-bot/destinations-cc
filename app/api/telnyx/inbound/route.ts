import { NextRequest, NextResponse } from "next/server";
import { generateTelnyxAiReply } from "@/lib/telnyx/ai";
import { sendTelnyxSms } from "@/lib/telnyx/client";
import { getTelnyxConfig } from "@/lib/telnyx/config";
import { parseTelnyxInboundEvent, verifyTelnyxWebhookRequest } from "@/lib/telnyx/webhook";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const config = getTelnyxConfig();
  return NextResponse.json(
    {
      ok: true,
      provider: "telnyx",
      route: "/api/telnyx/inbound",
      apiConfigured: Boolean(config.apiKey),
      fromConfigured: Boolean(config.fromNumber),
      messagingProfileConfigured: Boolean(config.messagingProfileId),
      tokenProtected: Boolean(config.webhookSecret),
      hint: config.webhookSecret
        ? `Use this full URL in Telnyx: ${req.nextUrl.origin}/api/telnyx/inbound?token=${config.webhookSecret}`
        : `Use this URL in Telnyx: ${req.nextUrl.origin}/api/telnyx/inbound`,
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  if (!verifyTelnyxWebhookRequest(req)) {
    return NextResponse.json({ ok: false, error: "invalid_webhook_token" }, { status: 401 });
  }

  const payload = (await req.json()) as unknown;
  const inbound = parseTelnyxInboundEvent(payload);
  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const reply = await generateTelnyxAiReply({
      from: inbound.from || "unknown",
      text: inbound.text,
    });

    const outbound = await sendTelnyxSms({
      to: inbound.from || "",
      text: reply,
    });

    return NextResponse.json({
      ok: true,
      inboundMessageId: inbound.messageId,
      outboundMessageId: outbound.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "telnyx_inbound_failed",
      },
      { status: 500 }
    );
  }
}
