import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DccContextIssueRequestSchema } from "@/lib/dcc/context/schema";
import { issueContext } from "@/lib/dcc/context/service";

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

export async function POST(request: NextRequest) {
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
      )
    );
  }

  // 1. Validate against strict schema
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
      )
    );
  }

  // 2. Issue context via authoritative service
  try {
    const result = await issueContext(parsed.data);
    const statusCode = result.idempotencyReplay ? 200 : 201;
    return withCors(NextResponse.json(result, { status: statusCode }));
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
        )
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
      )
    );
  }
}
