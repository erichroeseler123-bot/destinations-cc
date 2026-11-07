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
  let route: string | undefined;
  let pickupDate: string | undefined;
  let pickupTime: string | undefined;
  let partySize: number | undefined;
  let vehicleClass: string | undefined;
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
      if (typeof body.route === "string" && body.route.trim()) {
        route = body.route.trim();
      }
      const rawDate = body.pickupDate ?? body.date;
      if (typeof rawDate === "string" && rawDate.trim()) {
        pickupDate = rawDate.trim();
      }
      if (typeof body.pickupTime === "string" && body.pickupTime.trim()) {
        pickupTime = body.pickupTime.trim();
      }
      if (typeof body.partySize === "number" && Number.isFinite(body.partySize)) {
        partySize = Math.floor(body.partySize);
      } else if (typeof body.partySize === "string" && body.partySize.trim()) {
        const parsedPax = Number(body.partySize.trim());
        if (Number.isFinite(parsedPax) && parsedPax > 0) {
          partySize = Math.floor(parsedPax);
        }
      }
      if (typeof body.vehicleClass === "string" && body.vehicleClass.trim()) {
        vehicleClass = body.vehicleClass.trim();
      }
      if (typeof body.nowIso === "string" && body.nowIso.trim()) {
        nowIso = body.nowIso.trim();
      }
    } catch {
      return NextResponse.json(
        { ok: false, persisted: false, error: "Invalid JSON request body." },
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
      const rawRoute = formData.get("route");
      if (typeof rawRoute === "string" && rawRoute.trim()) {
        route = rawRoute.trim();
      }
      const rawPickupDate = formData.get("pickupDate") ?? formData.get("date");
      if (typeof rawPickupDate === "string" && rawPickupDate.trim()) {
        pickupDate = rawPickupDate.trim();
      }
      const rawPickupTime = formData.get("pickupTime");
      if (typeof rawPickupTime === "string" && rawPickupTime.trim()) {
        pickupTime = rawPickupTime.trim();
      }
      const rawPartySize = formData.get("partySize");
      if (typeof rawPartySize === "string" && rawPartySize.trim()) {
        const parsedPax = Number(rawPartySize.trim());
        if (Number.isFinite(parsedPax) && parsedPax > 0) {
          partySize = Math.floor(parsedPax);
        }
      }
      const rawVehicleClass = formData.get("vehicleClass");
      if (typeof rawVehicleClass === "string" && rawVehicleClass.trim()) {
        vehicleClass = rawVehicleClass.trim();
      }
    } catch {
      return NextResponse.json(
        { ok: false, persisted: false, error: "Invalid form submission." },
        { status: 400 },
      );
    }
  }

  if (!companyId || !productId || !checkType) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
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
          route,
          pickupDate,
          pickupTime,
          partySize,
          vehicleClass,
          nowIso,
        });

  if (isJsonRequest) {
    return NextResponse.json(result, { status: result.status });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/admin/portfolio";
  redirectUrl.search = "";

  if (!result.ok || !result.persisted || !result.checkRecord) {
    redirectUrl.searchParams.set("checkSaved", "0");
    redirectUrl.searchParams.set(
      "checkError",
      result.message || "Failed to persist supplier check in database.",
    );
    redirectUrl.hash = "supplier-connections";
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  redirectUrl.searchParams.set("checkSaved", "1");
  redirectUrl.searchParams.set("checkedCompany", result.checkRecord.companyId);
  redirectUrl.searchParams.set("checkedProduct", result.checkRecord.productId);
  redirectUrl.searchParams.set("checkType", result.checkRecord.checkType);
  redirectUrl.searchParams.set("checkedAt", result.checkRecord.checkedAt);
  redirectUrl.hash = "supplier-connections";

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
