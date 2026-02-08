import fs from "fs";
import path from "path";
import Link from "next/link";

/* ================================
   Types
================================ */

type Port = {
  slug: string;
  name: string;
  city: string;
  region?: string;
  country: string;
  passenger_volume?: number;
};

/* ================================
   Data Loader (Build-Safe)
================================ */

function getPorts(): Port[] {
  const filePath = path.join(
    process.cwd(),
    "data",
    "ports.generated.json"
  );

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Port[];
  } catch (err) {
    console.error("Failed to load ports data:", err);
    return [];
  }
}

/* ================================
   Static Generation
================================ */

export const dynamic = "force-static";

/* ================================
   Page
================================ */

export default function HomePage() {
  const ports = getPorts();

  /* ================================
     Group Ports by Region (Safe)
  ================================ */

  const regions: Record<string, Port[]> = {};

  for (const port of ports) {
    const region = port.region?.trim() || "Other";

    (regions[region] ??= []).push(port);
  }

  /* ================================
     Major Hubs (Top by Volume)
  ================================ */

  const majorPorts = [...ports]
    .filter((p) => typeof p.passenger_volume === "number")
    .sort(
      (a, b) =>
        (b.passenger_volume ?? 0) -
        (a.passenger_volume ?? 0)
    )
    .slice(0, 6);

  /* ================================
     Render
  ================================ */

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-16">

      {/* ================= HERO ================= */}
      <section className="space-y-4">

        <h1 className="text-4xl font-bold">
          Destination Command Center
        </h1>

        <p className="text-lg text-gray-700">
          The Destination Command Center (DCC) is a structured reference
          system for understanding cruise ports, regions, and how
          travelers move between them.
        </p>

        <p className="text-gray-700">
          It focuses on geography, access, and logistics — not
          bookings or promotions.
        </p>

      </section>


      {/* ================= REGIONS ================= */}
      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">
          Browse Cruise Ports by Region
        </h2>

        <ul className="list-disc pl-6 space-y-1">

          {Object.keys(regions)
            .sort()
            .map((region) => {

              const slug = region
                .toLowerCase()
                .replace(/\s+/g, "-");

              return (
                <li key={region}>

                  <Link
                    href={`/regions/${slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {region} Cruise Ports
                  </Link>

                </li>
              );
            })}

        </ul>

      </section>


      {/* ================= MAJOR HUBS ================= */}
      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">
          Major Global Cruise Hubs
        </h2>

        <ul className="list-disc pl-6 space-y-1">

          {majorPorts.map((port) => (
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


      {/* ================= EXPLANATION ================= */}
      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">
          How Cruise Ports Work
        </h2>

        <p className="text-gray-700">
          Cruise ports serve different roles.
          Some are embarkation points (homeports),
          where cruises begin and end.
        </p>

        <p className="text-gray-700">
          Others are ports of call, visited briefly
          during an itinerary. Dock access,
          tendering rules, walkability, and
          seasonal limits affect how passengers
          experience each destination.
        </p>

        <p className="text-gray-700">
          The DCC documents these differences so
          travelers, operators, and planners can
          understand how each port functions
          within a wider cruise network.
        </p>

      </section>

    </main>
  );
}
