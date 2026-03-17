import { NextRequest, NextResponse } from "next/server";
import {
  createTravelpayoutsPartnerLinks,
  isTravelpayoutsPartnerLinkBrandSupported,
  normalizeTravelpayoutsBrandKey,
} from "@/lib/travelpayouts/client";
import { getTravelpayoutsConfig } from "@/lib/travelpayouts/config";

export const runtime = "nodejs";

type RequestBody = {
  brand?: string;
  trs?: string;
  shorten?: boolean;
  links?: Array<{
    url?: string;
    sub_id?: string;
  }>;
};

export async function POST(request: NextRequest) {
  const config = getTravelpayoutsConfig();
  if (!config.configured) {
    return NextResponse.json(
      {
        ok: false,
        error: "travelpayouts_not_configured",
        configured: false,
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const links = (body?.links || [])
    .map((entry) => ({
      url: String(entry?.url || "").trim(),
      sub_id: entry?.sub_id ? String(entry.sub_id).trim() : undefined,
    }))
    .filter((entry) => entry.url.length > 0);

  if (links.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_links",
      },
      { status: 400 }
    );
  }

  if (links.length > 10) {
    return NextResponse.json(
      {
        ok: false,
        error: "too_many_links",
        limit: 10,
      },
      { status: 400 }
    );
  }

  const brand = normalizeTravelpayoutsBrandKey(body?.brand);
  if (brand && !isTravelpayoutsPartnerLinkBrandSupported(brand)) {
    return NextResponse.json(
      {
        ok: false,
        error: "travelpayouts_brand_unsupported",
        brand,
      },
      { status: 400 }
    );
  }

  try {
    const result = await createTravelpayoutsPartnerLinks(links, {
      brandKey: brand,
      trs: body?.trs,
      shorten: body?.shorten,
    });

    return NextResponse.json(
      {
        ok: true,
        configured: true,
        brand: brand || null,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        brand: brand || null,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
