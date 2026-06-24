import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    if (!redis) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing transmission ID" },
        { status: 400 }
      );
    }

    const data = await redis.get(`invite_req:${id}`);
    if (!data) {
      return NextResponse.json(
        { error: "Transmission record not found" },
        { status: 404 }
      );
    }

    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return NextResponse.json({
      success: true,
      transmission: parsed
    });
  } catch (error) {
    console.error("Invite request lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error during lookup." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!redis) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { happeningId, happeningTitle, partySize, note, placeId, price, phone } = body;

    // Validate payload fields
    if (!happeningId || !happeningTitle || !partySize || !note || !placeId || price === undefined || !phone) {
      return NextResponse.json(
        { error: "Missing required payload parameters" },
        { status: 400 }
      );
    }

    // Generate unique transmission ID
    const transmissionId = crypto.randomUUID();

    const requestPayload = {
      transmissionId,
      happeningId,
      happeningTitle,
      partySize: Number(partySize),
      note,
      placeId,
      price: Number(price),
      phone,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    // Save payload to Upstash Redis
    await redis.set(`invite_req:${transmissionId}`, JSON.stringify(requestPayload));

    return NextResponse.json({
      success: true,
      message: "Transmission received and logged successfully",
      transmissionId,
    });
  } catch (error) {
    console.error("Invite request processing error:", error);
    return NextResponse.json(
      { error: "Internal server error. Database transmission abort." },
      { status: 500 }
    );
  }
}
