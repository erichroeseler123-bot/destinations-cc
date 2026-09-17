import { signServiceRequest } from "@/lib/dcc/auth/hmac-service-auth";
import type { DccContextRedeemResponse } from "@/lib/dcc/context/schema";

export interface ContextRedeemResult {
  success: boolean;
  data?: DccContextRedeemResponse;
  errorCode?: string;
  message?: string;
  statusCode?: number;
}

export async function redeemOpaqueContext(
  contextId: string,
  options?: { baseUrl?: string; keyId?: string; secret?: string }
): Promise<ContextRedeemResult> {
  if (!contextId || !contextId.startsWith("dcc_ctx_")) {
    return {
      success: false,
      errorCode: "INVALID_CONTEXT_ID",
      message: "Context ID must follow the dcc_ctx_<32hex> format.",
      statusCode: 400,
    };
  }

  const baseUrl = (
    options?.baseUrl ||
    process.env.DCC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_DCC_API_URL ||
    "https://api.destinationcommandcenter.com"
  ).replace(/\/+$/, "");

  const keyId =
    options?.keyId ||
    process.env.DCC_JFD_SERVICE_KEY_ID?.trim() ||
    process.env.INTERNAL_API_KEY_ID?.trim() ||
    "jfd_service_key";

  const secret =
    options?.secret ||
    process.env.DCC_JFD_SERVICE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "";

  const pathname = `/api/v1/context/${encodeURIComponent(contextId)}/redeem`;
  const body = JSON.stringify({ owner: "juneauflightdeck" });

  const signed = signServiceRequest({
    keyId,
    secret,
    method: "POST",
    pathname,
    body,
  });

  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...signed.headers,
      },
      body,
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        errorCode: json.errorCode || "REDEMPTION_FAILED",
        message: json.message || `Redemption failed with status ${response.status}`,
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data: json.data as DccContextRedeemResponse,
      statusCode: 200,
    };
  } catch (error: any) {
    return {
      success: false,
      errorCode: "NETWORK_ERROR",
      message: error.message || "Failed to contact DCC Context Authority.",
      statusCode: 502,
    };
  }
}
