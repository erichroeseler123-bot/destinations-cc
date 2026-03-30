function read(name: string) {
  return String(process.env[name] || "").trim();
}

function pickFirst(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getSquareEnvironment() {
  const explicit = pickFirst(process.env.SQUARE_ENVIRONMENT);
  if (explicit) return explicit.toLowerCase();

  if (pickFirst(process.env.SQUARE_sandbox_access_token, process.env.SQUARE_Sandbox_App_ID)) {
    return "sandbox";
  }

  return "production";
}

function getSquareLocationId() {
  return pickFirst(
    process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    process.env.SQUARE_LOCATION_ID,
    process.env.SQUARE_location_id
  );
}

function getSquareAccessToken() {
  const env = getSquareEnvironment();
  if (env === "sandbox") {
    return pickFirst(
      process.env.SQUARE_ACCESS_TOKEN,
      process.env.SQUARE_access_token,
      process.env.SQUARE_sandbox_access_token
    );
  }

  return pickFirst(
    process.env.SQUARE_ACCESS_TOKEN,
    process.env.SQUARE_access_token,
    process.env.SQUARE_sandbox_access_token
  );
}

function getSquareBaseUrl() {
  return getSquareEnvironment() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

export async function createSquarePaymentLink(input: {
  origin: string;
  token: string;
  slotId: string;
  quantity: number;
  amountUsd: number;
  dateLabel: string;
  departLabel: string;
  phone: string;
}) {
  const accessToken = getSquareAccessToken();
  const locationId = getSquareLocationId();
  if (!accessToken) throw new Error("missing_square_access_token");
  if (!locationId) throw new Error("missing_square_location_id");

  const response = await fetch(`${getSquareBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2026-01-22",
    },
    body: JSON.stringify({
      idempotency_key: input.token,
      quick_pay: {
        name: "Red Rocks Day Pass",
        price_money: {
          amount: Math.round(input.amountUsd * 100),
          currency: "USD",
        },
        location_id: locationId,
      },
      description: `${input.dateLabel} ${input.departLabel} outbound from Union Station`,
      checkout_options: {
        redirect_url: `${input.origin}/t/${encodeURIComponent(input.token)}`,
      },
      pre_populated_data: {
        buyer_phone_number: input.phone,
      },
      payment_note: `${input.slotId} x${input.quantity}`,
    }),
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.detail || "square_payment_link_failed");
  }

  return {
    id: String(data.payment_link?.id || ""),
    url: String(data.payment_link?.url || ""),
    orderId: data.payment_link?.order_id ? String(data.payment_link.order_id) : null,
  };
}

export async function getSquareTransaction(transactionId: string) {
  const accessToken = getSquareAccessToken();
  const locationId = getSquareLocationId();
  if (!accessToken) throw new Error("missing_square_access_token");
  if (!locationId) throw new Error("missing_square_location_id");

  const response = await fetch(
    `${getSquareBaseUrl()}/v2/locations/${encodeURIComponent(locationId)}/transactions/${encodeURIComponent(transactionId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2026-01-22",
      },
      cache: "no-store",
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.detail || "square_transaction_fetch_failed");
  }
  return data as {
    transaction?: {
      id?: string;
      order_id?: string;
      tenders?: Array<{
        id?: string;
        amount_money?: { amount?: number };
        card_details?: {
          card?: {
            cardholder_name?: string | null;
          };
        };
      }>;
    };
  };
}

export async function getSquarePayment(paymentId: string) {
  const accessToken = getSquareAccessToken();
  if (!accessToken) throw new Error("missing_square_access_token");

  const response = await fetch(`${getSquareBaseUrl()}/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2026-01-22",
    },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.detail || "square_payment_fetch_failed");
  }
  return data as {
    payment?: {
      id?: string;
      status?: string;
      order_id?: string;
      amount_money?: { amount?: number };
      card_details?: {
        card?: {
          cardholder_name?: string | null;
        };
      };
      buyer_details?: {
        contact?: {
          given_name?: string | null;
          family_name?: string | null;
        };
      };
    };
  };
}

export async function refundSquarePayment(input: {
  paymentId: string;
  amountUsd: number;
  reason: string;
  idempotencyKey: string;
}) {
  const accessToken = getSquareAccessToken();
  if (!accessToken) throw new Error("missing_square_access_token");

  const response = await fetch(`${getSquareBaseUrl()}/v2/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2026-01-22",
    },
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      payment_id: input.paymentId,
      reason: input.reason,
      amount_money: {
        amount: Math.round(input.amountUsd * 100),
        currency: "USD",
      },
    }),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.detail || "square_refund_failed");
  }
  return data as {
    refund?: {
      id?: string;
      status?: string;
      payment_id?: string;
    };
  };
}

export function getSquareRedirectTransactionId(searchParams: {
  transactionId?: string;
  transaction_id?: string;
}) {
  return String(searchParams.transactionId || searchParams.transaction_id || "").trim();
}
