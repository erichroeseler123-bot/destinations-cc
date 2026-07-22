import React from 'react';
import { ProviderBadgeProps } from '../data/types';

export default function ProviderBadge({ provider }: ProviderBadgeProps) { 
  return <span className="inline-block bg-gray-200 text-xs px-2 py-1 rounded">{provider?.publicAttributionName || "Unknown"}</span>; 
}