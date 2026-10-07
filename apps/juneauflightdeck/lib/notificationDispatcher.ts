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
  isTest?: boolean;
}): Promise<NotificationPayload | null> {
  const sql = getDb();
  const resendApiKey = process.env.RESEND_API_KEY || process.env.DCC_RESEND_API_KEY;
  const isRealProviderConfigured = Boolean(
    resendApiKey && resendApiKey.startsWith("re_") && resendApiKey.length > 20
  );

  // Deduplication check:
  // - If real delivery is configured, ONLY an actual 'delivered' record suppresses dispatch.
  //   Simulation records must NEVER block the first real delivery to an actual inbox.
  // - If running in simulated mode, suppress redundant duplicate simulations.
  if (sql) {
    try {
      await ensureDbTables();
      const existing = await sql`
        SELECT delivery_id, status FROM jfd_waitlist_notifications
        WHERE entry_id = ${params.guestId}
          AND port_date = ${params.portDate}
          AND departure_time = ${params.departureTime}
          AND ${
            isRealProviderConfigured
              ? sql`status = 'delivered'`
              : sql`status IN ('delivered', 'simulated_delivery')`
          }
        LIMIT 1;
      `;
      if (existing.length > 0) {
        console.log(
          `[NotificationDispatcher] Duplicate notification suppressed: already ${existing[0].status} for ${params.guestId} on ${params.portDate} (${params.departureTime})`
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

--- OPERATOR POLICIES & GUARANTEES ---
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

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin-bottom: 20px;">
      <strong style="color: #78350f; font-size: 14px;">Operator Cancellation & Weather Policies:</strong>
      <div style="margin-top: 8px; line-height: 1.6;">
        ${params.cancellationPolicy.split("•").filter(Boolean).map((part: string) => `<p style="margin: 4px 0;">• ${part.trim()}</p>`).join("")}
      </div>
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
      <strong>Note on Availability:</strong> This alert notifies you of verified live inventory. Seats are not pre-held and remain open to public booking until completed at the operator link above.
    </p>
  </div>
</div>
`;

  let deliveryStatus: NotificationPayload["status"] = "simulated_delivery";

  // Check if live Resend API key is present
  if (isRealProviderConfigured && resendApiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);
      const res = await resend.emails.send({
        from: process.env.DEPLOY_TEST_EMAIL_FROM || "alerts@juneauflightdeck.com",
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
    channel: "email",
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
          status, payload, is_test, dispatched_at
        ) VALUES (
          ${deliveryId}, ${params.guestId}, ${params.email}, ${params.phone || null},
          ${params.tourName}, ${params.operator}, ${params.port}, ${params.portDate},
          ${params.departureTime}, ${deliveryStatus}, ${JSON.stringify(payload)}::jsonb,
          ${Boolean(params.isTest)},
          ${new Date(dispatchedAt)}
        )
        ON CONFLICT (entry_id, port_date, departure_time) 
        DO UPDATE SET 
          delivery_id = EXCLUDED.delivery_id,
          status = EXCLUDED.status,
          payload = EXCLUDED.payload,
          is_test = EXCLUDED.is_test,
          dispatched_at = EXCLUDED.dispatched_at
        WHERE jfd_waitlist_notifications.status != 'delivered';
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

/**
 * Dispatches an intake notification to the operations/dispatch team when a new waitlist request is submitted.
 * Records the intake event in persistent database (jfd_waitlist_notifications) and backup storage.
 */
export async function dispatchWaitlistIntakeNotification(entry: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cruiseLine: string;
  shipName: string;
  portCity: string;
  portDate: string;
  juneauDate?: string;
  skagwayDate?: string;
  tourType: string;
  partySize: number;
  bookingMode: string;
  notes?: string;
  isTest?: boolean;
}): Promise<NotificationPayload | null> {
  const sql = getDb();
  const resendApiKey = process.env.RESEND_API_KEY || process.env.DCC_RESEND_API_KEY;
  const isRealProviderConfigured = Boolean(
    resendApiKey && resendApiKey.startsWith("re_") && resendApiKey.length > 20
  );

  // Deduplication check: Do not re-dispatch intake alert if already recorded
  if (sql) {
    try {
      await ensureDbTables();
      const existing = await sql`
        SELECT delivery_id, status FROM jfd_waitlist_notifications
        WHERE entry_id = ${entry.id}
          AND port_date = ${entry.portDate}
          AND departure_time = 'Intake Alert'
          AND ${
            isRealProviderConfigured
              ? sql`status = 'delivered'`
              : sql`status IN ('delivered', 'simulated_delivery')`
          }
        LIMIT 1;
      `;
      if (existing.length > 0) {
        console.log(`[NotificationDispatcher] Intake notification suppressed for ${entry.id}: already ${existing[0].status}.`);
        return null;
      }
    } catch (err) {
      console.warn("[NotificationDispatcher] DB intake deduplication check error:", err);
    }
  }

  const deliveryId = `INTAKE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dispatchedAt = new Date().toISOString();
  const teamEmail = process.env.TEAM_NOTIFICATION_EMAIL || process.env.DISPATCH_NOTIFICATION_EMAIL || "dispatch@juneauflightdeck.com";

  const emailSubject = `✈️ NEW WAITLIST REQUEST: ${entry.name} (${entry.partySize}p) - ${entry.shipName} on ${entry.portDate}`;

  const emailBodyText = `NEW HELICOPTER SEAT REQUEST RECEIVED:
ID: ${entry.id}
Passenger: ${entry.name}
Email: ${entry.email}
Phone: ${entry.phone || "Not provided"}
Ship: ${entry.shipName} (${entry.cruiseLine})
Port Date: ${entry.portDate}
Port: ${entry.portCity}
Tour Requested: ${entry.tourType}
Party Size: ${entry.partySize}
Alert Preference: ${entry.bookingMode}
Notes: ${entry.notes || "None"}
`;

  const emailBodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #081c2a; color: #eef6fb; border-radius: 14px;">
  <h2 style="color: #f0b35b; margin-top: 0;">✈️ New Waitlist Request Received</h2>
  <p style="font-size: 14px; color: #9ed9ff;">A new passenger availability-alert watch has been activated.</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0;">
    <tr><td style="padding: 6px 0; color: #94a3b8;">Request ID:</td><td style="font-weight: bold; color: #ffffff;">${entry.id}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Passenger:</td><td style="font-weight: bold; color: #ffffff;">${entry.name}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Email:</td><td style="color: #38bdf8;">${entry.email}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Phone:</td><td style="color: #ffffff;">${entry.phone || "None"}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Ship:</td><td style="color: #ffffff;">${entry.shipName} (${entry.cruiseLine})</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Port Date:</td><td style="color: #ffffff;">${entry.portDate}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Tour Type:</td><td style="color: #ffd596; font-weight: bold;">${entry.tourType}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Party Size:</td><td style="color: #ffffff;">${entry.partySize}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Mode:</td><td style="color: #86efac;">${entry.bookingMode}</td></tr>
    <tr><td style="padding: 6px 0; color: #94a3b8;">Notes:</td><td style="color: #ffffff;">${entry.notes || "None"}</td></tr>
  </table>
</div>
`;

  let deliveryStatus: NotificationPayload["status"] = "simulated_delivery";
  if (isRealProviderConfigured && resendApiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);
      const res = await resend.emails.send({
        from: process.env.DEPLOY_TEST_EMAIL_FROM || "press@juneauflightdeck.com",
        to: teamEmail,
        subject: emailSubject,
        html: emailBodyHtml,
        text: emailBodyText,
      });
      if (res.data?.id) {
        deliveryStatus = "delivered";
      }
    } catch (err) {
      console.warn("[NotificationDispatcher] Intake email delivery failed:", err);
      deliveryStatus = "simulated_delivery";
    }
  }

  const payload: NotificationPayload = {
    deliveryId,
    dispatchedAt,
    recipientEmail: teamEmail,
    recipientPhone: entry.phone,
    recipientName: "Team Dispatch",
    shipName: entry.shipName,
    cruiseLine: entry.cruiseLine,
    port: entry.portCity === "skagway" ? "skagway" : "juneau",
    portDate: entry.portDate,
    operator: "Juneau Flight Deck Dispatch",
    tourName: entry.tourType,
    departureTime: "Intake Alert",
    partySize: entry.partySize,
    checkoutUrl: "https://juneauflightdeck.com/helicopter-waitlist",
    cancellationPolicy: "Part 135 Operator Weather Guarantee",
    channel: "email",
    status: deliveryStatus,
    emailSubject,
    emailBodyHtml,
    emailBodyText,
  };

  if (sql) {
    try {
      await ensureDbTables();
      await sql`
        INSERT INTO jfd_waitlist_notifications (
          delivery_id, entry_id, recipient_email, recipient_phone,
          tour_name, operator, port, port_date, departure_time,
          status, payload, is_test, dispatched_at
        ) VALUES (
          ${deliveryId}, ${entry.id}, ${teamEmail}, ${entry.phone || null},
          ${entry.tourType}, ${'Juneau Flight Deck Dispatch'}, ${entry.portCity}, ${entry.portDate},
          ${'Intake Alert'}, ${deliveryStatus}, ${JSON.stringify(payload)}::jsonb,
          ${Boolean(entry.isTest)},
          ${new Date(dispatchedAt)}
        )
        ON CONFLICT (entry_id, port_date, departure_time)
        DO UPDATE SET
          delivery_id = EXCLUDED.delivery_id,
          status = EXCLUDED.status,
          payload = EXCLUDED.payload,
          is_test = EXCLUDED.is_test,
          dispatched_at = EXCLUDED.dispatched_at;
      `;
    } catch (err) {
      console.warn("[NotificationDispatcher] DB intake notification insert failed:", err);
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
    console.warn("[NotificationDispatcher] Failed writing intake notification to disk:", err);
  }

  return payload;
}
