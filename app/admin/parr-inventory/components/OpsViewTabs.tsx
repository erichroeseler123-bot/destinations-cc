import Link from "next/link";
import type { OpsView } from "@/lib/parr/ops/types";

type Props = {
  activeView: OpsView;
  baseParams: URLSearchParams;
};

const VIEWS: Array<{ value: OpsView; label: string }> = [
  { value: "calendar", label: "Calendar" },
  { value: "run-sheet", label: "Run Sheet" },
  { value: "all-orders", label: "All Orders" },
];

export default function OpsViewTabs({ activeView, baseParams }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {VIEWS.map((view) => {
        const params = new URLSearchParams(baseParams);
        params.set("view", view.value);
        const active = activeView === view.value;
        return (
          <Link
            key={view.value}
            href={`/admin/parr-inventory?${params.toString()}`}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition ${
              active
                ? "bg-orange-500 text-black"
                : "border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
            }`}
          >
            {view.label}
          </Link>
        );
      })}
    </div>
  );
}
