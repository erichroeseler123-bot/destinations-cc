import React from 'react';
import Link from 'next/link';
import { TravelerFitLink } from '../data/types';

export default function TravelerFitDirectory({ fits }: { fits: TravelerFitLink[] }) {
  if (!fits.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {fits.map(f => (
        <Link key={f.href} href={f.href} className="group block bg-[#2E2A25] text-[#F9F8F6] p-6 rounded-sm text-center hover:bg-[#1C2E25] transition-colors focus:outline-none focus:ring-2 focus:ring-[#B59A65]">
          <span className="font-serif text-lg group-hover:text-[#B59A65] transition-colors">{f.label}</span>
        </Link>
      ))}
    </div>
  );
}