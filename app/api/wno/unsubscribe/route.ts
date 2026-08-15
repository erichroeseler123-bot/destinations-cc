import { NextResponse } from "next/server";
import { unsubscribe, verifyUnsubscribeToken } from "@/lib/wno/dailyBrief";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = url.searchParams.get("token") || "";

  if (!email || !verifyUnsubscribeToken(email, token)) {
    return new NextResponse("This unsubscribe link is invalid or expired.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  await unsubscribe(email);
  return new NextResponse("You are unsubscribed from the New Orleans 48-hour planning brief.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
