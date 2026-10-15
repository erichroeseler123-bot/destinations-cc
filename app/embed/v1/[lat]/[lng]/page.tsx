import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import LiveEmbedWidget, { WidgetTheme, WidgetAccent } from "@/app/components/widget/LiveEmbedWidget";
import { readLocationIntelligence } from "@/lib/dcc/locationIntelligence";
import { verifyDomainAuthorization } from "@/lib/billing/licenses";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ lat: string; lng: string }>;
  searchParams: Promise<{
    theme?: string;
    accent?: string;
    modules?: string;
    name?: string;
    branding?: string;
    key?: string;
  }>;
};

function parseCoordinate(value: string, min: number, max: number): number | null {
  const decoded = decodeURIComponent(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(decoded)) return null;
  const num = Number(decoded);
  return Number.isFinite(num) && num >= min && num <= max ? num : null;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { lat, lng } = await params;
  return {
    title: `Live Venue Conditions (${lat}, ${lng}) | Destination Command Center`,
    description: "Live coordinate-native weather, water, and hazard conditions widget.",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedV1Page({ params, searchParams }: RouteProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const reqHeaders = await headers();

  const lat = parseCoordinate(resolvedParams.lat, -90, 90);
  const lng = parseCoordinate(resolvedParams.lng, -180, 180);

  if (lat == null || lng == null) {
    notFound();
  }

  let data: any = null;
  try {
    data = await readLocationIntelligence({ lat, lng });
  } catch (err) {
    console.error("Failed to load location intelligence for embed:", err);
  }

  const theme = (query.theme as WidgetTheme) || "dark";
  const accent = (query.accent as WidgetAccent) || "cyan";
  const customName = query.name ? decodeURIComponent(query.name) : null;
  const key = query.key || null;

  // Domain & License Enforcement
  const referer = reqHeaders.get("referer") || reqHeaders.get("origin") || null;
  const authResult = await verifyDomainAuthorization(key, referer);

  // If whitelabel (branding=hide) is requested, strict license and domain authorization is required
  const wantsWhitelabel = query.branding === "hide";
  const canHideBranding = wantsWhitelabel && authResult.authorized;
  const showBranding = !canHideBranding;

  const licenseWarning = wantsWhitelabel && !authResult.authorized
    ? authResult.reason === "invalid_license_key"
      ? "Invalid license key. Re-enter key at destinationcommandcenter.com/pricing"
      : authResult.reason === "domain_not_whitelisted"
      ? `Domain not authorized. Add your website domain to your license at destinationcommandcenter.com/pricing`
      : authResult.reason === "license_past_due"
      ? "License renewal required. Visit destinationcommandcenter.com/pricing"
      : "Active venue license ($39/mo) required for whitelabel embeds."
    : null;

  const activeModules = query.modules
    ? query.modules.split(",").map((m) => m.trim().toLowerCase())
    : ["weather", "forecast", "alerts", "water", "air"];

  return (
    <main className="w-full min-h-screen p-2 sm:p-4 flex items-center justify-center bg-transparent">
      <LiveEmbedWidget
        lat={lat}
        lng={lng}
        initialData={data}
        customName={customName}
        theme={theme}
        accent={accent}
        activeModules={activeModules}
        showBranding={showBranding}
        licenseWarning={licenseWarning}
        licenseKey={key}
      />
    </main>
  );
}
