export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";

// Import JSON directly (no fs/path) — safe for next-on-pages
import portsData from "../../../data/ports.generated.json";

type Port = {
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
  passenger_volume?: number;
};

const ports = portsData as Port[];

/* REQUIRED for static export */
export async function generateStaticParams() {
  return ports.map((port) => ({
    slug: port.slug,
  }));
}


export default async function PortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;

  const port = ports.find((p) => p.slug === resolvedParams.slug);

  if (!port) notFound();

  return (
    <main className="max-w-4xl mx-auto px-6 py-20 space-y-10">
      {/* HEADER */}
      <section>
        <h1 className="text-3xl font-bold">{port.name}</h1>
        <p className="text-gray-600">
          {port.city}, {port.country}
        </p>
      </section>

      {/* METADATA */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Port Overview</h2>

        <ul className="list-disc pl-6 space-y-1 text-gray-700">
          <li>
            <strong>Region:</strong> {port.region}
          </li>

          {typeof port.passenger_volume === "number" && (
            <li>
              <strong>Annual Passengers:</strong>{" "}
              {port.passenger_volume.toLocaleString()}
            </li>
          )}
        </ul>
      </section>

      {/* NAVIGATION */}
      <section className="pt-6 border-t">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to All Regions
        </Link>
      </section>
    </main>
  );
}
