'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

type SearchItem = {
  id: string;
  type: 'product' | 'category' | 'area' | 'guide';
  title: string;
  description: string;
  href: string;
  keywords: string[];
  operator?: string;
  tags: string[];
};

export default function MarketplaceSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  // Derive available tags strictly from live items
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      item.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Check query
      if (query.trim()) {
        const q = query.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // simple escape
        const qTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const searchableText = [
          item.title,
          item.description,
          item.operator || '',
          ...item.keywords
        ].join(' ').toLowerCase();
        
        const matchesQuery = qTerms.every(term => searchableText.includes(term));
        if (!matchesQuery) return false;
      }

      // Check tags
      if (activeTags.size > 0) {
        const hasAllTags = Array.from(activeTags).every(tag => item.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [items, query, activeTags]);

  const toggleTag = (tag: string) => {
    const newTags = new Set(activeTags);
    if (newTags.has(tag)) newTags.delete(tag);
    else newTags.add(tag);
    setActiveTags(newTags);
  };

  const clearAll = () => {
    setQuery('');
    setActiveTags(new Set());
  };

  return (
    <div className="w-full">
      <div className="mb-8 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tours, operators, areas, or experiences..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full p-4 pl-12 bg-white border border-nola-amber/50 rounded-sm focus:outline-none focus:border-nola-brass focus:ring-1 focus:ring-nola-brass text-nola-charcoal placeholder-nola-charcoal/40 font-sans"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nola-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold text-nola-charcoal/60 uppercase tracking-wider mr-2 font-sans">Filter:</span>
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border rounded-sm transition-colors font-sans ${
                  activeTags.has(tag) 
                    ? 'bg-nola-shutter border-nola-shutter text-nola-ivory' 
                    : 'bg-white border-nola-amber/50 text-nola-charcoal hover:border-nola-brass'
                }`}
              >
                {tag}
              </button>
            ))}
            {(query || activeTags.size > 0) && (
              <button onClick={clearAll} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-nola-oxblood hover:underline ml-auto font-sans">
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <Link key={item.id} href={item.href} className="group flex flex-col justify-between p-6 bg-white border border-nola-amber/30 rounded-sm hover:border-nola-brass hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-block px-2.5 py-0.5 bg-nola-ivory border border-nola-amber text-nola-tobacco text-[10px] font-bold uppercase tracking-widest rounded-sm font-sans">
                    {item.type}
                  </span>
                </div>
                <h3 className="font-serif text-xl text-nola-charcoal mb-2 group-hover:text-nola-shutter transition-colors">{item.title}</h3>
                <p className="text-sm text-nola-charcoal/70 line-clamp-2 leading-relaxed font-sans">{item.description}</p>
              </div>
              {item.operator && (
                <div className="mt-6 pt-4 border-t border-nola-amber/20 text-xs font-semibold text-nola-charcoal/50 uppercase tracking-widest font-sans">
                  By {item.operator}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-nola-ivory/50 border border-nola-amber/30 rounded-sm">
          <p className="font-serif text-xl text-nola-charcoal mb-2">No exact matches found.</p>
          <p className="text-nola-charcoal/60 mb-6 max-w-md mx-auto text-sm leading-relaxed font-sans">We couldn't find any live experiences matching those filters. Try adjusting your search or clearing all filters.</p>
          <button onClick={clearAll} className="px-6 py-3 bg-nola-shutter text-nola-ivory text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-nola-charcoal transition-colors font-sans">
            Reset Search
          </button>
        </div>
      )}
    </div>
  );
}
