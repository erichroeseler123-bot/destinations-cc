import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildWnoBreadcrumbJsonLd, type WnoBreadcrumbItem } from "../lib/structuredData";

export default function WnoBreadcrumbs({ items }: { items: WnoBreadcrumbItem[] }) {
  if (items.length < 2) return null;

  return (
    <>
      <JsonLd data={buildWnoBreadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="mx-auto w-full max-w-6xl px-6 pt-5 text-xs text-[#aaa]">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.path}-${item.name}`} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true" className="text-[#666]">/</span> : null}
                {isLast ? (
                  <span aria-current="page" className="text-[#d4af37]">{item.name}</span>
                ) : (
                  <Link href={item.path} className="hover:text-white hover:underline hover:underline-offset-4">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
