import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminActorLabel, isValidAdminSession } from "@/lib/adminAccess";
import { updateParrOrderPaymentState } from "@/lib/parr/ops/actions";

export const runtime = "nodejs";

const VALID_ACTIONS = new Set(["mark_unpaid", "mark_partial", "mark_paid", "mark_manual_review"]);

function dollarsToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isValidAdminSession(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const orderId = String(formData.get("orderId") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const amountPaidDollars = String(formData.get("amountPaidDollars") || "").trim();
  const nextPathRaw = String(formData.get("next") || "/admin/parr-inventory");
  const nextPath = nextPathRaw.startsWith("/admin/parr-inventory") ? nextPathRaw : "/admin/parr-inventory";
  const redirectUrl = new URL(nextPath, request.url);

  if (!orderId || !VALID_ACTIONS.has(action)) {
    redirectUrl.searchParams.set("error", "invalid_payment_action");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await updateParrOrderPaymentState(
      orderId,
      action as "mark_unpaid" | "mark_partial" | "mark_paid" | "mark_manual_review",
      getAdminActorLabel(session),
      reason,
      amountPaidDollars ? dollarsToCents(amountPaidDollars) : null,
    );
    redirectUrl.searchParams.set("saved", action);
  } catch (error) {
    redirectUrl.searchParams.set("error", error instanceof Error ? error.message : "payment_failed");
  }

  return NextResponse.redirect(redirectUrl);
}
