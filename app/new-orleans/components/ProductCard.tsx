import React from 'react';
import Link from 'next/link';
import { ProductCardProps } from '../data/types';
import AvailabilityBadge from './AvailabilityBadge';

export default function ProductCard({ product }: ProductCardProps) {
  // @ts-ignore - categoryIds exists on product
  const categoryId = product.categoryId || (product.categoryIds && product.categoryIds[0]);
  const isImageFree = !product.imageUrl || categoryId === 'plantation-tours';

  return (
    <div className="border border-nola-amber/50 bg-white flex flex-col h-full shadow-sm hover:shadow-lg transition-shadow hover:border-nola-brass group rounded-sm overflow-hidden">
      
      {/* Media Section */}
      {!isImageFree ? (
        <div className="relative h-48 w-full bg-nola-amber/10 overflow-hidden">
           {/* Fallback pattern underneath the image */}
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-multiply"></div>
           <img 
             src={product.imageUrl!} 
             alt={product.imageAlt || product.title}
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      ) : (
        <div className="relative h-48 w-full bg-nola-tobacco flex flex-col items-center justify-center p-6 text-center border-b border-nola-brass">
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
           <div className="w-12 h-[1px] bg-nola-brass mb-4"></div>
           <span className="font-serif text-nola-ivory text-xl tracking-wide leading-tight">{product.title}</span>
           <div className="w-12 h-[1px] bg-nola-brass mt-4"></div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 lg:p-8 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl text-nola-charcoal mb-3 group-hover:text-nola-shutter transition-colors line-clamp-2">
          {product.title}
        </h3>
        
        {product.operatorAttribution && (
          <p className="text-[10px] font-bold text-nola-charcoal/50 uppercase tracking-widest mb-4">
            Operated by {product.operatorAttribution}
          </p>
        )}
        
        <p className="text-sm font-light text-nola-charcoal/70 line-clamp-3 mb-6 leading-relaxed">
          {product.description || (product as any).experience?.summary}
        </p>

        <div className="mt-auto pt-6 border-t border-nola-amber/30">
          <div className="mb-4">
             <AvailabilityBadge product={product} />
          </div>
          {product.isBookable ? 
            <Link 
              href={`/new-orleans/tours/${product.slug}`} 
              className="block w-full text-center border border-nola-charcoal bg-transparent text-nola-charcoal hover:bg-nola-charcoal hover:text-nola-ivory transition-colors font-bold py-3.5 text-xs uppercase tracking-widest rounded-sm"
            >
              View Details
            </Link> 
            : 
            <span className="block w-full py-3.5 border border-nola-amber/50 text-nola-charcoal/40 bg-nola-ivory text-center rounded-sm text-xs font-bold uppercase tracking-widest cursor-not-allowed">
              Preview
            </span>
          }
        </div>
      </div>
    </div>
  );
}