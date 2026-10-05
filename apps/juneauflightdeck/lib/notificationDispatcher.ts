import { promises as fs } from "node:fs";
import path from "node:path";
import { getDb, ensureDbTables } from "./db";

export interface NotificationPayload {
  deliveryId: string;
  dispatchedAt: string;
  recipientEmail: string;
  recipientPhone?: string;
  recipientName: string;
  shipName: string;
  cruiseLine: string;
  port: "juneau" | "skagway";
  portDate: string;
  operator: string;
  tourName: string;
  departureTime: string;
  partySize: number;
  checkoutUrl: string;
  cancellationPolicy: string;
  channel: "email" | "sms" | "both";
  status: "delivered" | "simulated_delivery" | "failed";
  emailSubject: string;
  emailBodyHtml: string;
  emailBodyText: string;
}

function getNotificationsDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "notifications");
  }
  return path.join(process.cwd(), "data", "notifications");
}

/**
 * Dispatches a seat drop notification alert.
 * Includes direct operator booking link, accurate operator-specific cancellation policy,
 * deduplicates against persistent Postgres storage, and records delivery to jfd_waitlist_notifications.
 */
export async function dispatchSeatDropNotification(params: {
  guestId: string;
  guestName: string;
  email: string;
  phone?: string;
  shipName: string;
  cruiseLine: string;
  port: "juneau" | "skagway";
  portDate: string;
  operator: string;
  tourName: string;
  departureTime: string;
  partySize: number;
  checkoutUrl: string;
  cancellationPolicy: string;
}): Promise<NotificationPayload | null> {
  const sql = getDb();

  // Deduplication check: Has a notification already been dispatched for this passenger + port date + departure slot?
  if (sql) {
    try {
      await ensureDbTables();
      const existing = await sql`
        SELECT delivery_id, status FROM jfd_waitlist_notifications
        WHERE entry_id = ${params.guestId}
          AND port_date = ${params.portDate}
          AND departure_time = ${params.departureTime}
        LIMIT 1;
      `;
      if (existing.length > 0) {
        console.log(
          `[NotificationDispatcher] Duplicate notification suppressed for ${params.guestId} on ${params.portDate} (${params.departureTime})`
        );
        return null;
      }
    } catch (err) {
      console.warn("[NotificationDispatcher] DB deduplication check error:", err);
    }
  }

  const deliveryId = `ALERT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dispatchedAt = new Date().toISOString();

  const portTitle = params.port === "juneau" ? "Juneau" : "Skagway";
  const emailSubject = `🚨 OPENING DETECTED: ${params.tourName} on ${params.portDate} (${portTitle})`;

  const emailBodyText = `Hello ${params.guestName},

An open helicopter slot matching your cruise port date on ${params.shipName} has just been detected by Juneau Flight Deck's 10:00 AM inventory sweep.

--- FLIGHT DETAILS ---
Tour: ${params.tourName}
Operator: ${params.operator}
Port: ${portTitle}, Alaska
Port Date: ${params.portDate}
Departure Time: ${params.departureTime}
Party Size: ${params.partySize} passenger(s)

--- DIRECT OPERATOR BOOKING LINK ---
Lock in your seats directly with the operator before public inventory fills:
${params.checkoutUrl}

--- OPERATOR CANCELLATION TERMS ---
${params.cancellationPolicy}

IMPORTANT NOTICE: This is an automated notification of detected availability based on our 10:00 AM fleet scan. Seats are NOT pre-held on your behalf and will remain open to the public until you complete checkout at the link above.

Juneau Flight Deck Dispatch Desk
hello@juneauflightdeck.com
`;

  const emailBodyHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <div style="background-color: #0f172a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">Juneau Flight Deck • Seat Drop Alert</h2>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Hello <strong>${params.guestName}</strong>,</p>
    <p>An open helicopter flight slot matching your cruise port date on <strong>${params.shipName}</strong> (${params.cruiseLine}) was just detected during our 10:00 AM fleet sweep.</p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #0f172a;">${params.tourName}</h3>
      <p style="margin: 4px 0;"><strong>Operator:</strong> ${params.operator}</p>
      <p style="margin: 4px 0;"><strong>Port:</strong> ${portTitle}, Alaska</p>
      <p style="margin: 4px 0;"><strong>Date:</strong> ${params.portDate}</p>
      <p style="margin: 4px 0;"><strong>Departure:</strong> ${params.departureTime}</p>
      <p style="margin: 4px 0;"><strong>Party Size:</strong> ${params.partySize} Passenger(s)</p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${params.checkoutUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 6px; display: inline-block;">
        Direct Operator Booking Link →
      </a>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 14px; border-radius: 6px; font-size: 13px; color: #92400e; margin-bottom: 20px;">
      <strong>Operator Cancellation Policy:</strong><br/>
      ${params.cancellationPolicy}
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
      <strong>Note on Availability:</strong> This alert notifies you of verified live inventory. Seats are not pre-held and remain open to public booking until completed at the operator link above.
    </p>
  </div>
</div>
`;

  let deliveryStatus: NotificationPayload["status"] = "simulated_delivery";

  // Check if live Resend API key is present
  const resendApiKey = process.env.RESEND_API_KEY || process.env.DCC_RESEND_API_KEY;
  if (resendApiKey && resendApiKey.startsWith("re_") && resendApiKey.length > 20) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);
      const res = await resend.emails.send({
        from: process.env.DEPLOY_TEST_EMAIL_FROM || "press@juneauflightdeck.com",
        to: params.email,
        subject: emailSubject,
        html: emailBodyHtml,
        text: emailBodyText,
      });
      if (res.data?.id) {
        deliveryStatus = "delivered";
      }
    } catch (err) {
      console.warn("[NotificationDispatcher] Resend delivery failed, falling back to recorded simulated dispatch:", err);
      deliveryStatus = "simulated_delivery";
    }
  }

  const payload: NotificationPayload = {
    deliveryId,
    dispatchedAt,
    recipientEmail: params.email,
    recipientPhone: params.phone,
    recipientName: params.guestName,
    shipName: params.shipName,
    cruiseLine: params.cruiseLine,
    port: params.port,
    portDate: params.portDate,
    operator: params.operator,
    tourName: params.tourName,
    departureTime: params.departureTime,
    partySize: params.partySize,
    checkoutUrl: params.checkoutUrl,
    cancellationPolicy: params.cancellationPolicy,
    channel: params.phone ? "both" : "email",
    status: deliveryStatus,
    emailSubject,
    emailBodyHtml,
    emailBodyText,
  };

  // Persistent storage in shared PostgreSQL database
  if (sql) {
    try {
      await ensureDbTables();
      await sql`
        INSERT INTO jfd_waitlist_notifications (
          delivery_id, entry_id, recipient_email, recipient_phone,
          tour_name, operator, port, port_date, departure_time,
          status, payload, dispatched_at
        ) VALUES (
          ${deliveryId}, ${params.guestId}, ${params.email}, ${params.phone || null},
          ${params.tourName}, ${params.operator}, ${params.port}, ${params.portDate},
          ${params.departureTime}, ${deliveryStatus}, ${JSON.stringify(payload)}::jsonb,
          ${new Date(dispatchedAt)}
        )
        ON CONFLICT (entry_id, port_date, departure_time) DO NOTHING;
      `;
    } catch (err) {
      console.warn("[NotificationDispatcher] DB insert failed:", err);
    }
  }

  try {
    const dir = getNotificationsDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${deliveryId}.json`),
      JSON.stringify(payload, null, 2),
      "utf8"
    );
  } catch (err) {
    console.warn("[NotificationDispatcher] Failed writing notification record to disk:", err);
  }

  return payload;
}
