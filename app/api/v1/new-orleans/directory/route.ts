import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { NEW_ORLEANS_OPERATOR_FIELD_AUTHORITY_MATRIX } from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";
import {
  findNewOrleansOperatorBySlugOrAlias,
  findNewOrleansPlaceBySlug,
  getNewOrleansDirectorySnapshot,
} from "@/lib/dcc/shared/newOrleansDirectoryData";

export const dynamic = "force-dynamic";

const BASE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  "Access-Control-Expose-Headers": "ETag, X-DCC-NOLA-Schema, X-Robots-Tag",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Robots-Tag": "noindex, nofollow",
  "X-DCC-NOLA-Schema": "dcc.new-orleans.directory.v1",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BASE_HEADERS });
}

async function handleRequest(request: NextRequest, headOnly: boolean) {
  const { searchParams } = new URL(request.url);
  const areaParam = (
    searchParams.get("area") ||
    searchParams.get("place") ||
    ""
  )
    .trim()
    .toLowerCase();
  const operatorParam = (searchParams.get("operator") || "")
    .trim()
    .toLowerCase();
  const categoryParam = (searchParams.get("category") || "")
    .trim()
    .toLowerCase();
  const includeHeldParam = searchParams.get("includeHeld");
  const includeHeld =
    includeHeldParam === null
      ? true
      : includeHeldParam !== "0" && includeHeldParam !== "false";

  if (areaParam && !findNewOrleansPlaceBySlug(areaParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unknown New Orleans canonical area/place "${areaParam}".`,
      },
      { status: 404, headers: BASE_HEADERS },
    );
  }

  if (operatorParam && !findNewOrleansOperatorBySlugOrAlias(operatorParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unknown New Orleans canonical operator "${operatorParam}".`,
      },
      { status: 404, headers: BASE_HEADERS },
    );
  }

  const snapshot = getNewOrleansDirectorySnapshot();

  const places = snapshot.places.filter((entry) => {
    if (!includeHeld && !entry.gate.indexable) return false;
    if (areaParam && entry.place.publicPlaceSlug !== areaParam) return false;
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
    if (
      areaParam &&
      !entry.operator.publicPlaceSlugs.includes(areaParam)
    ) {
      return false;
    }
    if (
      categoryParam &&
      !entry.operator.categorySlugs.includes(categoryParam)
    ) {
      return false;
    }
    return true;
  });

  const areaCategories = snapshot.areaCategories.filter((entry) => {
    if (!includeHeld && !entry.gate.indexable) return false;
    if (areaParam && entry.areaSlug !== areaParam) return false;
    if (categoryParam && entry.category.categorySlug !== categoryParam) {
      return false;
    }
    return true;
  });

  const payload = {
    ok: true,
    schemaVersion: snapshot.schemaVersion,
    coreContractVersion: snapshot.coreContractVersion,
    extensionVersion: snapshot.extensionVersion,
    generatedAt: snapshot.generatedAt,
    region: snapshot.region,
    counts: snapshot.counts,
    fieldAuthorityMatrix: NEW_ORLEANS_OPERATOR_FIELD_AUTHORITY_MATRIX,
    places,
    categories: snapshot.categories,
    operators,
    areaCategories,
    heldRecordsLedger: includeHeld ? snapshot.heldRecordsLedger : [],
  };

  const serialized = JSON.stringify(payload);
  const etag = `"nola-${crypto
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
