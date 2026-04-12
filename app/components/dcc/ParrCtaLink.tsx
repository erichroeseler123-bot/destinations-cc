"use client";

import type { ReactNode } from "react";
import { trackRedRocksParrClick } from "@/lib/dcc/redRocksFunnelAnalytics";
import {
  trackMappedDestinationClick,
  type MappingTelemetryMeta,
} from "@/lib/dcc/mapping/analytics";

type ParrCtaLinkProps = {
  href: string;
  page: string;
  cta: string;
  className: string;
  children: ReactNode;
  mapperMeta?: MappingTelemetryMeta;
};

export default function ParrCtaLink({
  href,
  page,
  cta,
  className,
  children,
  mapperMeta,
}: ParrCtaLinkProps) {
  return (
    <a
      href={href}
      className={className}
      data-red-rocks-cta={cta}
      data-red-rocks-page={page}
      data-red-rocks-destination={href}
      data-dcc-mapper-route-key={mapperMeta?.routeKey || ""}
      data-dcc-mapper-provider={mapperMeta?.provider || ""}
      data-dcc-mapper-target-kind={mapperMeta?.targetKind || ""}
      data-dcc-mapper-operator-id={mapperMeta?.operatorId || ""}
      onClick={() => {
        trackRedRocksParrClick(page, cta, href);
        if (mapperMeta) {
          trackMappedDestinationClick(page, cta, href, mapperMeta);
        }
      }}
    >
      {children}
    </a>
  );
}
