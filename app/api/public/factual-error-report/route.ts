import { NextResponse } from "next/server";
import {
  buildEarthOSUnauthorizedResponse,
  verifyEarthOSAuthorization,
} from "@/lib/dcc/earthos/auth";
import {
  listFactualErrorReports,
  submitFactualErrorReport,
  type FactualErrorReportInput,
} from "@/lib/dcc/earthos/factualErrorReports";

export const dynamic = "force-dynamic";

function extractClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "anonymous-client";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<FactualErrorReportInput>;
    const clientIp = body.clientIp || extractClientIp(request);
    const userAgent = request.headers.get("user-agent") || null;

    const result = await submitFactualErrorReport({
      pagePath: String(body.pagePath || ""),
      nodeId: body.nodeId ?? null,
      citationId: body.citationId ?? null,
      optionId: body.optionId ?? null,
      disputedClaim: String(body.disputedClaim || ""),
      explanation: String(body.explanation || ""),
      sourceUrl: body.sourceUrl ?? null,
      contactInfo: body.contactInfo ?? null,
      websiteUrl: body.websiteUrl ?? null,
      clientIp,
      userAgent,
      sendNotification: body.sendNotification,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          message: result.message,
        },
        { status: result.statusCode },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        deduplicated: result.deduplicated,
        reportId: result.report.reportId,
        findingId: result.report.findingId,
        status: result.report.status,
        submittedAt: result.report.submittedAt,
        pagePath: result.report.pagePath,
        nodeId: result.report.nodeId,
        notificationStatus: result.report.notificationStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "persistence_failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to process factual-error report submission.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const auth = await verifyEarthOSAuthorization(request);
  if (!auth.authorized || auth.actor === "vercel:cron") {
    return buildEarthOSUnauthorizedResponse(auth);
  }

  try {
    const url = new URL(request.url);
    const pagePath = url.searchParams.get("pagePath") || undefined;
    const nodeId = url.searchParams.get("nodeId") || undefined;
    const reports = await listFactualErrorReports({
      pagePath,
      nodeId,
      limit: 100,
    });

    return NextResponse.json({
      ok: true,
      actor: auth.actor,
      count: reports.length,
      reports,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "factual_error_report_list_failed",
      },
      { status: 500 },
    );
  }
}
