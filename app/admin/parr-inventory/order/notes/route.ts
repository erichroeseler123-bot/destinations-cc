import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminActorLabel, isValidAdminSession } from "@/lib/adminAccess";
import { updateParrOrderNote } from "@/lib/parr/ops/actions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isValidAdminSession(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const orderId = String(formData.get("orderId") || "").trim();
  const note = String(formData.get("note") || "");
  const nextPathRaw = String(formData.get("next") || "/admin/parr-inventory");
  const nextPath = nextPathRaw.startsWith("/admin/parr-inventory") ? nextPathRaw : "/admin/parr-inventory";
  const redirectUrl = new URL(nextPath, request.url);

  if (!orderId) {
    redirectUrl.searchParams.set("error", "missing_order");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await updateParrOrderNote(orderId, note.trim(), getAdminActorLabel(session));
    redirectUrl.searchParams.set("saved", "note");
  } catch (error) {
    redirectUrl.searchParams.set("error", error instanceof Error ? error.message : "note_failed");
  }

  return NextResponse.redirect(redirectUrl);
}
