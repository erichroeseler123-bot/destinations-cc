export const dynamicParams = false; // Forces 404 for cities not in your aliases

import { notFound } from "next/navigation";
import { getNodeSlugFromCity } from "../../src/data/city-aliases";
import aliases from "../../data/city-aliases.json"; // Import for static generation

// This turns the 'ƒ' into a '●'
export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({
    city: city,
  }));
}

export default async function CityPage({
  params
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params;
  const nodeSlug = getNodeSlugFromCity(city);

  if (!nodeSlug) return notFound();

  return (
    <main className="max-w-4xl mx-auto py-20 px-6">
      <div className="space-y-2 text-center md:text-left">
        <span className="text-cyan-500 text-xs font-bold uppercase tracking-widest border border-cyan-500/20 px-2 py-1 rounded">
          Destination Command Center
        </span>
        <h1 className="text-5xl font-black capitalize tracking-tighter mt-4">{city}</h1>
      </div>
      
      <div className="mt-12 p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-md">
        <p className="text-zinc-400 text-lg leading-relaxed">
          The DCC has successfully mapped <span className="text-white font-bold">{city}</span> to the guide at node <span className="text-cyan-400 font-mono">"{nodeSlug}"</span>. 
          Loading local intelligence...
        </p>
      </div>
    </main>
  );
}
