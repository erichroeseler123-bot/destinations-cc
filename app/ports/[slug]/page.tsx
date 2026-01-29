import { notFound } from 'next/navigation';

export default async function PortPage({ params }: { params: { slug: string } }) {
  const res = await fetch(
    'https://raw.githubusercontent.com/erichroeseler123-bot/dcc-brain/main/outputs/ports.generated.json',
    { cache: 'no-store' }  // always fresh during dev
  );

  if (!res.ok) {
    console.error('Fetch failed:', res.status);
    notFound();
  }

  const ports = await res.json();
  const port = ports.find((p: any) => p.slug === params.slug);

  if (!port) notFound();

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">{port.name}</h1>
      <div className="grid gap-4">
        <p><strong>Location:</strong> {port.city}, {port.region}, {port.country} ({port.iso_country})</p>
        <p><strong>Coordinates:</strong> {port.lat}, {port.lng}</p>
        <p><strong>Dock Notes:</strong> {port.dock_notes || 'N/A'}</p>
        <p><strong>Seasonal Notes:</strong> {port.seasonal_notes || 'N/A'}</p>
        <p><strong>Passengers (latest):</strong> {port.passenger_volume?.toLocaleString() || 'N/A'} ({port.volume_year || 'N/A'})</p>
        <p><strong>Tags:</strong> {port.tags.join(', ') || 'None'}</p>
        <p><strong>Neighbors:</strong> {port.neighbors.join(', ') || 'None'}</p>
      </div>
    </main>
  );
}
