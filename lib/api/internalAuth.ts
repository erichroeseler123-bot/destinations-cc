import type { NextRequest } from "next/server";

function readBearerToken(request: NextRequest | Request): string {
  const raw = request.headers.get("authorization") || "";
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
}

export function isInternalAuthorized(request: NextRequest | Request): boolean {
  const internalSecret = process.env.INTERNAL_API_SECRET?.trim();

  if (!internalSecret) return false;

  const headerSecret = request.headers.get("x-internal-secret")?.trim() || "";
  const bearerSecret = readBearerToken(request);

  return internalSecret === headerSecret || internalSecret === bearerSecret;
}
