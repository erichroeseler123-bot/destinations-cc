"use client";

const QUICK_PICKUPS = [
  "Downtown Denver hotel",
  "Union Station",
  "RiNo / LoDo address",
  "Custom address",
];

type PickupSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function PickupSelector({ value, onChange }: PickupSelectorProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_PICKUPS.map((pickup) => {
          const active = value === pickup;
          return (
            <button
              key={pickup}
              type="button"
              onClick={() => onChange(pickup)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-orange-500 text-slate-950"
                  : "border border-white/10 bg-white/5 text-white hover:border-white/20"
              }`}
            >
              {pickup}
            </button>
          );
        })}
      </div>

      <label className="block text-sm font-bold text-white">
        Pickup address
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="street-address"
          placeholder="Hotel, Airbnb, or full pickup address"
          className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
        />
      </label>
    </div>
  );
}
