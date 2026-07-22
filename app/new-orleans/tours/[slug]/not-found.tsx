import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 text-slate-800 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
        <div className="text-4xl mb-4">⚜️</div>
        <h2 className="text-xl font-black text-slate-900 mb-4">
          We couldn’t find that New Orleans tour page.
        </h2>
        <Link
          href="/"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors uppercase tracking-wider"
        >
          Browse current New Orleans tours
        </Link>
      </div>
    </div>
  );
}
