import { NextResponse } from "next/server";
import {
  cruisePortDirectorySources,
  getCruisePortDirectory,
  getCruisePortViatorSearch,
} from "@/lib/dcc/cruisePortDirectory";

export const revalidate = 3600;

export function GET() {
  const ports = getCruisePortDirectory().map((port) => ({
    ...port,
    viatorSearchUrl: getCruisePortViatorSearch(port),
  }));
  return NextResponse.json(
    {
      spec: "dcc-cruise-port-directory-v1",
      origin: "https://destinationcommandcenter.com",
      totalPorts: ports.length,
      sources: cruisePortDirectorySources,
      ports,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=900, s-maxage=3600",
      },
    },
  );
}
