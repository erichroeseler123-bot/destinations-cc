import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { OPERATOR_FIELD_AUTHORITY_MATRIX } from "@/lib/dcc/shared/southeastAlaskaDirectoryContract";
import {
  findSoutheastAlaskaOperatorBySlugOrAlias,
  findSoutheastAlaskaPlaceByPortSlug,
  getSoutheastAlaskaDirectorySnapshot,
} from "@/lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

export const dynamic = "force-dynamic";

const BASE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  "Access-Control-Expose-Headers": "ETag, X-DCC-SEAK-Schema, X-Robots-Tag",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Robots-Tag": "noindex, nofollow",
  "X-DCC-SEAK-Schema": "dcc.se-alaska.directory.v1",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BASE_HEADERS });
}

async function handleRequest(request: NextRequest, headOnly: boolean) {
  const { searchParams } = new URL(request.url);
  const portParam = (searchParams.get("port") || "").trim().toLowerCase();
  const operatorParam = (searchParams.get("operator") || "").trim().toLowerCase();
  const categoryParam = (searchParams.get("category") || "").trim().toLowerCase();
  const includeHeldParam = searchParams.get("includeHeld");
  const includeHeld =
    includeHeldParam === null
      ? true
      : includeHeldParam !== "0" && includeHeldParam !== "false";

  if (portParam && !findSoutheastAlaskaPlaceByPortSlug(portParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unknown Southeast Alaska public port/destination "${portParam}".`,
      },
      { status: 404, headers: BASE_HEADERS },
    );
  }

  if (operatorParam && !findSoutheastAlaskaOperatorBySlugOrAlias(operatorParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unknown Southeast Alaska operator "${operatorParam}".`,
      },
      { status: 404, headers: BASE_HEADERS },
    );
  }

  const snapshot = getSoutheastAlaskaDirectorySnapshot();

  const places = snapshot.places.filter((entry) => {
    if (!includeHeld && !entry.gate.indexable) return false;
    if (portParam && entry.place.publicPortSlug !== portParam) return false;
    return true;
  });

  const operators = snapshot.operators.filter((entry) => {
    if (!includeHeld && !entry.gate.indexable) return false;
    if (
      operatorParam &&
      entry.operator.slug !== operatorParam &&
      !entry.operator.legacyCompanyAliases?.includes(operatorParam)
    ) {
      return false;
    }
    if (portParam && !entry.operator.publicPortSlugs.includes(portParam)) {
      return false;
    }
    if (categoryParam && !entry.operator.categorySlugs.includes(categoryParam)) {
      return false;
    }
    return true;
  });

  const portCategories = snapshot.portCategories.filter((entry) => {
    if (!includeHeld && !entry.gate.indexable) return false;
    if (portParam && entry.portSlug !== portParam) return false;
    if (categoryParam && entry.category.categorySlug !== categoryParam) {
      return false;
    }
    return true;
  });

  const payload = {
    ok: true,
    schemaVersion: snapshot.schemaVersion,
    generatedAt: snapshot.generatedAt,
    region: snapshot.region,
    counts: snapshot.counts,
    fieldAuthorityMatrix: OPERATOR_FIELD_AUTHORITY_MATRIX,
    places,
    categories: snapshot.categories,
    operators,
    portCategories,
    heldRecordsLedger: includeHeld ? snapshot.heldRecordsLedger : [],
  };

  const serialized = JSON.stringify(payload);
  const etag = `"seak-${crypto
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
