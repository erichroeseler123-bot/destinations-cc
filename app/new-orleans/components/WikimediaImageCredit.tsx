import React from 'react';
import type { ResolvedAttribution } from '../lib/imageResolver';

export default function WikimediaImageCredit({ image }: { image: ResolvedAttribution }) {
  return (
    <div className="text-xs text-[#aaaaaa] mt-2 italic font-light">
      Photo: {image.creator}, via{" "}
      {image.sourceUrl ? (
        <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#fdfbf7] transition-colors">Wikimedia Commons</a>
      ) : (
        <span>Wikimedia Commons</span>
      )}
      ,{" "}
      {image.licenseUrl ? (
        <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#fdfbf7] transition-colors">{image.license}</a>
      ) : (
        <span className="text-[#aaaaaa]">{image.license}</span>
      )}.
    </div>
  );
}
