import React from 'react';
import type { ImageAttribution as RegistryImageAttribution } from '../data/imageRegistry';
import { PRODUCT_IMAGES } from '../data/imageRegistry';

interface ImageAttributionProps {
  imageId: string;
  className?: string;
}

export default function ImageAttribution({ imageId, className = "" }: ImageAttributionProps) {
  const image = PRODUCT_IMAGES[imageId];
  if (!image || !image.verifiedRights) return null;

  if (image.source === "Wikimedia Commons") {
    return (
      <div className={`absolute bottom-2 right-2 bg-black/60 text-white/90 text-[10px] px-2 py-1 rounded ${className}`}>
        Image by <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{image.author}</a> 
        {image.licenseUrl ? (
          <> (<a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{image.license}</a>)</>
        ) : (
          <> ({image.license})</>
        )}
      </div>
    );
  }

  // Operator image
  return (
    <div className="absolute bottom-2 right-2 bg-black/60 text-white/90 text-[10px] px-2 py-1 rounded">
      Image provided by {image.author}
    </div>
  );
}
