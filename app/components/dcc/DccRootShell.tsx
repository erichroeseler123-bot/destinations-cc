"use client";

import React from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/app/components/dcc/SiteHeader";
import SiteBreadcrumbs from "@/app/components/dcc/SiteBreadcrumbs";
import SiteFooter from "@/app/components/dcc/SiteFooter";
import WhatsLiveFloatingButton from "@/app/components/dcc/next48/WhatsLiveFloatingButton";
import ConsentManagedAnalytics from "@/app/components/dcc/ConsentManagedAnalytics";

export default function DccRootShell({
  children,
  gaMeasurementId,
  gygPartnerId,
}: {
  children: React.ReactNode;
  gaMeasurementId: string;
  gygPartnerId?: string | null;
}) {
  const pathname = usePathname() || "/";
  const isHomepage = pathname === "/" || pathname === "/t/dcc";
  const isBareShell =
    pathname === "/new-orleans/tours" ||
    pathname.startsWith("/somerset-wi") ||
    pathname.startsWith("/juneau-flight-deck") ||
    pathname.startsWith("/wisconsin-dells-brand") ||
    pathname === "/helicopter" ||
    pathname === "/juneau/helicopter" ||
    pathname.startsWith("/embed") ||
    pathname.startsWith("/t/jfd") ||
    pathname.startsWith("/t/dells") ||
    pathname.startsWith("/t/somerset") ||
    pathname.startsWith("/t/wtonot") ||
    pathname.startsWith("/t/lfse");

  if (isBareShell) {
    return (
      <>
        <a href="#main-content" className="dcc-skip-link">
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
        {!pathname.startsWith("/embed") ? (
          <ConsentManagedAnalytics
            gaMeasurementId={gaMeasurementId}
            gygPartnerId={gygPartnerId ?? undefined}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <a href="#main-content" className="dcc-skip-link">
        Skip to main content
      </a>
      <SiteHeader />
      <div id="main-content" className="dcc-site-shell">
        <div className="dcc-site-shell__inner">
          {!isHomepage ? <SiteBreadcrumbs /> : null}
          {children}
        </div>
      </div>
      <WhatsLiveFloatingButton />
      <SiteFooter />
      <ConsentManagedAnalytics
        gaMeasurementId={gaMeasurementId}
        gygPartnerId={gygPartnerId ?? undefined}
      />
    </>
  );
}
