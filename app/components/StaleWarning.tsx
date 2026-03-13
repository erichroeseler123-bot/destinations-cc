export default function StaleWarning({
  stale,
  message = "Freshness warning: data may be outdated.",
}: {
  stale: boolean;
  message?: string;
}) {
  if (!stale) return null;
  return <p className="text-sm text-amber-300">{message}</p>;
}
