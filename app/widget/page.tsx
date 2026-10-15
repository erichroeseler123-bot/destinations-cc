import type { Metadata } from "next";
import WidgetConfigurator from "@/app/components/widget/WidgetConfigurator";

export const metadata: Metadata = {
  title: "Live Venue Weather & Logistics Widget | Destination Command Center",
  description: "Embed live weather, hourly rain timelines, NWS hazard alerts, and NOAA river flow gauges on your venue or tour website in 60 seconds.",
  openGraph: {
    title: "Live Venue Weather & Logistics Widget | Destination Command Center",
    description: "Embed live weather, hourly rain timelines, NWS hazard alerts, and NOAA river flow gauges on your venue or tour website in 60 seconds.",
    url: "https://destinationcommandcenter.com/widget",
  },
};

export default function WidgetPage() {
  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <WidgetConfigurator />
    </main>
  );
}
