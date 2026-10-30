import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FORBIDDEN_SECRET_KEYS = [
  "apikey",
  "api_key",
  "secret",
  "api_secret",
  "client_secret",
  "password",
  "bearertoken",
  "bearer_token",
  "access_token",
  "private_key",
];

export type OperatorOnboardingApplicationInput = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  website: string;
  destinations: string;
  bookingSystem: string;
  apiDocumentationUrl: string;
  authorizedApiAccessAvailable: boolean;
  operatorPermissionConfirmed: boolean;
  notes?: string;
};

export function validateOperatorOnboardingApplication(body: Record<string, unknown>) {
  // Reject any attempt to submit API keys or secrets via public form
  for (const key of Object.keys(body)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (FORBIDDEN_SECRET_KEYS.includes(normalized) && body[key]) {
      return {
        ok: false as const,
        status: 400,
        errorCode: "public_secret_submission_forbidden",
        message:
          "Do not submit API keys, tokens, or secrets through public forms or email. Credentials are arranged securely after technical and commercial review.",
      };
    }
  }

  const companyName = String(body.companyName || "").trim();
  const contactName = String(body.contactName || "").trim();
  const contactEmail = String(body.contactEmail || "").trim();
  const website = String(body.website || "").trim();
  const destinations = String(body.destinations || "").trim();
  const bookingSystem = String(body.bookingSystem || "").trim();
  const apiDocumentationUrl = String(body.apiDocumentationUrl || "").trim();
  const authorizedApiAccessAvailable = Boolean(body.authorizedApiAccessAvailable);
  const operatorPermissionConfirmed = Boolean(body.operatorPermissionConfirmed);

  if (!companyName || !contactName || !contactEmail || !website || !destinations || !bookingSystem) {
    return {
      ok: false as const,
      status: 400,
      errorCode: "missing_required_fields",
      message:
        "Missing required fields: companyName, contactName, contactEmail, website, destinations, and bookingSystem are required.",
    };
  }

  // Direct partnerships are API-only
  if (
    bookingSystem.toLowerCase() === "no_api" ||
    bookingSystem.toLowerCase() === "none" ||
    !authorizedApiAccessAvailable
  ) {
    return {
      ok: true as const,
      status: 200,
      applicationStatus: "api_required_keep_viator_channel" as const,
      salesAuthorized: false as const,
      commercialTermsSigned: false as const,
      activeBookingChannel: "viator_if_verified" as const,
      proposedCommissionPercent: 10,
      message:
        "Direct partnerships are API-only. Without an authorized API connection, we cannot switch bookings to a direct connection. Existing verified Viator listings can continue through Viator.",
    };
  }

  if (!apiDocumentationUrl) {
    return {
      ok: false as const,
      status: 400,
      errorCode: "missing_api_documentation",
      message:
        "Please provide the API documentation URL or technical specification reference for your booking system.",
    };
  }

  return {
    ok: true as const,
    status: 201,
    applicationId: `dcc-onb-${Date.now()}`,
    applicationStatus: "application_received_pending_review" as const,
    salesAuthorized: false as const,
    commercialTermsSigned: false as const,
    credentialsCollectedPublicly: false as const,
    activeBookingChannel: "viator_until_verified" as const,
    proposedCommissionPercent: 10,
    commercialTermsNote:
      "The proposed 10% commission on completed direct bookings is separate from signed commercial and settlement terms. Submitting this application does not authorize direct sales.",
    credentialArrangementNote:
      "API credentials are arranged through a secure channel after technical review and signed commercial terms. Never send API secrets by email or public forms.",
    requiredVerificationGatesBeforeCutover: [
      "operator_authorization_verified",
      "commercial_and_settlement_terms_signed",
      "credentials_arranged_and_verified",
      "product_mapping_verified",
      "current_prices_and_availability_verified",
      "booking_attribution_and_outcome_reporting_verified",
      "cancellation_and_cruise_return_policies_verified_separately",
    ],
    submitted: {
      companyName,
      contactName,
      contactEmail,
      website,
      destinations,
      bookingSystem,
      apiDocumentationUrl,
      authorizedApiAccessAvailable,
      operatorPermissionConfirmed,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const result = validateOperatorOnboardingApplication(body);
    return NextResponse.json(result, { status: result.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, errorCode: "invalid_request_body", message },
      { status: 400 }
    );
  }
}
