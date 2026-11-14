import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";
import { getOrganizerOutreachDashboard } from "@/lib/dcc/organizerOutreachStore";
import OrganizerOutreachClient from "./OrganizerOutreachClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Organizer Outreach & Call Queue | Destination Command Center Admin",
  robots: { index: false, follow: false },
};

export default async function OrganizerOutreachAdminPage() {
  // Defense-in-depth: never fetch or serialize organizer prospect records during SSR
  // if the admin session cookie is absent/invalid (AdminLayout renders Unlock gate).
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isAdminAccessConfigured() || !isValidAdminSession(session)) {
    return null;
  }

  const initialSnapshot = await getOrganizerOutreachDashboard();

  return (
    <main className="min-h-screen overflow-x-clip bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
              Hosted Cruise Pipeline • Durable Call &amp; Email CRM
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Organizer Leads &amp; Outreach Queue
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-300">
              Actionable phone and email dashboard for hosted-group cruise
              organizers. Enforces schedule qualification holds before pitching a
              live sailing page, preserves non-interference with organizers and
              travel advisors, and persists call/email status, follow-up dates,
              notes, boards created, and travelers joined durably in Postgres.
            </p>
          </div>
        </header>

        <OrganizerOutreachClient initialSnapshot={initialSnapshot} />
      </div>
    </main>
  );
}
