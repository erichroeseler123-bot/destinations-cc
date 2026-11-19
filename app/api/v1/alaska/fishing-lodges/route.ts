import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  findPublishedSoutheastAlaskaFishingLodgeBySlug,
  getPublicSoutheastAlaskaFishingLodgesSnapshot,
} from "../../../../../lib/dcc/shared/southeastAlaskaFishingLodgesData";

export const dynamic = "force-dynamic";

const BASE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  "Access-Control-Expose-Headers": "ETag, X-DCC-SEAK-Lodges-Schema, X-Robots-Tag",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Robots-Tag": "noindex, nofollow",
  "X-DCC-SEAK-Lodges-Schema": "dcc.directory.ext.alaska-lodges.v1",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BASE_HEADERS });
}

function handleRequest(request: NextRequest, headOnly: boolean) {
  const { searchParams } = new URL(request.url);
  const lodgeSlugParam = (searchParams.get("lodge") || "").trim().toLowerCase();
  const subregionParam = (searchParams.get("subregion") || "").trim().toLowerCase();
  const stayFormatParam = (searchParams.get("stayFormat") || "").trim().toLowerCase();
  const gatewayParam = (searchParams.get("gateway") || "").trim().toLowerCase();

  if (lodgeSlugParam && !findPublishedSoutheastAlaskaFishingLodgeBySlug(lodgeSlugParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Southeast Alaska fishing lodge "${lodgeSlugParam}" is not in the published directory.`,
      },
      { status: 404, headers: BASE_HEADERS },
    );
  }

  // Strictly public-approved lodges ONLY (held research queue records are never serialized here)
  const snapshot = getPublicSoutheastAlaskaFishingLodgesSnapshot();

  const filteredLodges = snapshot.lodges.filter((lodge) => {
    if (lodgeSlugParam && lodge.slug !== lodgeSlugParam) return false;
    if (subregionParam && lodge.subRegion !== subregionParam) return false;
    if (stayFormatParam && lodge.stayFormat !== stayFormatParam) return false;
    if (
      gatewayParam &&
      lodge.accommodation.gatewayPublicPortSlug.toLowerCase() !== gatewayParam &&
      !lodge.accessConnections.some(
        (c) =>
          c.gatewayPortSlug.toLowerCase() === gatewayParam ||
          c.gatewayAirportIata.toLowerCase() === gatewayParam,
      )
    ) {
      return false;
    }
    return true;
  });

  const payload = {
    ok: true,
    schemaVersion: snapshot.schemaVersion,
    coreContractVersion: snapshot.coreContractVersion,
    generatedAt: snapshot.generatedAt,
    region: snapshot.region,
    heldResearchRecordsExposed: false,
    counts: {
      ...snapshot.counts,
      returnedProperties: filteredLodges.length,
    },
    lodges: filteredLodges,
  };

  const serialized = JSON.stringify(payload);
  const etag = `"seak-lodges-${crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex")
    .slice(0, 24)}"`;

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.trim() === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ...BASE_HEADERS, ETag: etag },
    });
  }

  if (headOnly) {
    return new NextResponse(null, {
      status: 200,
      headers: { ...BASE_HEADERS, ETag: etag },
    });
  }

  return new NextResponse(serialized, {
    status: 200,
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      ETag: etag,
    },
  });
}

export async function GET(request: NextRequest) {
  return handleRequest(request, false);
}

export async function HEAD(request: NextRequest) {
  return handleRequest(request, true);
}
