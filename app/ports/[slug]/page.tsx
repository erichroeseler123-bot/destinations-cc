import { notFound } from 'next/navigation';

export default async function PortPage({ params }: { params: { slug: string } }) {
  const res = await fetch(
    'https://raw.githubusercontent.com/erichroeseler123-bot/dcc-brain/main/outputs/ports.generated.json',
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) notFound();

  const ports = await res.json();
  const port = ports.find((p: any) => p.slug === params.slug);

  if (!port) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">{port.name}</h1>
      <p className="text-lg mb-2"><strong>Location:</strong> {port.city}, {port.region}, {port.country}</p>
      <p className="mb-2"><strong>Coordinates:</strong> {port.lat}, {port.lng}</p>
      <p className="mb-2"><strong>Dock Notes:</strong> {port.dock_notes || 'N/A'}</p>
      <p className="mb-2"><strong>Seasonal:</strong> {port.seasonal_notes || 'N/A'}</p>
      <p className="mb-2"><strong>Passengers:</strong> {port.passenger_volume?.toLocaleString() || 'N/A'} ({port.volume_year})</p>
      <p className="mb-2"><strong>Tags:</strong> {port.tags.join(', ') || 'None'}</p>
      <p><strong>Nearby Ports:</strong> {port.neighbors.join(', ') || 'None'}</p>
    </div>
  );
}
