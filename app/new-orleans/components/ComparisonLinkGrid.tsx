import React from 'react';
import Link from 'next/link';
import { ComparisonLink } from '../data/types';

export default function ComparisonLinkGrid({ links }: { links: ComparisonLink[] }) {
  if (!links.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {links.map(l => (
        <Link key={l.href} href={l.href} className="group flex items-center justify-between p-6 bg-white border border-[#EBE8E0] rounded-sm hover:border-[#B59A65]/50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#B59A65]">
          <span className="font-serif text-lg text-[#2C2C2A] group-hover:text-[#1C2E25]">{l.label}</span>
          <span className="text-[#B59A65] transform group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      ))}
    </div>
  );
}