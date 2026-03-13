export default function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string | number }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
        >
          <div className="text-zinc-500">{item.label}</div>
          <div className="text-zinc-200 font-medium">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
