import type { DccDiagnostics } from "@/lib/dcc/diagnostics";
import StaleWarning from "@/app/components/StaleWarning";

function fmt(value: string | null): string {
  if (!value) return "n/a";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toISOString().replace("T", " ").slice(0, 16);
}

export default function DiagnosticsBlock({
  diagnostics,
  title = "Diagnostics",
  extraLine,
}: {
  diagnostics: DccDiagnostics;
  title?: string;
  extraLine?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <StaleWarning stale={diagnostics.stale} />
      <p className="text-sm text-zinc-400">
        source={diagnostics.source} • cache_status={diagnostics.cache_status} • stale=
        {diagnostics.stale ? "yes" : "no"}
      </p>
      <p className="text-sm text-zinc-500">
        last_updated={fmt(diagnostics.last_updated)} • stale_after={fmt(diagnostics.stale_after)}
      </p>
      {diagnostics.fallback_reason ? (
        <p className="text-sm text-zinc-500">fallback_reason={diagnostics.fallback_reason}</p>
      ) : null}
      {extraLine ? <p className="text-sm text-zinc-500">{extraLine}</p> : null}
    </section>
  );
}
