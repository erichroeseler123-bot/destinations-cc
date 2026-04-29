import type { Metadata } from "next";
import { CommandHero } from "@/app/components/dcc/command/CommandHero";
import { CommandStatusStrip } from "@/app/components/dcc/command/CommandStatusStrip";
import { CommandViewShell } from "@/app/components/dcc/command/CommandViewShell";
import { getCommandViewData } from "@/lib/dcc/command/service";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Command View | Destination Command Center",
  description:
    "Live movement intelligence across cities, venues, ports, and corridors inside the DCC network.",
  alternates: { canonical: "/command" },
};

export default async function CommandViewPage() {
  const data = await getCommandViewData();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <CommandHero data={data.networkStatus} />
      <CommandStatusStrip data={data.networkStatus} />
      <CommandViewShell data={data} />
    </main>
  );
}
