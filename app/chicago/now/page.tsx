import type { Metadata } from "next";
import { LiveCityNowPage, buildLiveCityNowMetadata } from "@/app/components/dcc/LiveCityNowPage";

export const metadata: Metadata = buildLiveCityNowMetadata("chicago");

export default function ChicagoNowRoute({
  searchParams,
}: {
  searchParams: Promise<{ anchor?: string }>;
}) {
  return <LiveCityNowPage city="chicago" searchParams={searchParams} />;
}
