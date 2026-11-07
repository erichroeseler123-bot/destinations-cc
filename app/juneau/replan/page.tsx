import type { Metadata } from "next";
import JuneauLowBandwidthReplanView from "@/app/components/dcc/JuneauLowBandwidthReplanView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "Juneau Low-Bandwidth Cruise Replanner (Weak Wi-Fi Mode) | Destination Command Center",
  description:
    "Text-first, sub-50 KB Juneau port-day replanner for weak ship Wi-Fi. Update ship arrival or all-aboard time, see what still fits with a 60–90 minute buffer, view your offline saved plan, and continue to Juneau Flight Deck.",
  alternates: { canonical: "https://destinationcommandcenter.com/juneau/replan" },
  robots: { index: true, follow: true },
};

export default async function JuneauLowBandwidthReplanPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};

  return (
    <main className="min-h-screen bg-[#041018] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <JuneauLowBandwidthReplanView
          searchParams={sp}
          fullPageMode
          actionPath="/juneau/replan"
        />
      </div>
    </main>
  );
}
