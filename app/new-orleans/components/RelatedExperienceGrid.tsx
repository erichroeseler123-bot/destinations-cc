import React from 'react';
import { RelatedExperience } from '../data/types';
import ProductCard from './ProductCard';

export default function RelatedExperienceGrid({ products }: { products: RelatedExperience[] }) { 
  if (!products.length) return null; 
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{products.map(p => <ProductCard key={p.product.id} product={p.product} />)}</div>; 
}