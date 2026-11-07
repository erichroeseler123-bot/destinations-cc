import { NextRequest, NextResponse } from "next/server";
import {
  runSupplierBookingLinkCheck,
  runSupplierLiveInventoryCheck,
  type SupplierCheckType,
} from "@/lib/dcc/operatorOnboardingStore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const accept = (request.headers.get("accept") || "").toLowerCase();
  const isJsonRequest =
    contentType.includes("application/json") ||
    (accept.includes("application/json") && !accept.includes("text/html"));

  let companyId = "";
  let productId = "";
  let checkType = "" as SupplierCheckType | "";
  let date: string | undefined;
  let nowIso: string | undefined;

  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      companyId = String(body.companyId || "").trim();
      productId = String(body.productId || "").trim();
      const rawType = String(body.checkType || "").trim();
      if (rawType === "booking_link" || rawType === "live_inventory") {
        checkType = rawType;
      }
      if (typeof body.date === "string" && body.date.trim()) {
        date = body.date.trim();
      }
      if (typeof body.nowIso === "string" && body.nowIso.trim()) {
        nowIso = body.nowIso.trim();
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 },
      );
    }
  } else {
    try {
      const formData = await request.formData();
      companyId = String(formData.get("companyId") || "").trim();
      productId = String(formData.get("productId") || "").trim();
      const rawType = String(formData.get("checkType") || "").trim();
      if (rawType === "booking_link" || rawType === "live_inventory") {
        checkType = rawType;
      }
      const rawDate = formData.get("date");
      if (typeof rawDate === "string" && rawDate.trim()) {
        date = rawDate.trim();
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid form submission." },
        { status: 400 },
      );
    }
  }

  if (!companyId || !productId || !checkType) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing required fields: companyId, productId, and checkType ('booking_link' | 'live_inventory').",
      },
      { status: 400 },
    );
  }

  const result =
    checkType === "booking_link"
      ? await runSupplierBookingLinkCheck({ companyId, productId, nowIso })
      : await runSupplierLiveInventoryCheck({
          companyId,
          productId,
          date,
          nowIso,
        });

  if (isJsonRequest || !result.ok || !result.checkRecord) {
    return NextResponse.json(result, { status: result.status });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/admin/portfolio";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("checkedCompany", result.checkRecord.companyId);
  redirectUrl.searchParams.set("checkedProduct", result.checkRecord.productId);
  redirectUrl.searchParams.set("checkType", result.checkRecord.checkType);
  redirectUrl.searchParams.set("checkedAt", result.checkRecord.checkedAt);
  redirectUrl.hash = "supplier-connections";

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
