"use client";

type BookingSummaryCardProps = {
  title: string;
  date: string;
  pickup: string;
  pickupTime: string;
  partySize: number;
  totalCents: number;
  depositCents: number;
  remainingBalanceCents: number;
  remainingFleet: number | null;
  paymentHref?: string;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) return "Choose show date";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookingSummaryCard({
  title,
  date,
  pickup,
  pickupTime,
  partySize,
  totalCents,
  depositCents,
  remainingBalanceCents,
  remainingFleet,
  paymentHref = "#payment-section",
}: BookingSummaryCardProps) {
  const urgencyTone =
    remainingFleet === null
      ? "border-white/10 bg-black/20 text-slate-300"
      : remainingFleet <= 1
        ? "border-red-400/30 bg-red-500/10 text-red-100"
        : remainingFleet <= 2
          ? "border-orange-400/30 bg-orange-500/10 text-orange-100"
          : "border-emerald-400/25 bg-emerald-500/10 text-emerald-50/85";

  const urgencyText =
    remainingFleet === null
      ? "Pick a date to see live availability."
      : remainingFleet <= 1
        ? "Only 1 vehicle left for this date."
        : remainingFleet <= 2
          ? `Only ${remainingFleet} vehicles left for this date.`
          : `${remainingFleet} vehicles still open for this date.`;

  return (
    <aside className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl lg:sticky lg:top-6 lg:self-start">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Booking summary</p>
      <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>

      <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
        <div className="text-xs uppercase tracking-[0.16em] text-emerald-200">Pay now</div>
        <div className="mt-2 text-3xl font-black text-white">{formatMoney(depositCents)}</div>
        {remainingBalanceCents > 0 ? (
          <div className="mt-2 text-sm text-emerald-50/85">
            Remaining later: <span className="font-bold text-white">{formatMoney(remainingBalanceCents)}</span>
          </div>
        ) : null}
      </div>

      <div className={`mt-4 rounded-2xl border p-4 text-sm ${urgencyTone}`}>
        <div className="font-bold">{urgencyText}</div>
      </div>

      <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:hidden" open>
        <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.16em] text-slate-300">
          Trip details
        </summary>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Date</span>
            <span className="text-right font-semibold">{formatDate(date)}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Pickup</span>
            <span className="text-right font-semibold">{pickup || "Add pickup"}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Pickup time</span>
            <span className="text-right font-semibold">{pickupTime}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Riders</span>
            <span className="text-right font-semibold">{partySize}</span>
          </div>
        </div>
      </details>

      <div className="mt-5 hidden space-y-3 text-sm text-slate-200 lg:block">
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-400">Date</span>
          <span className="text-right font-semibold">{formatDate(date)}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-400">Pickup</span>
          <span className="text-right font-semibold">{pickup || "Add pickup"}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-400">Pickup time</span>
          <span className="text-right font-semibold">{pickupTime}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-400">Riders</span>
          <span className="text-right font-semibold">{partySize}</span>
        </div>
        {remainingFleet !== null ? (
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Vehicles open</span>
            <span className="text-right font-semibold">{remainingFleet}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-start justify-between gap-4">
          <span className="text-slate-400">Total</span>
          <span className="text-right text-2xl font-black text-white">{formatMoney(totalCents)}</span>
        </div>
      </div>

      <a
        href={paymentHref}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-950 lg:hidden"
      >
        Continue to payment
      </a>

      <div className="mt-5 grid gap-2 text-sm text-slate-300">
        <div>Fixed pricing</div>
        <div>Guaranteed return included</div>
        <div>Secure payment on one page</div>
        <div>Support by text if needed</div>
      </div>
    </aside>
  );
}
