import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { octoAuditLogs, octoBookings } from "@/lib/db/schema";
import { verifyOctoWebhookSignature } from "@/lib/octo/security";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Replay protection: cache of recently processed webhook event IDs
const processedEventIds = new Set<string>();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  const { supplierId } = await params;
  const rawBody = await req.text();
  const signature = req.headers.get("x-octo-signature") || req.headers.get("x-hub-signature-256");
  const eventId = req.headers.get("x-octo-event-id") || req.headers.get("x-request-id");

  // Replay protection
  if (eventId && processedEventIds.has(eventId)) {
    return NextResponse.json({ status: "IGNORED_DUPLICATE", eventId }, { status: 200 });
  }

  // Webhook signature verification when secret is configured
  const webhookSecret = process.env.OCTO_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    const isValid = verifyOctoWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }
  }

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON_BODY" }, { status: 400 });
  }

  if (eventId) {
    processedEventIds.add(eventId);
    // Keep set bounded
    if (processedEventIds.size > 10000) {
      const first = processedEventIds.values().next().value;
      if (first) processedEventIds.delete(first);
    }
  }

  // Audit log webhook receipt
  const db = getDb();
  if (db) {
    try {
      await db.insert(octoAuditLogs).values({
        action: `WEBHOOK_${(payload.event || "UNKNOWN").toUpperCase()}`,
        entityType: "SUPPLIER",
        entityId: supplierId,
        status: "RECEIVED",
        payload: {
          eventId,
          event: payload.event,
          bookingUuid: payload.booking?.uuid || payload.bookingUuid,
        },
      });

      // Update booking status if booking event
      if (payload.booking?.uuid && payload.booking?.status) {
        await db
          .update(octoBookings)
          .set({
            status: payload.booking.status,
            updatedAt: new Date(),
          })
          .where(eq(octoBookings.bookingUuid, payload.booking.uuid));
      }
    } catch (err: any) {
      console.error("Webhook processing error:", err.message);
    }
  }

  return NextResponse.json({ status: "PROCESSED", supplierId, eventId });
}
