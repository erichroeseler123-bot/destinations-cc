import { recordNotification, type WaitlistSubmission } from "./db";
import type { TourDeparture } from "./providerAdapter";

export interface AlertDispatchResult {
  sent: boolean;
  channel: "email" | "simulated";
  error?: string;
  unsubscribeUrl: string;
}

/**
 * Formats and dispatches a seat-opening alert to a waitlist subscriber.
 * Includes required disclaimers and tokenized unsubscribe link.
 */
export async function dispatchWaitlistAlert(
  submission: WaitlistSubmission,
  departure: TourDeparture
): Promise<AlertDispatchResult> {
  const unsubscribeUrl = `https://welcometotheswamp.com/api/waitlist/unsubscribe?token=${submission.unsubscribeToken}`;
  const totalParty = submission.adults + submission.childrenCount;
  const isDirectCheckout =
    departure.bookingUrl.includes("/checkout") ||
    departure.bookingUrl.includes("/book") ||
    departure.bookingUrl.includes("fareharbor.com/embeds/book");

  const actionLabel = isDirectCheckout
    ? "Continue to Checkout →"
    : "View Tour & Booking Options →";

  const emailSubject = `Airboat Opening for ${submission.travelDate}: ${departure.departureTimeDisplay} Departure`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0a09; color: #f5f5f4; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #1c1917; border-radius: 12px; padding: 24px; border: 1px solid #292524;">
    <h2 style="color: #fbbf24; margin-top: 0;">Matching Airboat Departure Available</h2>
    
    <p style="color: #d6d3d1; font-size: 15px; line-height: 1.5;">
      Hi ${submission.name ? submission.name : "there"}, a departure matching your saved request for <strong>${submission.travelDate}</strong> is currently open for your party of <strong>${totalParty}</strong>:
    </p>

    <div style="background: #0c0a09; border: 1px solid #44403c; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #ffffff; margin: 0 0 6px 0; font-size: 18px;">
        ${departure.departureTimeDisplay} — ${departure.operatorName}
      </h3>
      <p style="color: #fbbf24; margin: 0 0 10px 0; font-weight: 600; font-size: 14px;">
        ${departure.title}
      </p>
      <div style="color: #a8a29e; font-size: 13px; line-height: 1.6;">
        <div>• <strong>Ride Style:</strong> ${departure.boatType === "small_airboat" ? "Small Airboat (Min Age 5)" : "Large Airboat (All Ages)"}</div>
        <div>• <strong>Transportation:</strong> ${departure.transportation === "hotel_pickup" ? `Hotel Pickup (${departure.pickupWindowDisplay || "75 min prior"})` : `Self-Drive (Dock check-in: ${departure.dockArrivalTimeDisplay})`}</div>
        <div>• <strong>Estimated Group Base Fare:</strong> $${departure.totalPrice}</div>
        <div>• <strong>Availability Status:</strong> ${departure.availabilityStatusText}</div>
      </div>
    </div>

    <!-- IMPORTANT FIRST-COME DISCLAIMER -->
    <div style="background: #292524; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; font-size: 13px; color: #fef3c7; margin-bottom: 20px;">
      <strong>Please Note:</strong> This alert does not hold or reserve seats. Openings are available on a first-come, first-served basis and can sell out at any time.
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${departure.bookingUrl}" style="display: inline-block; background: #fbbf24; color: #0c0a09; padding: 14px 28px; border-radius: 8px; font-weight: 800; font-size: 15px; text-decoration: none;">
        ${actionLabel}
      </a>
      <span style="display: block; font-size: 12px; color: #a8a29e; margin-top: 8px;">
        Choose your tour here and complete your reservation through the checkout shown.
      </span>
    </div>

    <hr style="border: 0; border-top: 1px solid #292524; margin: 24px 0;" />

    <p style="font-size: 12px; color: #78716c; line-height: 1.5; margin: 0;">
      You received this alert because you saved an opening request on welcometotheswamp.com.<br />
      If you no longer need this alert, you can <a href="${unsubscribeUrl}" style="color: #fbbf24; text-decoration: underline;">unsubscribe with one click</a>.
    </p>
  </div>
</body>
</html>
  `.trim();

  const resendKey = process.env.RESEND_API_KEY?.trim();
  let channel: "email" | "simulated" = "simulated";
  let dispatchError: string | undefined;

  if (resendKey && resendKey.length > 20 && !resendKey.includes("[SENSITIVE]")) {
    try {
      const fromEmail = process.env.MAIL_FROM_WTS || "Welcome to the Swamp <alerts@welcometotheswamp.com>";
      const upstream = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [submission.email],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (upstream.ok) {
        channel = "email";
      } else {
        const errJson = await upstream.json().catch(() => null);
        dispatchError = errJson?.message || "Resend upstream rejected alert email";
      }
    } catch (err: any) {
      dispatchError = err?.message || "Network error dispatching alert email";
    }
  }

  // Durably record the notification to prevent duplicates
  await recordNotification({
    submissionId: submission.id,
    departureId: departure.id,
    travelDate: submission.travelDate,
    recipientEmail: submission.email,
    operatorName: departure.operatorName,
    departureTime: departure.departureTime,
    status: dispatchError ? "failed" : channel === "email" ? "delivered" : "simulated",
  });

  return {
    sent: !dispatchError,
    channel,
    error: dispatchError,
    unsubscribeUrl,
  };
}
