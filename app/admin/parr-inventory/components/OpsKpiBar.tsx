import type { OpsSummary } from "@/lib/parr/ops/types";

type Props = {
  summary: OpsSummary;
};

const ITEMS: Array<{ key: keyof OpsSummary; label: string }> = [
  { key: "departuresRunning", label: "Departures" },
  { key: "totalOrders", label: "Orders" },
  { key: "totalSeats", label: "Seats" },
  { key: "pendingOrders", label: "Pending payment" },
  { key: "needsReviewOrders", label: "Needs review" },
  { key: "confirmedOrders", label: "Confirmed" },
];

export default function OpsKpiBar({ summary }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {ITEMS.map((item) => (
        <div key={item.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{item.label}</div>
          <div className="mt-3 text-3xl font-black text-white">{summary[item.key]}</div>
        </div>
      ))}
    </div>
  );
}
