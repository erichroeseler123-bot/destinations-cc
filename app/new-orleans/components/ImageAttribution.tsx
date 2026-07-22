import React from 'react';
import type { ImageAttribution as ImageAttributionType } from '../data/types';

export default function ImageAttribution({ image }: { image: ImageAttributionType }) {
  if (!image) return null;
  return (
    <div className="absolute bottom-2 right-2 bg-black/60 text-white/90 text-[10px] px-2 py-1 rounded">
      Image by <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{image.author}</a> ({image.license})
    </div>
  );
}
