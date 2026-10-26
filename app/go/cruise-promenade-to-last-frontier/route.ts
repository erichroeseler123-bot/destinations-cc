import { NextResponse } from "next/server";

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function resolveLfseDestination(portSlug: string): string {
  if (portSlug.startsWith("juneau")) return "https://www.lastfrontiershoreexcursions.com/ports/juneau";
  if (portSlug.startsWith("skagway")) return "https://www.lastfrontiershoreexcursions.com/ports/skagway";
  if (portSlug.startsWith("ketchikan")) return "https://www.lastfrontiershoreexcursions.com/ports/ketchikan";
  if (portSlug.startsWith("sitka")) return "https://www.lastfrontiershoreexcursions.com/ports/sitka";
  if (portSlug.startsWith("icy-strait")) return "https://www.lastfrontiershoreexcursions.com/ports/icy-strait-point";
  return "https://www.lastfrontiershoreexcursions.com/tours";
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const port = slug(incoming.searchParams.get("port"));
  const target = new URL(resolveLfseDestination(port));

  return NextResponse.redirect(target, 302);
}
