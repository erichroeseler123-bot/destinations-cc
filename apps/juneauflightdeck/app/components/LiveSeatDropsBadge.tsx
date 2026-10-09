import Link from "next/link";
export default function LiveSeatDropsBadge({compact = false, showLink = true}: {compact?: boolean; showLink?: boolean}) {
  return <div className={`rounded-2xl border border-sky-500/30 bg-slate-900/80 ${compact ? "p-3 text-xs" : "p-4 md:p-5"}`}>
    <p className="text-sm text-slate-300">Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.</p>
    {showLink && <Link href="/helicopter-waitlist" className="text-sm text-sky-300">Request Availability Help →</Link>}
  </div>;
}
