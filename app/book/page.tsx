import { Suspense } from "react";
import BookPageClient from "./BookPageClient";

export default function BookPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">Loading booking...</main>}>
      <BookPageClient />
    </Suspense>
  );
}
