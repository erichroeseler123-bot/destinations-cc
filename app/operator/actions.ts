"use server";

import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";

export async function burnTransmission(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id || !redis) return;
  
  await redis.del(`invite_req:${id}`);
  revalidatePath("/operator");
}

async function generateSquarePaymentLink(
  merchantId: string,
  title: string,
  price: number,
  partySize: number,
  happeningId: string
): Promise<string> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (token && locationId) {
    try {
      const response = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Square-Version": "2024-12-18"
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          quick_pay: {
            name: `${title} (Party of ${partySize})`,
            price_amount: {
              amount: Math.round(price * partySize * 100), // in cents
              currency: "USD"
            },
            location_id: locationId
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_link?.url) {
          return data.payment_link.url;
        }
      } else {
        const errText = await response.text();
        console.error("Square API payment link creation failed:", errText);
      }
    } catch (err) {
      console.error("Failed to connect to Square API:", err);
    }
  }

  // Fallback to partner's static squareMerchantId or fallback parameters
  const resolvedMerchantId = merchantId || "MOCK_MERCHANT";
  return `https://checkout.square.site/merchant/${resolvedMerchantId}/checkout/INVITE_PASS?amt=${price}&qty=${partySize}&id=${happeningId}`;
}

export async function authorizeTransmission(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id || !redis) return;

  const data = await redis.get(`invite_req:${id}`);
  if (!data) return;

  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  
  // Resolve partner configuration for placeId to get Merchant ID
  let merchantId = "";
  if (parsed.placeId) {
    try {
      const partnerConfig = await redis.get(`dcc:partner:place:${parsed.placeId}`);
      if (partnerConfig) {
        const partner = typeof partnerConfig === "string" ? JSON.parse(partnerConfig) : partnerConfig;
        merchantId = partner.squareMerchantId || "";
      }
    } catch (err) {
      console.error("Failed to fetch partner config during authorization:", err);
    }
  }

  // Generate the checkout URL
  const checkoutUrl = await generateSquarePaymentLink(
    merchantId,
    parsed.happeningTitle || "Private Happening",
    parsed.price || 0,
    parsed.partySize || 1,
    parsed.happeningId || "happening-id"
  );

  parsed.status = "AUTHORIZED";
  parsed.checkoutUrl = checkoutUrl;

  await redis.set(`invite_req:${id}`, JSON.stringify(parsed));
  revalidatePath("/operator");
}
