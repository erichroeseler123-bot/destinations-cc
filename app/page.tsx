import fs from "fs";
import path from "path";
import Link from "next/link";

type Port = {
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
  passenger_volume?: number;
};

function getPorts(): Port[] {
  const filePath = path.join(
    process.cwd(),
    "data",
    "ports.generated.json"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export const dynamic = "force-static";

export default function HomePage() {
  const ports = getPorts();

  // Group ports by region
  const regions: Record<string, Port[]> = {};
  for (const port of ports) {
    if (!regions[port.region]) regions[port.region] = [];
    regions[port.region].push(port);
  }

  // Pick top ports by volume (fallback-safe)
  const majorPorts = [...ports]
    .filter(p => p.passenger_volume)
    .sort((a, b) => (b.passenger_volume ?? 0) - (a.passenger_volume ?? 0))
    .slice(0, 6);

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-16">
      
      {/* HERO / DEFINITION */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">
          Destination Command Center
        </h1>
        <p className="text-lg text-gray-700">
          The Destination Command Center (DCC) is a structured reference system
          for understanding cruise ports, regions, and how travelers move
          between them. It focuses on geography, access, and logistics — not
          bookings or promotions.
        </p>
      </section>

      {/* REGIONS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Browse Cruise Ports by Region
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          {Object.keys(regions).sort().map(region => (
            <li key={region}>
              <Link
                href={`/regions/${region.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-blue-600 hover:underline"
              >
                {region} Cruise Ports
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* MAJOR HUBS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Major Global Cruise Hubs
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          {majorPorts.map(port => (
            <li key={port.slug}>
              <Link
                href={`/ports/${port.slug}`}
                className="text-blue-600 hover:underline"
              >
                {port.name}
              </Link>{" "}
              — {port.city}, {port.country}
            </li>
          ))}
        </ul>
      </section>

      {/* EXPLANATORY CONTENT */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          How Cruise Ports Work
        </h2>
        <p className="text-gray-700">
          Cruise ports serve different roles. Some are embarkation points
          (homeports) where cruises begin and end. Others are ports of call,
          visited briefly during an itinerary. Dock access, tendering rules,
          walkability, and seasonal limits all affect how passengers experience
          each destination.
        </p>
        <p className="text-gray-700">
          The DCC documents these differences so travelers, operators, and
          planners can understand how each port functions within a wider cruise
          network.
        </p>
      </section>

    </main>
  );
}
