import { NextRequest, NextResponse } from "next/server";
import { TRAVELER_SESSION_COOKIE } from "@/lib/travelers";

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(TRAVELER_SESSION_COOKIE);
  return response;
}
