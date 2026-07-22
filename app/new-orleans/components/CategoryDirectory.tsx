import React from 'react';
import { Category } from '../data/types';
import CategoryCard from './CategoryCard';

export default function CategoryDirectory({ categories, showDrafts = false }: { categories: Category[], showDrafts?: boolean }) { 
  const visible = showDrafts ? categories : categories.filter(c => c.status === "live"); 
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{visible.map(c => <CategoryCard key={c.id} category={c} productCount={0} />)}</div>; 
}