import React from 'react';
import Link from 'next/link';
import { ProductCardProps } from '../data/types';
import { STOREFRONT_PRODUCTS } from '../tours/pageConfig';
import { WIKIMEDIA_IMAGES } from '../data/wikimedia';
import WikimediaImageCredit from './WikimediaImageCredit';
import { resolveProductImage } from '../lib/imageResolver';
import {
  buildAttributedTourHref,
  FAREHARBOR_SOURCES,
  isApprovedProductSlug,
  type FareHarborSource,
} from '../lib/fareHarborAttribution';

type AttributedProductCardProps = ProductCardProps & {
  attributionSource?: FareHarborSource;
};

export default function ProductCard({
  product,
  attributionSource = FAREHARBOR_SOURCES.guide,
}: AttributedProductCardProps) {
  // @ts-ignore - categoryIds exists on product
  const categoryId = product.categoryId || (product.categoryIds && product.categoryIds[0]);
  const sourceProduct = STOREFRONT_PRODUCTS.find((item) => item.slug === product.slug);
  const cues = [
    sourceProduct?.durationLabel,
    sourceProduct?.pickupSummary || sourceProduct?.transportationSummary,
    sourceProduct?.physicalFormat?.walking,
    sourceProduct?.physicalFormat?.exposure,
  ].filter((cue): cue is string => Boolean(cue)).slice(0, 4);
  const resolvedImage = resolveProductImage(product);
  const detailHref = isApprovedProductSlug(product.slug)
    ? buildAttributedTourHref(product.slug, attributionSource)
    : `/tours/${product.slug}`;

  return (
    <div className="border border-[#2a2a2a] bg-[#1a1a1a] flex flex-col h-full shadow-sm hover:shadow-lg transition-shadow hover:border-[#d4af37] group rounded-sm overflow-hidden">

      {/* Media Section */}
      {resolvedImage ? (
        <div className="relative aspect-[16/10] w-full bg-[#151515] overflow-hidden flex flex-col">
           <div className="relative flex-1">
             <img
               src={resolvedImage.src}
               alt={resolvedImage.alt}
               className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/80 to-transparent"></div>
           </div>
           {resolvedImage.attribution && (
             <div className="px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
               {product.representativeCaption && (
                 <p className="text-[10px] text-[#d4af37] mb-1">{product.representativeCaption}</p>
               )}
               <WikimediaImageCredit image={resolvedImage.attribution as any} />
             </div>
           )}
        </div>
      ) : (
        <div className="relative h-48 w-full bg-[#101010] flex flex-col items-center justify-center p-6 text-center border-b border-[#2a2a2a]">
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
           <div className="w-12 h-[1px] bg-[#d4af37] mb-4"></div>
           <span className="font-serif text-[#fdfbf7] text-xl tracking-wide leading-tight">{product.title}</span>
           <div className="w-12 h-[1px] bg-[#d4af37] mt-4"></div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 lg:p-8 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl text-[#fdfbf7] mb-3 group-hover:text-[#d4af37] transition-colors line-clamp-2">
          {product.title}
        </h3>

        {product.operatorAttribution && (
          <p className="text-[10px] font-bold text-[#aaaaaa] uppercase tracking-widest mb-2">
            Operated by {product.operatorAttribution}
          </p>
        )}

        {product.bestFor && (
          <p className="text-xs font-semibold text-[#d4af37] mb-4 bg-[#d4af37]/10 inline-block px-2 py-1 rounded-sm w-fit">
            Good fit: {product.bestFor.replace(/^Best for\s*/i, "")}
          </p>
        )}

        <p className="text-sm font-light text-[#aaaaaa] line-clamp-3 mb-6 leading-relaxed">
          {product.description || (product as any).experience?.summary}
        </p>

        <div className="mt-auto pt-6 border-t border-[#2a2a2a]">
          {cues.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2" aria-label="Tour details">
              {cues.map((cue) => (
                <span key={cue} className="border border-[#3a3a3a] px-2 py-1 text-[10px] uppercase tracking-wider text-[#c8c8c8]">
                  {cue}
                </span>
              ))}
            </div>
          )}
          {product.isBookable || product.ctaLabel ?
            <Link
              href={detailHref}

              className="block w-full text-center border border-[#d4af37] bg-transparent text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1a1a1a] transition-colors font-bold py-3.5 text-xs uppercase tracking-widest rounded-sm"
            >
              {product.ctaLabel || "View Details"}
            </Link>
            :
            <span className="block w-full py-3.5 border border-[#2a2a2a] text-[#aaaaaa] bg-[#101010] text-center rounded-sm text-xs font-bold uppercase tracking-widest cursor-not-allowed">
              Preview
            </span>
          }
        </div>
      </div>
    </div>
  );
}
