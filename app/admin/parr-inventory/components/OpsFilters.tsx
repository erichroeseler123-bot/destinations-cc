type Props = {
  view: string;
  status: string;
  payment: string;
  route: string;
  search: string;
  date: string;
};

export default function OpsFilters({ view, status, payment, route, search, date }: Props) {
  return (
    <form className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,1.4fr)_auto]">
      <input type="hidden" name="view" value={view} />
      <input type="hidden" name="date" value={date} />

      <label className="text-sm text-zinc-300">
        Status
        <select
          name="status"
          defaultValue={status}
          className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
        >
          <option value="all">All statuses</option>
          <option value="needs_review">Needs review</option>
          <option value="pending_payment">Pending payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="canceled">Canceled</option>
          <option value="archived">Archived</option>
        </select>
      </label>

      <label className="text-sm text-zinc-300">
        Payment
        <select
          name="payment"
          defaultValue={payment}
          className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
        >
          <option value="all">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="manual_review">Manual review</option>
          <option value="disputed">Disputed</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>

      <label className="text-sm text-zinc-300">
        Route
        <select
          name="route"
          defaultValue={route}
          className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
        >
          <option value="all">All routes</option>
          <option value="parr-shared">Shared</option>
          <option value="parr-private">Private</option>
        </select>
      </label>

      <label className="text-sm text-zinc-300">
        Date Scope
        <select
          name="date"
          defaultValue={date}
          className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
        >
          <option value="">Auto-select</option>
          <option value="all">All dates</option>
          {date && date !== "all" ? <option value={date}>{date}</option> : null}
        </select>
      </label>

      <label className="text-sm text-zinc-300">
        Search
        <input
          name="search"
          defaultValue={search}
          placeholder="Name, email, phone, order ID"
          className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white placeholder:text-zinc-500"
        />
      </label>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black"
        >
          Apply
        </button>
        <a
          href={`/admin/parr-inventory?view=${encodeURIComponent(view)}`}
          className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/10"
        >
          Reset
        </a>
      </div>
    </form>
  );
}
