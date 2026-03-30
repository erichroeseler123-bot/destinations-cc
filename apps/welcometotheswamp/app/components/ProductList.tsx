"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { SwampProduct } from "@/lib/swampProducts";

function formatDuration(durationMinutes: number | null) {
  if (!Number.isFinite(durationMinutes) || durationMinutes === null || durationMinutes <= 0) return null;
  if (durationMinutes % 60 === 0) return `${durationMinutes / 60} hr`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (!hours) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
}

export default function ProductList({
  products,
  generatedAt,
}: {
  products: SwampProduct[];
  generatedAt: string;
}) {
  const updatedLabel = useMemo(() => {
    const parsed = new Date(generatedAt);
    if (Number.isNaN(parsed.getTime())) return "Live now";
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }, [generatedAt]);

  return (
    <>
      <div className="meta-row">
        <div className="last-updated">Last updated: {updatedLabel}</div>
        <button className="refresh-link" type="button" onClick={() => window.location.reload()}>
          Refresh products
        </button>
      </div>

      <div className="list">
        {products.length ? (
          products.map((product) => {
            const durationLabel = formatDuration(product.durationMinutes);
            return (
              <a key={product.id} href={product.bookHref} className="slot-card product-card">
                {product.imageUrl ? (
                  <div className="product-image-wrap">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : null}
                <div className="slot-head">
                  <div>
                    <div className="slot-time">Swamp tour</div>
                    <h3>{product.title}</h3>
                  </div>
                  {product.priceLabel ? <div className="seat-badge">{product.priceLabel}</div> : null}
                </div>
                {product.description ? <div className="slot-summary">{product.description}</div> : null}
                <div className="product-meta">
                  {durationLabel ? <span>{durationLabel}</span> : null}
                  {product.supplierName ? <span>{product.supplierName}</span> : null}
                </div>
                <div className="button product-cta">Open this tour</div>
              </a>
            );
          })
        ) : (
          <div className="slot-card">
            <h3>No swamp products are showing right now</h3>
            <div className="slot-summary">
              The current feed did not return matching swamp products at the moment. Refresh again or use the broader DCC comparison path.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
