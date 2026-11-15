import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";
import { fetchHostedCruisesAdminSnapshotFromCp } from "@/lib/dcc/hostedCruisesAdminBridge";
import HostedCruisesAdminClient from "./HostedCruisesAdminClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Hosted Cruises & Organizer Claims | Destination Command Center Admin",
  robots: { index: false, follow: false },
};

export default async function HostedCruisesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ cpTarget?: string; rcTarget?: string }>;
}) {
  // Defense-in-depth: never fetch or serialize admin data if session cookie is absent/invalid
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isAdminAccessConfigured() || !isValidAdminSession(session)) {
    return null;
  }

  const resolvedParams = await searchParams;
  const initialBridge = await fetchHostedCruisesAdminSnapshotFromCp({
    probeResend: true,
    cpBaseUrlOverride: resolvedParams.cpTarget || null,
    rollcallBaseUrlOverride: resolvedParams.rcTarget || null,
  });

  return (
    <main
      data-testid="dcc-hosted-cruises-admin-page"
      className="min-h-screen overflow-x-clip bg-zinc-950 text-white"
    >
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
              Owner Control Room · Cruise Promenade + RollCallUSA
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Hosted-Cruise Claims &amp; Organizer Controls
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-300">
              Approve or reject organizer claims, edit official cabin-booking
              links and descriptions, choose how guests join a claimed group,
              pause or restore access, and inspect operational alerts—all in
              plain English without touching APIs.
            </p>
          </div>
        </header>

        <HostedCruisesAdminClient
          initialBridge={initialBridge}
          cpTargetOverride={resolvedParams.cpTarget || null}
          rcTargetOverride={resolvedParams.rcTarget || null}
        />
      </div>
    </main>
  );
}
