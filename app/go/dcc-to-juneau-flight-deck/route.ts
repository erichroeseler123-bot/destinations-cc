import { NextResponse } from "next/server";

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const portDate = clean(incoming.searchParams.get("date") || incoming.searchParams.get("port_date"), 10);
  const interest = slug(incoming.searchParams.get("interest"));

  const path =
    interest === "dogsled"
      ? "/juneau-dogsled-helicopter-tours"
      : interest === "compare-operators"
        ? "/temsco-vs-coastal-vs-northstar-juneau"
        : interest === "weather-backup"
          ? "/juneau/what-to-do-if-helicopter-tour-canceled"
          : "/helicopter";

  const target = new URL(`https://juneauflightdeck.com${path}`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(portDate) && path === "/helicopter") {
    target.searchParams.set("date", portDate);
  }

  return NextResponse.redirect(target, 302);
}
