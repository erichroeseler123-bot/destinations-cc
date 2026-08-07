import React from "react";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import Link from "next/link";

export default function ComparisonMatrix({ slugs }: { slugs: string[] }) {
  const products = slugs.map(slug => STOREFRONT_PRODUCTS.find(p => p.slug === slug)).filter(Boolean) as typeof STOREFRONT_PRODUCTS;

  return (
    <div className="overflow-x-auto my-8">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="p-4 border-b-2 border-[#1a1a1a] bg-[#f5f5f5] w-1/3">Features</th>
            {products.map(product => (
              <th key={product.slug} className="p-4 border-b-2 border-[#1a1a1a] bg-[#f5f5f5]">
                <div className="font-[var(--font-heading)] text-lg">{product.title}</div>
                <div className="text-sm font-normal text-[#4a4a4a] mb-2">Operated by {product.operatorName}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-4 border-b border-[#e5e5e5] font-semibold text-[#1a1a1a]">Best For</td>
            {products.map(product => (
              <td key={product.slug} className="p-4 border-b border-[#e5e5e5]">{product.bestFor}</td>
            ))}
          </tr>
          <tr>
            <td className="p-4 border-b border-[#e5e5e5] font-semibold text-[#1a1a1a]">Useful Details</td>
            {products.map(product => (
              <td key={product.slug} className="p-4 border-b border-[#e5e5e5] text-sm">
                {[product.durationLabel, product.transportationSummary || product.pickupSummary, product.physicalFormat?.walking]
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(" • ") || "See full details"}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 border-b border-[#e5e5e5] font-semibold text-[#1a1a1a]">Description</td>
            {products.map(product => (
              <td key={product.slug} className="p-4 border-b border-[#e5e5e5] text-sm">{product.description}</td>
            ))}
          </tr>
          <tr>
            <td className="p-4 border-b border-[#e5e5e5]"></td>
            {products.map(product => (
              <td key={product.slug} className="p-4 border-b border-[#e5e5e5]">
                <Link href={`/tours/${product.slug}`} className="text-[#0066cc] hover:underline font-semibold">
                  View Full Details →
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
