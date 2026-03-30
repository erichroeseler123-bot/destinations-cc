"use client";

import { useEffect } from "react";
import {
  trackRedRocksCtaVisible,
  trackRedRocksScrollDepth,
} from "@/lib/dcc/redRocksFunnelAnalytics";

const DEPTH_THRESHOLDS = [25, 50, 75, 90] as const;

type RedRocksFunnelTelemetryProps = {
  page: string;
};

export default function RedRocksFunnelTelemetry({ page }: RedRocksFunnelTelemetryProps) {
  useEffect(() => {
    const sentDepths = new Set<number>();

    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const viewportHeight = window.innerHeight || 0;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const maxScrollable = Math.max(docHeight - viewportHeight, 1);
      const depth = Math.round(((scrollTop + viewportHeight) / maxScrollable) * 100);

      for (const threshold of DEPTH_THRESHOLDS) {
        if (depth >= threshold && !sentDepths.has(threshold)) {
          sentDepths.add(threshold);
          trackRedRocksScrollDepth(page, threshold);
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [page]);

  useEffect(() => {
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const cta = entry.target.getAttribute("data-red-rocks-cta");
          const destinationUrl = entry.target.getAttribute("data-red-rocks-destination");

          if (!cta || !destinationUrl) {
            continue;
          }

          const key = `${cta}:${destinationUrl}`;
          if (seen.has(key)) {
            continue;
          }

          seen.add(key);
          trackRedRocksCtaVisible(page, cta, destinationUrl);
        }
      },
      { threshold: 0.6 }
    );

    const elements = Array.from(document.querySelectorAll("[data-red-rocks-cta]"));
    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [page]);

  return null;
}
