import { NextRequest, NextResponse } from "next/server";
import { getCheckoutProductsForRoute } from "@/lib/checkoutProducts";
import { getParrPrivateAvailability } from "@/lib/parrPrivateAvailability";
import { getParrSharedAvailability } from "@/lib/parrSharedAvailability";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const route = req.nextUrl.searchParams.get("route");
  const date = req.nextUrl.searchParams.get("date");

  if (route == null || route === "" || date == null || date === "") {
    return NextResponse.json({ ok: false, error: "Missing route or date." }, { status: 400 });
  }

  if (["parr-private", "parr-shared"].includes(route) === false) {
    return NextResponse.json({ ok: false, error: "Unsupported route." }, { status: 400 });
  }

  const availability =
    route === "parr-private"
      ? await getParrPrivateAvailability(date)
      : await getParrSharedAvailability(date);
  const products = getCheckoutProductsForRoute(route);

  return NextResponse.json({
    ok: true,
    route,
    date,
    availability: availability.map((row) => ({
      ...row,
      product: products.find((product) => product.key === row.productKey) || null,
    })),
  });
}
