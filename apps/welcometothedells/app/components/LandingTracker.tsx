"use client";

import { useEffect } from "react";
import { trackDellsLanding } from "@/lib/telemetry";

export function LandingTracker({ source }: { source: string }) {
  useEffect(() => {
    trackDellsLanding(source);
  }, [source]);

  return null;
}
