import React from 'react';
import type { CulinaryTaxonomy } from '../data/types';

export default function CulinaryTaxonomyRenderer({ taxonomy }: { taxonomy: CulinaryTaxonomy }) {
  const fields = [
    { label: "Experience Type", value: taxonomy.experienceType },
    { label: "Participation", value: taxonomy.participation },
    { label: "Food Amount", value: taxonomy.foodAmount },
    { label: "Neighborhoods", value: taxonomy.neighborhoods ? taxonomy.neighborhoods.join(", ") : undefined },
    { label: "Walking Level", value: taxonomy.walkingLevel },
    { label: "Alcohol", value: taxonomy.alcohol },
    { label: "Dietary Handling", value: taxonomy.dietaryHandling },
    { label: "Age Guidance", value: taxonomy.ageGuidance },
    { label: "Duration Type", value: taxonomy.durationType },
  ];

  const visibleFields = fields.filter(f => f.value);

  if (visibleFields.length === 0) return null;

  return (
    <div className="bg-[#101010] border border-[#d4af37]/30 p-6 md:p-8 my-10 max-w-3xl mx-auto">
      <h3 className="font-serif text-xl text-[#fdfbf7] mb-6 border-b border-[#2a2a2a] pb-4">
        Culinary experience characteristics covered in this guide
      </h3>
      <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
        {visibleFields.map((field, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-[#aaaaaa] mb-1">{field.label}</span>
            <span className="text-[#fdfbf7] font-light">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
