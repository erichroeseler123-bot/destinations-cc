export const JFD_CHECKOUT_COOKIE_NAME = "jfd_checkout_session";
export const JFD_SESSION_AUDIENCE = "juneauflightdeck";
export const JFD_SESSION_KEY_VERSION = "v1";

export const JFD_CHECKOUT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 3600, // 1 hour checkout window
  path: "/",
};

function toBase64Url(buf: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buf.byteLength; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function stringToBase64Url(str: string): string {
  const enc = new TextEncoder();
  return toBase64Url(enc.encode(str));
}

async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signHmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signHmacSha256Base64Url(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toBase64Url(new Uint8Array(sigBuf));
}

function resolveSessionSecret(): string {
  const raw = process.env.JFD_SESSION_SECRET?.trim() || process.env.SESSION_SECRET?.trim();
  if (raw) {
    if (raw.startsWith("{")) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed[JFD_SESSION_KEY_VERSION]) return parsed[JFD_SESSION_KEY_VERSION];
        const first = Object.values(parsed)[0];
        if (typeof first === "string") return first;
      } catch {}
    }
    return raw;
  }
  return "jfd_dev_session_secret_not_for_production";
}

export async function signSessionTokenEdge(payload: {
  sessionId: string;
  contextId: string;
  expiresAt: number;
  audience?: string;
  keyVersion?: string;
}): Promise<string> {
  const kid = payload.keyVersion || JFD_SESSION_KEY_VERSION;
  const secret = resolveSessionSecret();
  const data = {
    v: 1,
    kid,
    sid: payload.sessionId,
    ctx: payload.contextId,
    aud: payload.audience || JFD_SESSION_AUDIENCE,
    exp: payload.expiresAt,
    iat: Date.now(),
  };

  const encodedData = stringToBase64Url(JSON.stringify(data));
  const signature = await signHmacSha256Base64Url(secret, encodedData);
  return `${encodedData}.${signature}`;
}

export async function redeemOpaqueContextEdge(contextId: string): Promise<{
  success: boolean;
  data?: any;
  errorCode?: string;
  message?: string;
  statusCode?: number;
}> {
  if (!contextId || !contextId.startsWith("dcc_ctx_")) {
    return {
      success: false,
      errorCode: "INVALID_CONTEXT_ID",
      message: "Context ID must follow dcc_ctx_<32hex> format.",
      statusCode: 400,
    };
  }

  const baseUrl = (
    process.env.DCC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_DCC_API_URL ||
    "https://api.destinationcommandcenter.com"
  ).replace(/\/+$/, "");

  const keyId =
    process.env.DCC_JFD_SERVICE_KEY_ID?.trim() ||
    process.env.INTERNAL_API_KEY_ID?.trim() ||
    "jfd_service_key";

  const secret =
    process.env.DCC_JFD_SERVICE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "";

  const pathname = `/api/v1/context/${encodeURIComponent(contextId)}/redeem`;
  const body = JSON.stringify({ owner: "juneauflightdeck" });
  const timestamp = String(Date.now());
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const bodyHash = await sha256Hex(body);
  const canonical = ["POST", pathname, "", timestamp, nonce, bodyHash].join("\n");
  const signature = await signHmacSha256Hex(secret, canonical);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-dcc-key-id": keyId,
    "x-dcc-timestamp": timestamp,
    "x-dcc-nonce": nonce,
    "x-dcc-content-sha256": bodyHash,
    "x-dcc-signature": signature,
  };

  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  }

  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method: "POST",
      headers,
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
      data: json.data,
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      success: false,
      errorCode: "NETWORK_ERROR",
      message: err.message || "Failed to contact DCC Context Authority.",
      statusCode: 502,
    };
  }
}
