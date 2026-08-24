import { NextRequest, NextResponse } from "next/server";
import { sendNetworkContactEmail } from "../../../lib/email/networkContact";

export const runtime = "nodejs";

function readValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = readValue(formData, "name");
  const email = readValue(formData, "email");
  const message = readValue(formData, "message");
  const sourcePath = readValue(formData, "sourcePath") || "/contact";
  const redirectUrl = new URL(sourcePath, request.url);

  if (!email || !message) {
    redirectUrl.searchParams.set("error", "contact");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const result = await sendNetworkContactEmail({
    siteName: "420 Friendly Airport Pickup",
    sourceSite: "420-airport-pickup",
    fromEmail:
      process.env.AIRPORT420_CONTACT_FROM_EMAIL?.trim() || "hello@420friendlyairportpickup.com",
    name,
    email,
    message,
    sourcePath,
  });

  redirectUrl.searchParams.set(result.sent ? "sent" : "error", result.sent ? "1" : "contact");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
