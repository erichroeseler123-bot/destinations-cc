import type { Metadata } from "next";
import { LiveCityNowPage, buildLiveCityNowMetadata } from "@/app/components/dcc/LiveCityNowPage";

export const metadata: Metadata = buildLiveCityNowMetadata("las-vegas");

export default function VegasNowRoute({
  searchParams,
}: {
  searchParams: Promise<{ anchor?: string }>;
}) {
  return <LiveCityNowPage city="las-vegas" searchParams={searchParams} />;
}
