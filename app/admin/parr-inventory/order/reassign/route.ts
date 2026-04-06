import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminActorLabel, isValidAdminSession } from "@/lib/adminAccess";
import { getCheckoutProduct } from "@/lib/checkoutProducts";
import { reassignParrOrder } from "@/lib/parr/ops/actions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isValidAdminSession(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const orderId = String(formData.get("orderId") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const product = String(formData.get("product") || "").trim();
  const pickup = String(formData.get("pickup") || "").trim();
  const pickupTime = String(formData.get("pickupTime") || "").trim();
  const sessionKey = String(formData.get("sessionKey") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const nextPathRaw = String(formData.get("next") || "/admin/parr-inventory");
  const nextPath = nextPathRaw.startsWith("/admin/parr-inventory") ? nextPathRaw : "/admin/parr-inventory";
  const redirectUrl = new URL(nextPath, request.url);

  if (!orderId || !date || !product || !pickup || !reason) {
    redirectUrl.searchParams.set("error", "missing_reassign_fields");
    return NextResponse.redirect(redirectUrl);
  }

  const productRecord = getCheckoutProduct(product);
  if (!productRecord || !productRecord.route.startsWith("parr-")) {
    redirectUrl.searchParams.set("error", "invalid_destination_product");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await reassignParrOrder(
      orderId,
      {
        date,
        product,
        pickup,
        pickupTime: pickupTime || null,
        sessionKey: sessionKey || null,
        reason,
      },
      getAdminActorLabel(session),
    );
    redirectUrl.searchParams.set("saved", "reassigned");
  } catch (error) {
    redirectUrl.searchParams.set("error", error instanceof Error ? error.message : "reassign_failed");
  }

  return NextResponse.redirect(redirectUrl);
}
