"use client";

import type { ReactNode } from "react";
import { trackRedRocksParrClick } from "@/lib/dcc/redRocksFunnelAnalytics";

type ParrCtaLinkProps = {
  href: string;
  page: string;
  cta: string;
  className: string;
  children: ReactNode;
};

export default function ParrCtaLink({
  href,
  page,
  cta,
  className,
  children,
}: ParrCtaLinkProps) {
  return (
    <a
      href={href}
      className={className}
      data-red-rocks-cta={cta}
      data-red-rocks-destination={href}
      onClick={() => {
        trackRedRocksParrClick(page, cta, href);
      }}
    >
      {children}
    </a>
  );
}
