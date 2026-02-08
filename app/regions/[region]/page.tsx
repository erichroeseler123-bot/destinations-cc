import fs from "fs";
import path from "path";
import Link from "next/link";

type Port = {
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
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

/* REQUIRED for static export */
export async function generateStaticParams() {
  const ports = getPorts();

  const regions = new Set<string>();

  for (const port of ports) {
    if (port.region) {
      regions.add(
        port.region.toLowerCase().replace(/\s+/g, "-")
      );
    }
  }

  return Array.from(regions).map(region => ({
    region,
  }));
}

export const dynamic = "force-static";

export default function RegionPage({
  params,
}: {
  params: { region: string };
}) {
  const ports = getPorts();

  const regionName = params.region
    .replace(/-/g, " ")
    .toLowerCase();

  const regionPorts = ports.filter(
    p =>
      p.region &&
      p.region.toLowerCase().replace(/\s+/g, "-") ===
        params.region
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-12">
      <h1 className="text-3xl font-bold capitalize">
        {regionName} Cruise Ports
      </h1>

      <ul className="list-disc pl-6 space-y-2">
        {regionPorts.map(port => (
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
    </main>
  );
}
