import Link from "next/link";
import { filterArgoWaitlist, readArgoWaitlist } from "@/lib/argoWaitlist";

export const dynamic = "force-dynamic";

type SearchParams = {
  month?: string;
  minParty?: string;
  maxParty?: string;
};

function toInt(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : undefined;
}

export default async function ArgoWaitlistAdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  const month = (sp.month || "").trim();
  const minParty = toInt(sp.minParty);
  const maxParty = toInt(sp.maxParty);

  const allEntries = (await readArgoWaitlist()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const entries = filterArgoWaitlist(allEntries, {
    preferredMonth: month || undefined,
    minPartySize: minParty,
    maxPartySize: maxParty,
  });

  const months = Array.from(
    new Set(allEntries.map((x) => x.preferredMonth).filter((x): x is string => Boolean(x))),
  ).sort();

  const csvQs = new URLSearchParams();
  if (month) csvQs.set("month", month);
  if (minParty) csvQs.set("minParty", String(minParty));
  if (maxParty) csvQs.set("maxParty", String(maxParty));

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Argo Waitlist</h1>
            <p className="mt-2 text-zinc-300">
              {entries.length} filtered entries • {allEntries.length} total entries
            </p>
          </div>
          <Link
            href={`/admin/argo-waitlist/export${csvQs.toString() ? `?${csvQs.toString()}` : ""}`}
            className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Export CSV
          </Link>
        </div>

        <form className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
          <label className="text-sm text-zinc-300">
            Preferred Month
            <select
              name="month"
              defaultValue={month}
              className="mt-1 min-h-10 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Min Party Size
            <input
              type="number"
              name="minParty"
              defaultValue={minParty}
              min={1}
              className="mt-1 min-h-10 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-zinc-300">
            Max Party Size
            <input
              type="number"
              name="maxParty"
              defaultValue={maxParty}
              min={1}
              className="mt-1 min-h-10 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Apply
            </button>
            <Link
              href="/admin/argo-waitlist"
              className="min-h-10 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Preferred Month</th>
                <th className="px-4 py-3 font-semibold">Party Size</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.createdAt}-${entry.email}`} className="border-b border-white/10">
                  <td className="px-4 py-3 text-zinc-300">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{entry.email}</td>
                  <td className="px-4 py-3 text-zinc-300">{entry.name || "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{entry.preferredMonth || "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{entry.partySize ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{entry.source}</td>
                </tr>
              ))}
              {entries.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-400" colSpan={6}>
                    No waitlist entries found for the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
