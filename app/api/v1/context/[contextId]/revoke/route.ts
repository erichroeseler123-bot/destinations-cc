import { NextRequest, NextResponse } from "next/server";
import { verifyServiceRequestHeaders } from "@/lib/dcc/auth/hmac-service-auth";
import { revokeContext } from "@/lib/dcc/context/service";

export const runtime = "nodejs";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-dcc-key-id, x-dcc-timestamp, x-dcc-nonce, x-dcc-signature, x-dcc-content-sha256"
  );
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

interface RouteParams {
  params: Promise<{ contextId: string }> | { contextId: string };
}

export async function POST(request: NextRequest, context: RouteParams) {
  const resolvedParams = await Promise.resolve(context.params);
  const contextId = resolvedParams.contextId;

  if (!contextId || !contextId.startsWith("dcc_ctx_")) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: "CONTEXT_NOT_FOUND",
          message: "Invalid or missing context identifier format.",
        },
        { status: 404 }
      )
    );
  }

  // 1. Read body text for HMAC signature check
  let rawBody = "";
  let bodyJson: Record<string, any> = {};
  try {
    rawBody = await request.text();
    if (rawBody.trim().length > 0) {
      bodyJson = JSON.parse(rawBody);
    }
  } catch {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: "INVALID_JSON",
          message: "Malformed JSON in request body.",
        },
        { status: 400 }
      )
    );
  }

  // 2. Authorize via HMAC Service Authentication
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  const authResult = verifyServiceRequestHeaders({
    headers: request.headers,
    method: "POST",
    pathname,
    searchParams,
    body: rawBody,
  });

  if (!authResult.authorized) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: authResult.code,
          message: authResult.error,
        },
        { status: authResult.statusCode }
      )
    );
  }

  // 3. Execute Authenticated Revocation
  const reason = bodyJson.reason || "Upstream cancellation";
  const result = await revokeContext(contextId, authResult.keyId, reason);

  if (!result.success) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: result.errorCode,
          message: result.message,
        },
        { status: result.statusCode }
      )
    );
  }

  return withCors(NextResponse.json(result, { status: 200 }));
}
