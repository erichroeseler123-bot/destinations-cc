import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(
    {
      spec: "dcc-product-scope",
      version: 1,
      scope: DCC_PRODUCT_SCOPE,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
