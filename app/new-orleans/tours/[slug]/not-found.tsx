import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F9F8F6] text-[#2C2C2A] font-sans px-6">
      <div className="max-w-md w-full border border-[#EBE8E0] bg-white p-10 md:p-14 shadow-sm text-center relative overflow-hidden">

        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B59A65] opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="text-5xl font-serif text-[#1C2E25] mb-6">404</div>

        <div className="space-y-4 mb-8">
          <h1 className="text-2xl font-serif text-[#2C2C2A]">
            Tour Not Found
          </h1>
          <p className="text-[#4A4844] font-light leading-relaxed">
            We couldn’t find that New Orleans tour page. The experience may be unavailable or the link may be broken.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-block w-full border border-[#1C2E25] text-[#1C2E25] hover:bg-[#1C2E25] hover:text-[#F9F8F6] transition-colors font-bold py-4 text-xs uppercase tracking-widest"
          >
            Browse New Orleans Tours
          </Link>
        </div>

      </div>
    </main>
  );
}
