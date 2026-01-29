import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';

export default function Home() {
  const ports = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/ports.json'), 'utf8'));

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Destinations</h1>
          <p className="text-xl text-slate-500 mt-2 font-medium">Explore cruise ports and local attractions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {ports.map((port: any) => (
            <Link key={port.slug} href={`/ports/${port.slug}`} className="group relative block bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100">
              <div className="relative h-72 w-full overflow-hidden">
                <img 
                  src={port.imageUrl} 
                  alt={port.port_name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-2 inline-block">
                    {port.region}
                  </span>
                  <h2 className="text-3xl font-bold text-white leading-tight">{port.port_name}</h2>
                </div>
              </div>
              <div className="p-8">
                <p className="text-slate-500 line-clamp-2 leading-relaxed text-sm mb-6 italic">"{port.description}"</p>
                <div className="flex items-center text-blue-600 font-bold text-sm group-hover:gap-2 transition-all">
                  VIEW FULL GUIDE <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
