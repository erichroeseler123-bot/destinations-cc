import { Suspense } from "react";
import CheckoutPageClient from "./CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">Loading checkout...</main>}>
      <CheckoutPageClient />
    </Suspense>
  );
}
