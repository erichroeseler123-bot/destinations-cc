import { NextRequest, NextResponse } from "next/server";
import { DccTravelerService, TRAVELER_SESSION_COOKIE } from "@/lib/travelers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;
    const code = body.code || body.token;

    if (!email || !code) {
      return NextResponse.json(
        { error: "MISSING_CREDENTIALS", message: "Email and verification code are required" },
        { status: 400 }
      );
    }

    const { profile, session } = await DccTravelerService.verifyPasswordlessChallenge(
      email,
      code
    );

    const response = NextResponse.json({
      success: true,
      profile,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    });

    // Set HTTP-only secure cookie
    response.cookies.set(TRAVELER_SESSION_COOKIE, session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "AUTHENTICATION_FAILED", message: err.message || "Invalid or expired code" },
      { status: 401 }
    );
  }
}
