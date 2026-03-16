import type { Metadata } from "next";
import { LiveCityNowPage, buildLiveCityNowMetadata } from "@/app/components/dcc/LiveCityNowPage";

export const metadata: Metadata = buildLiveCityNowMetadata("new-orleans");

export default function NewOrleansNowRoute({
  searchParams,
}: {
  searchParams: Promise<{ anchor?: string }>;
}) {
  return <LiveCityNowPage city="new-orleans" searchParams={searchParams} />;
}
