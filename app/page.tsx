export default async function Home() {
  const res = await fetch(
    'https://raw.githubusercontent.com/erichroeseler123-bot/dcc-brain/main/outputs/ports.generated.json',
    { next: { revalidate: 3600 } }
  );

  const ports = await res.json();

  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Top Cruise Ports</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ports.map((port: any) => (
          <li key={port.slug} className="border p-4 rounded-lg hover:bg-gray-50">
            <a href={`/ports/${port.slug}`} className="text-xl font-semibold text-blue-600 hover:underline">
              {port.name}
            </a>
            <p className="text-gray-600">{port.city}, {port.country}</p>
            <p className="text-sm text-gray-500">{port.passenger_volume?.toLocaleString() || 'N/A'} passengers ({port.volume_year})</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
