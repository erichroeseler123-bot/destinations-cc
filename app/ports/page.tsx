import { getEffectivePorts } from "@/lib/dcc/ports";
import PortsSearchClient from "@/app/ports/PortsSearchClient";

export const dynamic = "force-static";

type Port = { slug: string; name: string; area?: string; country?: string; tags?: string[] };

export default function PortsIndex() {
  const ports = getEffectivePorts() as Port[];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Ports</h1>
          <p className="text-zinc-400">Cruise ports & logistics intelligence.</p>
          <p className="text-xs text-zinc-600">Data-backed directory ({ports.length} ports).</p>
        </header>

        <PortsSearchClient ports={ports} />
      </div>
    </main>
  );
}
