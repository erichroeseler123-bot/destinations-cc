import { Suspense } from "react";
import { redirect } from "next/navigation";
import BookPageClient from "./BookPageClient";

type SearchParamsValue = string | string[] | undefined;
type BookPageProps = {
  searchParams?: Promise<Record<string, SearchParamsValue>>;
};

function readFirst(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const route = readFirst(resolvedSearchParams.route);

  if (route === "argo") {
    redirect("/mighty-argo");
  }

  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">Loading booking...</main>}>
      <BookPageClient />
    </Suspense>
  );
}
