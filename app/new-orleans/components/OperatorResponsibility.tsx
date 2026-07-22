import React from 'react';
import { ProviderBadgeProps } from '../data/types';

export default function OperatorResponsibility({ provider }: ProviderBadgeProps) {
  // Enforce marketplace standards on cancellation messaging
  const cancellationText = 'Review the operator’s policy during checkout.';
  return (
    <div className="p-6 bg-[#F9F8F6] border border-[#EBE8E0] text-[#4A4844] rounded-sm">
      <p className="mb-3 text-sm">
        <span className="font-bold text-[#1C2E25] uppercase tracking-widest text-xs mr-2">Operated by:</span> 
        <span className="font-serif">{provider.publicAttributionName}</span>
      </p>
      <p className="text-sm">
        <span className="font-bold text-[#1C2E25] uppercase tracking-widest text-xs mr-2">Cancellation:</span> 
        <span className="italic">{cancellationText}</span>
      </p>
    </div>
  );
}