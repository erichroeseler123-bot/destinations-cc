import React from "react";
import { PRODUCT_CLAIMS } from "../data/verifiedClaims";
import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { VerifiedBadge, generateBadgesFromClaims } from "./VerifiedBadge";
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
            <td className="p-4 border-b border-[#e5e5e5] font-semibold text-[#1a1a1a]">Verified Claims</td>
            {products.map(product => {
              const claims = PRODUCT_CLAIMS[product.slug];
              if (!claims) return <td key={product.slug} className="p-4 border-b border-[#e5e5e5]">-</td>;
              const badges = generateBadgesFromClaims(claims);
              return (
                <td key={product.slug} className="p-4 border-b border-[#e5e5e5]">
                  <div className="flex flex-wrap">
                    {badges.map(b => <VerifiedBadge key={b} label={b} />)}
                  </div>
                </td>
              );
            })}
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
