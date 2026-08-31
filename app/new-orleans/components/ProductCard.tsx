import React from 'react';
import Link from 'next/link';
import { ProductCardProps } from '../data/types';
import { STOREFRONT_PRODUCTS } from '../tours/pageConfig';
import WikimediaImageCredit from './WikimediaImageCredit';
import visualStyles from './newOrleansVisual.module.css';
import { resolveProductImage } from '../lib/imageResolver';
import { optimizedProductImageUrl } from '../lib/optimizedProductImage';
import {
  buildAttributedTourHref,
  FAREHARBOR_SOURCES,
  isApprovedProductSlug,
  type FareHarborSource,
} from '../lib/fareHarborAttribution';

type AttributedProductCardProps = ProductCardProps & {
  attributionSource?: FareHarborSource;
};

function discoveryDescription(description: string | undefined, operatorName: string | undefined, showOperator: boolean) {
  if (!description || !operatorName || showOperator) return description;
  return description
    .replace(` offered through ${operatorName}.`, '.')
    .replace(` operated by ${operatorName}.`, '.')
    .replace(` offered through ${operatorName}`, '')
    .replace(` operated by ${operatorName}`, '')
    .replace(/\.\./g, '.')
    .trim();
}

export default function ProductCard({
  product,
  attributionSource = FAREHARBOR_SOURCES.guide,
}: AttributedProductCardProps) {
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
  const description = discoveryDescription(
    product.description || (product as any).experience?.summary,
    sourceProduct?.operatorName,
    Boolean(product.operatorAttribution),
  );

  return (
    <div className={`${visualStyles.productCard} group`}>
      {resolvedImage ? (
        <div className={visualStyles.productCardMedia}>
          <div className="relative flex-1 min-h-0">
            <img
              src={optimizedProductImageUrl(resolvedImage.src)}
              alt={resolvedImage.alt}
              loading="lazy"
              decoding="async"
              width={828}
              height={518}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className={visualStyles.productCardImageShade}></div>
          </div>
          {resolvedImage.attribution && (
            <div className={visualStyles.productCardCredit}>
              {product.representativeCaption && (
                <p className="text-[10px] text-[#d4af37] mb-1">{product.representativeCaption}</p>
              )}
              <WikimediaImageCredit image={resolvedImage.attribution as any} />
            </div>
          )}
        </div>
      ) : (
        <div className={visualStyles.productCardFallback}>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          <div className="w-12 h-[1px] bg-[#d4af37] mb-4"></div>
          <span className="font-serif text-[#fdfbf7] text-xl tracking-wide leading-tight">{product.title}</span>
          <div className="w-12 h-[1px] bg-[#d4af37] mt-4"></div>
        </div>
      )}

      <div className={visualStyles.productCardContent}>
        <h3 className={visualStyles.productCardTitle}>{product.title}</h3>

        {product.operatorAttribution && (
          <p className={visualStyles.productCardOperator}>
            Operated by {product.operatorAttribution}
          </p>
        )}

        {product.bestFor && (
          <p className={visualStyles.productCardFit}>
            Good fit: {product.bestFor.replace(/^Best for\s*/i, "")}
          </p>
        )}

        <p className={visualStyles.productCardDescription}>
          {description}
        </p>

        <div className={visualStyles.productCardFooter}>
          {cues.length > 0 && (
            <div className={visualStyles.productCardCues} aria-label="Tour details">
              {cues.map((cue, index) => (
                <React.Fragment key={`${cue}-${index}`}>
                  <span className={visualStyles.productCardCue}>{cue}</span>
                  {index < cues.length - 1 ? <span aria-hidden="true"> · </span> : null}
                </React.Fragment>
              ))}
            </div>
          )}
          {product.isBookable || product.ctaLabel ? (
            <Link href={detailHref} className={visualStyles.productCardCta}>
              {product.ctaLabel || "View Details"}
            </Link>
          ) : (
            <span className={visualStyles.productCardPreview}>Preview</span>
          )}
        </div>
      </div>
    </div>
  );
}
