import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DccContextIssueRequestSchema } from "@/lib/dcc/context/schema";
import { issueContext } from "@/lib/dcc/context/service";
import { isAllowedOrigin } from "@/lib/dcc/context/registry";

export const runtime = "nodejs";

const ISSUE_RATE_LIMIT_MAX = 60; // 60 requests per minute
const ISSUE_RATE_LIMIT_WINDOW_MS = 60 * 1000;

interface RateLimitEntry {
  timestamps: number[];
}
const issueRateLimitMap = new Map<string, RateLimitEntry>();

export function clearIssueRateLimitCacheForTesting() {
  issueRateLimitMap.clear();
}

function checkIssueRateLimit(key: string, now: number = Date.now()): boolean {
  let entry = issueRateLimitMap.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    issueRateLimitMap.set(key, entry);
  }
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < ISSUE_RATE_LIMIT_WINDOW_MS);
  if (entry.timestamps.length >= ISSUE_RATE_LIMIT_MAX) {
    return false;
  }
  entry.timestamps.push(now);
  return true;
}

function withCors(response: NextResponse, origin: string | null) {
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-dcc-key-id, x-dcc-timestamp, x-dcc-nonce, x-dcc-signature, x-dcc-content-sha256"
  );
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return withCors(new NextResponse(null, { status: 204 }), origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  // 1. Origin Security Check
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      {
        success: false,
        errorCode: "ORIGIN_NOT_ALLOWED",
        message: `Cross-origin request from origin '${origin}' is not permitted.`,
      },
      { status: 403 }
    );
  }

  // 2. Rate Limiting by IP or Client Source
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";
  const rateLimitKey = `issue:${clientIp}`;

  if (!checkIssueRateLimit(rateLimitKey)) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: "RATE_LIMIT_EXCEEDED",
          message: "Issue rate limit exceeded. Max 60 requests per minute.",
        },
        { status: 429 }
      ),
      origin
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: "INVALID_JSON",
          message: "Malformed JSON in request body.",
        },
        { status: 400 }
      ),
      origin
    );
  }

  // 3. Validate against strict schema
  const parsed = DccContextIssueRequestSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: "VALIDATION_FAILED",
          message: "Request validation failed.",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            code: issue.code,
            message: issue.message,
          })),
        },
        { status: 400 }
      ),
      origin
    );
  }

  // 4. Issue context via authoritative service
  try {
    const result = await issueContext(parsed.data);
    const statusCode = result.idempotencyReplay ? 200 : 201;
    return withCors(NextResponse.json(result, { status: statusCode }), origin);
  } catch (error) {
    if (error instanceof ZodError) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            errorCode: "VALIDATION_FAILED",
            message: "Schema validation failed during context issue.",
            errors: error.issues,
          },
          { status: 400 }
        ),
        origin
      );
    }

    const message = error instanceof Error ? error.message : "Internal service error";
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: "INTERNAL_ERROR",
          message,
        },
        { status: 500 }
      ),
      origin
    );
  }
}
