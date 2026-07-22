import React from 'react';
import { LiveProductAdapter, DraftProduct } from '../data/types';

export default function AvailabilityBadge({ product }: { product: LiveProductAdapter | DraftProduct }) {
  if (product.status !== 'live') return null;
  return <span className="inline-block bg-[#F9F8F6] border border-[#EBE8E0] text-[#4A4844] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-sm">Availability is checked during operator checkout.</span>;
}