"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { WIKIMEDIA_IMAGES } from "../../data/wikimedia";
import { PRODUCT_IMAGES } from "../../data/imageRegistry";
import { resolveProductImage } from "../../lib/imageResolver";

interface RelatedTourLinkProps {
  currentProductId: string;
  relatedProduct: any; // using any for simplicity since we just read standard fields
}

export default function RelatedTourLink({ currentProductId, relatedProduct }: RelatedTourLinkProps) {
  const handleClick = () => {
    trackEvent("tour_detail_related_product_selected", {
      surface: "new_orleans_tour_detail",
      product_id: currentProductId,
      related_product_id: relatedProduct.id,
      operator_id: relatedProduct.companyShortname
    });
  };

  const resolvedImage = resolveProductImage(relatedProduct);

  return (
    <Link href={`/tours/${relatedProduct.slug}`} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]" onClick={handleClick}>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden hover:border-[#d4af37] transition-colors flex flex-col md:flex-row shadow-lg">
        <div className="md:w-2/5 aspect-[16/9] md:aspect-auto relative overflow-hidden bg-[#151515]">
          {!resolvedImage ? (
            <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center p-8 group-hover:bg-[#2a2a2a] transition-colors duration-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.05] via-transparent to-black/[0.3]"></div>
              <div className="absolute inset-4 border border-[#d4af37]/10"></div>
              <span className="relative z-10 text-[11px] font-bold text-[#d4af37] uppercase tracking-[0.3em] text-center">{relatedProduct.category || "Tour"}</span>
            </div>
          ) : (
            <img
              src={resolvedImage.src}
              alt={resolvedImage.alt}
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
            />
          )}
        </div>
        <div className="p-8 md:w-3/5 flex flex-col justify-center">
          <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mb-2">
            Operated by {relatedProduct.operatorName}
          </p>
          <h4 className="text-2xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-4 group-hover:text-[#d4af37] transition-colors">
            {relatedProduct.title}
          </h4>
          <p className="text-sm text-[#aaaaaa] leading-relaxed line-clamp-2 mb-6">
            {relatedProduct.detailSummary || relatedProduct.description}
          </p>
          <div>
            <span className="inline-block border-b-2 border-[#fdfbf7] text-[#fdfbf7] font-bold pb-1 text-xs uppercase tracking-widest group-hover:text-[#d4af37] group-hover:border-[#d4af37] transition-colors">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
