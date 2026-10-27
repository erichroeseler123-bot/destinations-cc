import { NextRequest, NextResponse } from "next/server";
import { inspectTripContext } from "@/lib/dcc/context/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-dcc-owner, traceparent",
  );
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

interface RouteParams {
  params: Promise<{ contextId: string }>;
}

export async function GET(_request: NextRequest, context: RouteParams) {
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
        { status: 404 },
      ),
    );
  }

  const result = await inspectTripContext(contextId);

  if (!result.success) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          errorCode: result.errorCode,
          message: result.message,
        },
        { status: result.statusCode },
      ),
    );
  }

  return withCors(
    NextResponse.json(
      {
        ...result,
        payload: {
          date: result.schedule.date,
          partySize: result.schedule.travelers,
          shipSlug: result.schedule.shipOrVenue,
          portSlug: result.destination,
        },
      },
      { status: 200 },
    ),
  );
}
