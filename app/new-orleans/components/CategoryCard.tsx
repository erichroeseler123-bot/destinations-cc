import React from 'react';
import Link from 'next/link';
import { CategoryCardProps } from '../data/types';

export default function CategoryCard({ category, productCount }: CategoryCardProps) {
  const content = (
    <div className={`border p-6 lg:p-8 h-full flex flex-col relative group overflow-hidden transition-all duration-300 rounded-sm ${category.status !== 'live' ? 'opacity-60 bg-[#EBE8E0] border-[#D5E0D9]' : 'bg-white border-[#EBE8E0] hover:border-[#B59A65]/50 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1'}`}>
      {category.status === 'live' && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#B59A65] transition-all duration-300 group-hover:w-full"></span>}
      <h3 className="font-serif text-xl text-[#2C2C2A] group-hover:text-[#1C2E25] transition-colors">{category.title}</h3>
      <p className="text-[10px] uppercase tracking-widest text-[#A89062] font-bold mt-auto pt-4">{category.status === 'live' ? `${productCount} experiences` : 'Coming Soon'}</p>
    </div>
  );
  if (category.status === 'live') return <Link href={`/${category.slug}`} className="block h-full focus:outline-none focus:ring-2 focus:ring-[#B59A65] rounded-sm">{content}</Link>;
  return content;
}