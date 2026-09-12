import { appendFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

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
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteRequestBody;

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

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { ok: false, error: "Please provide a phone number or email address so we can send your quote." },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const quoteRecord = {
      id: `somerset-quote-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
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
    };

    console.log("[SOMERSET_QUOTE_RECEIVED]", JSON.stringify(quoteRecord));

    try {
      const outDir = path.join(process.cwd(), "data", "quotes");
      const outFile = path.join(outDir, "somerset-quotes.jsonl");
      await mkdir(outDir, { recursive: true });
      await appendFile(outFile, `${JSON.stringify(quoteRecord)}\n`, "utf8");
    } catch {
      // In serverless environments (AWS Lambda / Vercel), /var/task is read-only.
      // Fallback to os.tmpdir()
      try {
        const tmpFile = path.join(os.tmpdir(), "somerset-quotes.jsonl");
        await appendFile(tmpFile, `${JSON.stringify(quoteRecord)}\n`, "utf8");
      } catch (e) {
        console.error("Failed writing quote to tmpdir:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Quote request received! Our dispatch team will review your details and text/call you with vehicle availability and flat pricing.",
      quoteId: quoteRecord.id,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Failed to process quote request: ${errorMsg}` },
      { status: 500 }
    );
  }
}
