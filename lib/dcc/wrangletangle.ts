import { sendTelnyxSms } from "@/lib/telnyx/client";
import type { StoredOrder } from "@/lib/orders";

export interface Driver {
  name: string;
  phone: string;
  vehicle: string;
}

export const DEFAULT_DRIVERS: Driver[] = [
  { name: "Marcus", phone: "+17155550143", vehicle: "Chevy Suburban (Fleet #101)" },
  { name: "Sarah", phone: "+17155550188", vehicle: "Chevy Suburban (Fleet #102)" },
  { name: "David", phone: "+17155550199", vehicle: "10-Passenger Van (Fleet #201)" },
  { name: "Elena", phone: "+17155550212", vehicle: "14-Passenger Sprinter (Fleet #301)" },
];

/**
 * Formats a clean, high-urgency DCC dispatch manifest for drivers.
 */
export function formatDispatchManifest(order: StoredOrder): string {
  const customerName = order.customer?.name || "Valued Guest";
  const customerPhone = order.customer?.phone || "N/A";
  const product = order.productTitle || order.product || "Private Transport";
  const date = order.date || "N/A";
  const time = order.pickupTime || "N/A";
  const pickup = order.pickup || "N/A";
  const dropoff = order.dropoff || "N/A";
  const specialRequests = order.specialRequests ? `\nNote: ${order.specialRequests}` : "";

  return `[DCC DISPATCH MANIFEST]
Order: ${order.orderId}
Trip: ${date} @ ${time}
Product: ${product}
Pickup: ${pickup}
Dropoff: ${dropoff}
Client: ${customerName} (${customerPhone})${specialRequests}
Reply CONFIRM to claim this run.`;
}

/**
 * Blasts the dispatch manifest 1-on-1 to the fleet of drivers via WrangleTangle SMS client.
 */
export async function blastDispatchManifest(order: StoredOrder): Promise<{ success: boolean; dispatchedTo: string[] }> {
  let drivers = DEFAULT_DRIVERS;
  const envDriversRaw = process.env.WRANGLETANGLE_DRIVERS;
  if (envDriversRaw) {
    try {
      drivers = JSON.parse(envDriversRaw);
    } catch {
      // Keep defaults
    }
  }

  const manifestText = formatDispatchManifest(order);
  const dispatchedTo: string[] = [];

  for (const driver of drivers) {
    try {
      await sendTelnyxSms({
        to: driver.phone,
        text: manifestText,
      });
      dispatchedTo.push(driver.name);
    } catch (err) {
      console.error(`WrangleTangle: Failed to dispatch to ${driver.name} (${driver.phone}):`, err);
    }
  }

  return {
    success: dispatchedTo.length > 0,
    dispatchedTo,
  };
}
