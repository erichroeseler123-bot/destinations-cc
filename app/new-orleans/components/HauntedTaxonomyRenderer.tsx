import React from 'react';
import type { HauntedTaxonomy } from '../data/types';

export default function HauntedTaxonomyRenderer({ taxonomy }: { taxonomy: HauntedTaxonomy }) {
  if (!taxonomy || Object.keys(taxonomy).length === 0) return null;

  const renderValue = (value: string | string[] | undefined) => {
    if (!value) return null;
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      return value.join(', ');
    }
    return value;
  };

  const rows = [
    { label: 'Main subject', value: renderValue(taxonomy.primaryTheme) },
    { label: 'Additional themes', value: renderValue(taxonomy.secondaryThemes) },
    { label: 'Tour format', value: renderValue(taxonomy.tourFormats) },
    { label: 'Area', value: renderValue(taxonomy.primaryAreas) },
    { label: 'Cemetery access', value: renderValue(taxonomy.cemeteryAccess) },
    { label: 'Time of day', value: renderValue(taxonomy.timeOfDay) },
    { label: 'Tone', value: renderValue(taxonomy.tones) },
    { label: 'Walking level', value: renderValue(taxonomy.walkingLevel) },
    { label: 'Age guidance', value: renderValue(taxonomy.agePositioning) },
    { label: 'Alcohol component', value: renderValue(taxonomy.alcoholComponent) },
    { label: 'Historical focus', value: renderValue(taxonomy.historicalFocus) },
  ].filter(row => row.value !== null && row.value !== undefined && row.value !== '');

  if (rows.length === 0) return null;

  return (
    <div className="bg-[#1a1a1a] p-8 md:p-10 border border-[#2a2a2a] shadow-sm mb-8">
      <h3 className="font-serif text-2xl text-[#d4af37] mb-6">Formats and themes compared on this page</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map((row, idx) => (
          <div key={idx} className="flex flex-col">
            <dt className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1">{row.label}</dt>
            <dd className="text-[#aaaaaa] font-light text-lg">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
