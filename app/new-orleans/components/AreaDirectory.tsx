import React from 'react';
import Link from 'next/link';
import { AreaLink } from '../data/types';

export default function AreaDirectory({ areas }: { areas: AreaLink[] }) {
  if (!areas.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {areas.map(a => (
        <Link key={a.href} href={a.href} className="group block border border-[#EBE8E0] bg-white p-6 rounded-sm text-center transition-all duration-300 hover:border-[#B59A65]/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B59A65]">
          <span className="font-serif text-lg text-[#2C2C2A] group-hover:text-[#1C2E25]">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}