'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LiveProductAdapter } from '../data/index';
import styles from '../tours/outpost.module.css';
import { PROVIDERS } from '../data/index';
import Image from 'next/image';

interface TourSliderProps {
  products: LiveProductAdapter[];
  basePath: string;
}

export default function TourSlider({ products, basePath }: TourSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const scrollLeft = () => {
    if (containerRef.current) {
      const cardWidth = containerRef.current.firstElementChild?.clientWidth || 300;
      containerRef.current.scrollBy({ left: -cardWidth - 16, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      const cardWidth = containerRef.current.firstElementChild?.clientWidth || 300;
      containerRef.current.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-end mb-8">
        <h2 className={`text-4xl md:text-5xl font-serif font-bold ${styles.nolaBrass}`}>
          Featured Experiences
        </h2>
        <div className="hidden md:flex gap-4">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`${styles.sliderNavBtn} ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Scroll left"
          >
            &larr;
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`${styles.sliderNavBtn} ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Scroll right"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={styles.sliderContainer}
        onScroll={checkScroll}
      >
        {products.map((product) => {
          const provider = product.providerId ? PROVIDERS[product.providerId]?.publicAttributionName : undefined;

          // Image-led for specific ones based on previous data
          const isImageLed = product.id === 'southernstyle-city-tour' || product.id === 'ragincajun-covered-boat' || product.id === 'ragincajun-airboat';

          return (
            <Link
              key={product.id}
              href={`/tours/${product.slug}`}
              className={`${styles.sliderCard} group flex flex-col bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden hover:border-[#d4af37] transition-colors`}
            >
              {isImageLed ? (
                <div className="relative w-full h-64 overflow-hidden bg-[#0a0a0a]">
                  <Image
                    src={product.imageUrl || ''}
                    alt={product.title}
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-bold font-sans uppercase tracking-[0.2em] text-[#d4af37]">
                      {product.categoryIds?.[0]?.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-64 bg-[#2a2a2a] flex flex-col justify-end p-6 border-b border-[#1a1a1a]">
                  <span className="text-[10px] font-bold font-sans uppercase tracking-[0.2em] text-[#d4af37]">
                    {product.categoryIds?.[0]?.replace('-', ' ')}
                  </span>
                  <h3 className="text-2xl font-serif text-[#fdfbf7] mt-2 line-clamp-2">
                    {product.title}
                  </h3>
                </div>
              )}

              <div className="p-6 flex flex-col flex-grow">
                {isImageLed && (
                  <h3 className="text-2xl font-serif text-[#fdfbf7] mb-3 group-hover:text-[#d4af37] transition-colors line-clamp-2">
                    {product.title}
                  </h3>
                )}
                <p className="text-sm font-sans font-light text-[#fdfbf7]/70 line-clamp-3 mb-6">
                  {product.description}
                </p>
                <div className="mt-auto pt-4 border-t border-[#2a2a2a] flex justify-between items-center">
                  <span className="text-xs font-sans font-light text-[#fdfbf7]/50">
                    By {provider || 'Local Operator'}
                  </span>
                  <span className="text-[#d4af37] font-bold group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
