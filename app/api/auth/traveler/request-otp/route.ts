import { NextRequest, NextResponse } from "next/server";
import { DccTravelerService } from "@/lib/travelers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "INVALID_EMAIL", message: "A valid email address is required" },
        { status: 400 }
      );
    }

    const challenge = await DccTravelerService.createPasswordlessChallenge(email);

    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      challengeId: challenge.challengeId,
      message: `A 6-digit verification code was sent to ${email}.`,
      // In sandbox/development, return otpCode to facilitate automated testing
      ...(isDev ? { devOtpCode: challenge.otpCode } : {}),
    });
  } catch (err: any) {
    console.error("Error in request-otp:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message || "Failed to issue verification code" },
      { status: 500 }
    );
  }
}
