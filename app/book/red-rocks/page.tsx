import { redirect } from "next/navigation";
import { buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

type SearchParamsValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<Record<string, SearchParamsValue>>;
};

export default async function RedRocksBookingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  redirect(buildParrSharedRedRocksUrl(resolvedSearchParams));
}
