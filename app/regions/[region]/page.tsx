import { notFound } from 'next/navigation';

export const revalidate = 300;

async function getPorts() {
  const res = await fetch(
    'https://raw.githubusercontent.com/erichroeseler123-bot/dcc-brain/main/outputs/ports.generated.json',
    { next: { revalidate: 300 } }
  );

  if (!res.ok) throw new Error('Failed to load ports');
  return res.json();
}

export default async function RegionPage({
  params,
}: {
  params: { region: string };
}) {
  const ports = await getPorts();

  const regionPorts = ports.filter(
    (p: any) =>
      p.region.toLowerCase().replace(/\s+/g, '-') === params.region
  );

  if (regionPorts.length === 0) notFound();

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">
        Cruise Ports in {regionPorts[0].region}
      </h1>

      <ul className="space-y-4">
        {regionPorts.map((port: any) => (
          <li key={port.slug}>
            <a
              href={`/ports/${port.slug}`}
              className="text-blue-600 underline text-lg"
            >
              {port.name}
            </a>
            <div className="text-sm text-gray-600">
              {port.city}, {port.country}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
