import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";
import OctoBookingPanel from "./BookingPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = MockOctoSupplierEngine.getProduct(productId);

  if (!product) {
    return { title: "Tour Not Found | Destination Command Center" };
  }

  return {
    title: `${product.title} | Destination Command Center`,
    description: product.description,
    alternates: { canonical: `/tours/octo/${productId}` },
  };
}

export default async function OctoProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = MockOctoSupplierEngine.getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/8 bg-black/40">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-4 text-xs text-white/50 sm:px-8">
          <Link href="/" className="hover:text-white">DCC</Link>
          <span>/</span>
          <Link href="/tours" className="hover:text-white">Tours</Link>
          <span>/</span>
          <Link href="/octo" className="text-cyan-400 hover:underline">OCTO Direct</Link>
          <span>/</span>
          <span className="text-white/80 truncate">{product.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Main Product Info (7 cols) */}
          <div className="space-y-8 lg:col-span-7">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  OCTO Core Connection
                </span>
                <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Authoritative Operator
                </span>
                <span className="text-xs text-white/40 font-mono">
                  {product.reference}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl text-white">
                {product.title}
              </h1>

              <p className="mt-3 text-sm text-white/60">
                Location: <span className="font-semibold text-white/90">{product.location}</span>
                {product.durationMinutes && (
                  <> · Duration: <span className="font-semibold text-white/90">~{Math.round(product.durationMinutes / 60)} hours</span></>
                )}
              </p>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white">Tour Overview</h2>
              <p className="text-sm leading-relaxed text-white/70">
                {product.description}
              </p>
            </div>

            {/* Meeting Point & Departure */}
            {product.meetingPoint && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Meeting Point & Departure
                </h3>
                <p className="text-sm font-medium text-white/90">
                  {product.meetingPoint}
                </p>
                {product.placeCoordinates && (
                  <p className="font-mono text-xs text-white/50">
                    Coordinates: {product.placeCoordinates.lat.toFixed(5)}, {product.placeCoordinates.lng.toFixed(5)}
                  </p>
                )}
              </div>
            )}

            {/* Cancellation Terms */}
            {product.cancellationPolicy && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                  Operator Cancellation Policy
                </h3>
                <p className="text-sm text-white/70">
                  {product.cancellationPolicy}
                </p>
              </div>
            )}

            {/* Provider Attribution & Sovereign Protocol */}
            <div className="rounded-2xl border border-white/5 bg-black/40 p-6 text-xs text-white/50 space-y-2">
              <p className="font-bold text-white/80">Direct Connection Disclosure</p>
              <p>
                This tour is retrieved and reserved directly against the operator’s authorized OCTO API. DCC facilitates
                sovereign discovery and reservation routing under a fixed 5% platform share. The operator remains the
                merchant-of-record and holds sole authority over tour execution.
              </p>
            </div>
          </div>

          {/* Sticky Booking Engine Panel (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <OctoBookingPanel product={product} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
