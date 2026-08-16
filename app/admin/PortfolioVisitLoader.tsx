"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SinceLastVisit from "./portfolio/SinceLastVisit";

type Payload = {
  ok: boolean;
  events: Array<{ occurredAt: string; site: string; eventName: string }>;
  snapshot: {
    trackedHandoffs: number;
    completedHandoffs: number;
    grossRevenue: number;
    attention: number;
    wnoFareHarborOpens: number;
    cruisePlannerSaves: number;
    cruisePlannerShares: number;
  };
};

export default function PortfolioVisitLoader() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    if (pathname !== "/admin/portfolio") return;
    let cancelled = false;
    fetch("/admin/portfolio/data", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<Payload>;
      })
      .then((data) => {
        if (!cancelled && data?.ok) setPayload(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (pathname !== "/admin/portfolio" || !payload) return null;
  return (
    <div className="mx-auto max-w-7xl px-6">
      <SinceLastVisit events={payload.events} snapshot={payload.snapshot} />
    </div>
  );
}
