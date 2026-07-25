import React from 'react';
import type { WikimediaImage } from '../data/wikimedia';

export default function WikimediaImageCredit({ image }: { image: WikimediaImage }) {
  return (
    <div className="text-xs text-[#aaaaaa] mt-2 italic font-light">
      Photo: {image.attributionText}, via <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#fdfbf7] transition-colors">Wikimedia Commons</a>,{' '}
      <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#fdfbf7] transition-colors">{image.license}</a>.
      {image.changesMade && ` ${image.changesMade}`}
    </div>
  );
}
