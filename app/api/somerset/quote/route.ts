import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  persistDurableTransactionalSubmission,
  resolveRuntimeEnvironmentTag,
} from "@/lib/dcc/storage/durableTransactionalStore";

export const runtime = "nodejs";

interface QuoteRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  concertDate?: string;
  artistOrEvent?: string;
  pickupCity?: string;
  pickupAddress?: string;
  groupSize?: number | string;
  vehiclePreference?: string;
  notes?: string;
  isTest?: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function maybeSendSomersetDispatchEmail(record: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  concertDate: string | null;
  artistOrEvent: string;
  pickupCity: string;
  pickupAddress: string | null;
  groupSize: number;
  vehiclePreference: string;
  notes: string | null;
  environment: string;
  isTest: boolean;
}): Promise<boolean> {
  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  const fromEmail = (
    process.env.SOMERSET_FROM_EMAIL ||
    process.env.PARR_PRIVATE_FROM_EMAIL ||
    process.env.ARGO_FROM_EMAIL ||
    ""
  ).trim();
  const toEmail = (
    process.env.SOMERSET_DISPATCH_TO_EMAIL ||
    process.env.EARTHOS_APPROVAL_TO ||
    ""
  )
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (!resendKey || !fromEmail || toEmail.length === 0) {
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
        to: toEmail,
        reply_to: record.email || undefined,
        subject: `[Somerset Quote${record.isTest ? " TEST" : ""}] ${record.artistOrEvent} — ${record.name} (${record.id})`,
        text: [
          `Quote ID: ${record.id}`,
          `Environment: ${record.environment}`,
          `Name: ${record.name}`,
          `Email: ${record.email || "Not provided"}`,
          `Phone: ${record.phone || "Not provided"}`,
          `Concert Date: ${record.concertDate || "Not specified"}`,
          `Artist / Event: ${record.artistOrEvent}`,
          `Pickup City: ${record.pickupCity}`,
          `Pickup Address: ${record.pickupAddress || "Not specified"}`,
          `Group Size: ${record.groupSize}`,
          `Vehicle Preference: ${record.vehiclePreference}`,
          `Notes: ${record.notes || "None"}`,
        ].join("\n"),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as QuoteRequestBody;

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const concertDate = (body.concertDate || "").trim();
    const artistOrEvent = (body.artistOrEvent || "").trim();
    const pickupCity = (body.pickupCity || "").trim();
    const pickupAddress = (body.pickupAddress || "").trim();
    const groupSize = Number(body.groupSize) || 1;
    const vehiclePreference = (body.vehiclePreference || "van").trim();
    const notes = (body.notes || "").trim();
    const isTest = Boolean(body?.isTest);
    const environment = resolveRuntimeEnvironmentTag();

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Please enter your name." },
        { status: 400 },
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Please provide a phone number or email address so we can send your quote.",
        },
        { status: 400 },
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const quoteId = `somerset-quote-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();
    const quoteRecord = {
      id: quoteId,
      createdAt,
      name,
      email: email || null,
      phone: phone || null,
      concertDate: concertDate || null,
      artistOrEvent: artistOrEvent || "Somerset Amphitheater Concert",
      pickupCity: pickupCity || "Twin Cities",
      pickupAddress: pickupAddress || null,
      groupSize,
      vehiclePreference,
      notes: notes || null,
      source: "shuttletosomersetamphitheater.com",
      status: "pending_dispatch",
      environment,
      isTest,
    };

    const persisted = await persistDurableTransactionalSubmission({
      submissionId: quoteId,
      channel: "somerset-quote",
      status: "pending_dispatch",
      summaryNote: `Somerset quote ${quoteId} for ${quoteRecord.artistOrEvent} (${groupSize} pax)`,
      payload: quoteRecord,
      environment,
      isTest,
      createdAt,
    });

    if (!persisted.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Quote request persistence is temporarily unavailable. Please try again shortly.",
          emailSent: false,
        },
        { status: 503 },
      );
    }

    const emailSent = await maybeSendSomersetDispatchEmail(quoteRecord);

    return NextResponse.json({
      ok: true,
      message:
        "Quote request received! Our dispatch team will review your details and follow up with vehicle availability and flat pricing.",
      quoteId: quoteRecord.id,
      environment,
      isTest,
      emailSent: Boolean(emailSent),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to process quote request: ${errorMsg}` },
      { status: 500 },
    );
  }
}
