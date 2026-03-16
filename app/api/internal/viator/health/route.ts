import { NextResponse } from "next/server";
import { getViatorCacheFileStats } from "@/lib/viator/cache";
import { getViatorPublicConfig, getViatorServerConfig } from "@/lib/viator/config";
import { getViatorRuntimeCapabilityProbe } from "@/lib/viator/runtime";

export const runtime = "nodejs";

export async function GET() {
  const publicConfig = getViatorPublicConfig();
  const serverConfig = getViatorServerConfig();
  const probe = await getViatorRuntimeCapabilityProbe();

  return NextResponse.json(
    {
      generated_at: new Date().toISOString(),
      config: {
        accessTier: publicConfig.accessTier,
        locale: publicConfig.locale,
        medium: publicConfig.medium,
        apiConfigured: Boolean(serverConfig.apiKey),
      },
      caches: getViatorCacheFileStats(),
      probe,
    },
    { status: 200 }
  );
}
