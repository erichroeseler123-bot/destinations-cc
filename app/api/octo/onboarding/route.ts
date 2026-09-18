import { NextRequest, NextResponse } from "next/server";
import { OctoOnboardingService } from "@/lib/octo/onboardingService";

export const dynamic = "force-dynamic";

/**
 * Route protection: require admin API key or secret in production for mutations
 */
function verifyAdminAuth(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const authHeader = req.headers.get("authorization") || "";
  const apiKeyHeader = req.headers.get("x-admin-key") || "";
  const expectedSecret = process.env.OCTO_ADMIN_KEY || process.env.DCC_ADMIN_KEY;

  if (!expectedSecret) {
    // If no admin key configured in prod, block all mutations
    return false;
  }

  if (authHeader === `Bearer ${expectedSecret}` || apiKeyHeader === expectedSecret) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidate = (searchParams.get("candidate") as any) || "ventrata";

  const checklist = OctoOnboardingService.generatePilotChecklist(candidate);

  return NextResponse.json({
    status: "ok",
    pipeline: [
      "discovered",
      "consented",
      "credentials_configured",
      "connection_verified",
      "catalog_synced",
      "availability_verified",
      "booking_tested",
      "bookable",
    ],
    pilotChecklist: checklist,
  });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Admin authorization required for onboarding mutations." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const action = body.action;

    if (!action) {
      return NextResponse.json(
        { error: "MISSING_ACTION", message: "Field 'action' is required (register, verify_connection, sync_catalog, verify_availability, test_booking, promote)" },
        { status: 400 }
      );
    }

    // 1. Register operator
    if (action === "register") {
      const connectionId = await OctoOnboardingService.registerOperator(body.params);
      return NextResponse.json({ success: true, connectionId });
    }

    // 2. Verify connection
    if (action === "verify_connection") {
      const res = await OctoOnboardingService.verifyConnection(body.connectionId);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    // 3. Sync catalog
    if (action === "sync_catalog") {
      const res = await OctoOnboardingService.syncCatalog(body.connectionId);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    // 4. Verify availability
    if (action === "verify_availability") {
      const res = await OctoOnboardingService.verifyAvailability(
        body.connectionId,
        body.productId,
        body.optionId,
        body.localDate
      );
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    // 5. Test booking lifecycle
    if (action === "test_booking") {
      const res = await OctoOnboardingService.testBookingLifecycle(
        body.connectionId,
        body.testHoldParams
      );
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    // 6. Promote to bookable
    if (action === "promote") {
      const res = await OctoOnboardingService.promoteToBookable(body.connectionId);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    return NextResponse.json({ error: "UNKNOWN_ACTION", message: `Action '${action}' not supported.` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "ONBOARDING_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
