import { cookies } from "next/headers";
import type { Metadata } from "next";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";
import { buildNetworkAndTripAnalyticsReport } from "@/lib/dcc/analytics/reporting";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Network Traffic & Trip Lifecycle Analytics | Destination Command Center",
  robots: { index: false, follow: false },
};

export default async function NetworkAndTripAnalyticsAdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isAdminAccessConfigured() || !isValidAdminSession(session)) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/5 p-6">
          <h1 className="text-2xl font-black">Admin Session Required</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Unlock the Admin area via <code>/admin</code> to view Network Traffic &amp; Trip Lifecycle Analytics.
          </p>
        </div>
      </main>
    );
  }

  const sp = searchParams ? await searchParams : {};
  const rawWindow = Array.isArray(sp.window) ? sp.window[0] : sp.window;
  const windowPreset = rawWindow === "24h" || rawWindow === "7d" ? rawWindow : "28d";
  const rawEnv = Array.isArray(sp.env) ? sp.env[0] : sp.env;
  const environment =
    rawEnv === "production" || rawEnv === "preview" || rawEnv === "development" || rawEnv === "test"
      ? rawEnv
      : process.env.VERCEL_ENV === "production"
        ? "production"
        : "preview";

  const initialReport = buildNetworkAndTripAnalyticsReport({
    environment,
    windowPreset,
  });

  return <AnalyticsDashboardClient initialReport={initialReport} />;
}
