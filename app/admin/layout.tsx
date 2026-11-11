import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import AdminUnlockNextInput from "./AdminUnlockNextInput";
import PortfolioVisitLoader from "./PortfolioVisitLoader";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  const configured = isAdminAccessConfigured();
  const authorized = configured && isValidAdminSession(session);

  if (!configured) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-3xl font-black">Admin Access Not Configured</h1>
          <p className="mt-3 text-zinc-300">
            Set <code>ADMIN_ACCESS_KEY</code> in your environment to enable admin pages.
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-3xl font-black">Admin Unlock</h1>
          <p className="mt-2 text-zinc-300">Enter your admin access key to continue.</p>
          <form action="/admin/unlock" method="post" className="mt-6 space-y-3">
            <AdminUnlockNextInput defaultNext="/admin" />
            <input
              type="password"
              name="key"
              required
              placeholder="Admin access key"
              className="min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
            >
              Unlock Admin
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div>
      <div className="border-b border-white/10 bg-zinc-950/90 px-6 py-3 text-sm text-zinc-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span>Admin area</span>
            <Link
              href="/admin"
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-200 hover:bg-emerald-500/25 hover:text-white"
            >
              Owner Control Center
            </Link>
            <Link
              href="/admin/inbox"
              className="rounded-lg border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 font-semibold text-[#f5c66c] hover:bg-amber-500/25 hover:text-white"
            >
              Operator Inbox
            </Link>
            <Link
              href="/admin/portfolio"
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-200 hover:bg-cyan-500/20 hover:text-white"
            >
              Portfolio Desktop
            </Link>
            <Link href="/admin/portfolio/activity" className="text-zinc-200 hover:text-white">
              Portfolio Activity
            </Link>
            <Link href="/admin/live-pulse" className="text-zinc-200 hover:text-white">
              Live Pulse
            </Link>
            <Link href="/admin/satellite-handoffs" className="text-zinc-200 hover:text-white">
              Satellite Handoffs
            </Link>
            <Link href="/admin/argo-waitlist" className="text-zinc-200 hover:text-white">
              Argo Waitlist
            </Link>
            <Link href="/command" className="text-zinc-200 hover:text-white">
              Command View
            </Link>
          </div>
          <a href="/admin/logout" className="shrink-0 text-zinc-200 hover:text-white">
            Log out
          </a>
        </div>
      </div>
      <PortfolioVisitLoader />
      {children}
    </div>
  );
}
