import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  isAdminAccessConfigured,
  isValidAdminSession,
} from "@/lib/adminAccess";
import {
  getUnifiedOperatorInbox,
  validateCpBaseUrlOverride,
} from "@/lib/dcc/operatorInbox";
import OperatorInboxClient from "./OperatorInboxClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Unified Operator Inbox | Destination Command Center Admin",
  robots: { index: false, follow: false },
};

type SearchParamsInput = Promise<{
  view?: string | string[];
  site?: string | string[];
  status?: string | string[];
  cpPreviewUrl?: string | string[];
}>;

function firstParam(val?: string | string[]): string | null {
  if (typeof val === "string" && val.trim()) return val.trim();
  if (Array.isArray(val) && typeof val[0] === "string" && val[0].trim()) {
    return val[0].trim();
  }
  return null;
}

export default async function OperatorInboxAdminPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  // Defense-in-depth: never fetch or serialize customer inquiry rows during SSR
  // if the admin session cookie is absent/invalid (AdminLayout renders Unlock gate).
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (!isAdminAccessConfigured() || !isValidAdminSession(session)) {
    return null;
  }

  const sp = searchParams ? await searchParams : {};
  const view = firstParam(sp.view) || "genuine";
  const site = firstParam(sp.site);
  const status = firstParam(sp.status);
  const rawCpPreviewUrl = firstParam(sp.cpPreviewUrl);
  const cpCheck = validateCpBaseUrlOverride(rawCpPreviewUrl);
  const validCpPreviewUrl = cpCheck.valid ? cpCheck.url : null;

  const initialData = await getUnifiedOperatorInbox({
    view,
    site,
    status,
    cpPreviewUrl: validCpPreviewUrl,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f5c66c]">
              Network Operations • Durable Customer Intake
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Unified Operator Inbox
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-300">
              Aggregates durable web submissions across Destination Command
              Center, Mighty Argo, Somerset, Welcome to the Dells, Save On The
              Strip, and Cruise Promenade with outbound alert audits and
              non-destructive triage overlays.
            </p>
          </div>
        </header>

        <OperatorInboxClient
          initialData={initialData}
          initialCpPreviewUrl={validCpPreviewUrl}
        />
      </div>
    </main>
  );
}
