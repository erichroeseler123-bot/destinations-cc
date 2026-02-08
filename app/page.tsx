import fs from "fs";
import path from "path";
import Link from "next/link";

/* ================= TYPES ================= */

type Port = {
  slug: string;
  name: string;
  city: string;
  region?: string;
  country: string;
  passenger_volume?: number;
};

/* ================= DATA ================= */

function getPorts(): Port[] {
  const filePath = path.join(
    process.cwd(),
    "data",
    "ports.generated.json"
  );

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load ports data:", err);
    return [];
  }
}

export const dynamic = "force-static";

/* ================= PAGE ================= */

export default function HomePage() {
  const ports = getPorts();

  /* ---------- Group by Region ---------- */

  const regions: Record<string, Port[]> = {};

  for (const port of ports) {
    const key = port.region?.trim() || "Other";

    if (!regions[key]) {
      regions[key] = [];
    }

    regions[key].push(port);
  }

  /* ---------- Major Hubs ---------- */

  const majorPorts = [...ports]
    .filter(p => typeof p.passenger_volume === "number")
    .sort(
      (a, b) =>
        (b.passenger_volume ?? 0) -
        (a.passenger_volume ?? 0)
    )
    .slice(0, 6);

  const sortedRegions = Object.keys(regions).sort();

  /* ================= RENDER ================= */

  return (
    <main className="max-w-7xl mx-auto px-6 py-20 space-y-24">

      {/* ==================================================
         HERO
      ================================================== */}

      <section className="text-center space-y-6">

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Destination Command Center
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          An authority reference layer for cruise ports,
          regional networks, and global travel logistics.
        </p>

        <div className="flex justify-center gap-4 pt-4">

          <Link
            href="/regions/florida"
            className="px-6 py-3 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
          >
            Explore Regions
          </Link>

          <Link
            href="/mighty-argo-shuttle"
            className="px-6 py-3 rounded-lg border text-sm font-medium hover:bg-gray-50 transition"
          >
            View Nodes
          </Link>

        </div>

      </section>


      {/* ==================================================
         QUICK ACCESS
      ================================================== */}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <QuickCard
          href="/regions/florida"
          title="Browse Regions"
          description="Explore ports by geography."
        />

        <QuickCard
          href="/ports/portmiami"
          title="Major Hubs"
          description="High-volume cruise terminals."
        />

        <QuickCard
          href="/mighty-argo-shuttle"
          title="Transport Nodes"
          description="Connected logistics services."
        />

      </section>


      {/* ==================================================
         REGIONS
      ================================================== */}

      <section className="space-y-6">

        <header className="space-y-1">

          <h2 className="text-2xl font-semibold">
            Cruise Regions
          </h2>

          <p className="text-sm text-gray-600">
            Organized port networks by geography.
          </p>

        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {sortedRegions.map(region => {

            const slug = region
              .toLowerCase()
              .replace(/\s+/g, "-");

            const count = regions[region]?.length ?? 0;

            return (

              <Link
                key={region}
                href={`/regions/${slug}`}
                className="p-4 rounded-lg border hover:bg-gray-50 transition text-sm"
              >
                <div className="font-medium">
                  {region}
                </div>

                <div className="text-gray-500 mt-1">
                  {count} ports
                </div>
              </Link>

            );
          })}

        </div>

      </section>


      {/* ==================================================
         MAJOR HUBS
      ================================================== */}

      <section className="space-y-6">

        <header className="space-y-1">

          <h2 className="text-2xl font-semibold">
            Major Global Hubs
          </h2>

          <p className="text-sm text-gray-600">
            Highest passenger volume terminals.
          </p>

        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {majorPorts.map(port => (

            <Link
              key={port.slug}
              href={`/ports/${port.slug}`}
              className="p-5 rounded-lg border hover:shadow-sm transition"
            >
              <div className="font-medium">
                {port.name}
              </div>

              <div className="text-sm text-gray-600 mt-1">
                {port.city}, {port.country}
              </div>

            </Link>

          ))}

        </div>

      </section>


      {/* ==================================================
         FOOTER
      ================================================== */}

      <footer className="pt-12 border-t text-center text-sm text-gray-500 space-y-1">

        <p>
          © {new Date().getFullYear()} Destination Command Center
        </p>

        <p>
          Authority Layer • Logistics Reference • Network Intelligence
        </p>

      </footer>

    </main>
  );
}


/* ======================================================
   COMPONENTS
====================================================== */

type QuickCardProps = {
  href: string;
  title: string;
  description: string;
};

function QuickCard({
  href,
  title,
  description,
}: QuickCardProps) {

  return (
    <Link
      href={href}
      className="p-6 rounded-xl border hover:shadow-md transition group"
    >
      <h3 className="font-semibold text-lg group-hover:text-black">
        {title}
      </h3>

      <p className="text-sm text-gray-600 mt-2">
        {description}
      </p>
    </Link>
  );
}
