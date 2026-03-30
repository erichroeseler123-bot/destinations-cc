"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Next48Drawer from "@/app/components/dcc/next48/Next48Drawer";
import { NEXT48_SUPPORTED } from "@/lib/dcc/next48/supported";
import type { Next48EntityType } from "@/lib/dcc/next48/types";

type NearbyPoint = {
  class: "place" | "port";
  slug: string;
  distance_km: number;
};

type NearbyResponse = {
  pois: NearbyPoint[];
  transport: NearbyPoint[];
};

type ResolvedTarget = {
  entityType: Next48EntityType;
  slug: string;
};

function inferEntityType(point: NearbyPoint): Next48EntityType | null {
  if (point.class === "port") return "port";
  return "city";
}

function resolveSupportedTarget(payload: NearbyResponse): ResolvedTarget | null {
  const ranked = [...payload.pois, ...payload.transport].sort(
    (a, b) => a.distance_km - b.distance_km || a.slug.localeCompare(b.slug)
  );

  for (const point of ranked) {
    const entityType = inferEntityType(point);
    if (!entityType) continue;
    const supported = NEXT48_SUPPORTED.find(
      (item) => item.entityType === entityType && item.slug === point.slug
    );
    if (supported) return supported;
  }

  return null;
}

export default function WhatsLiveFloatingButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [session, setSession] = useState(0);
  const [target, setTarget] = useState<ResolvedTarget | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(id);
  }, [message]);

  const hidden = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/book")
    );
  }, [pathname]);

  if (hidden) return null;

  async function handleClick() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setMessage("Location is not available in this browser.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 120000,
        });
      });

      const params = new URLSearchParams({
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
        radius_km: "75",
        limit: "20",
      });
      const response = await fetch(`/api/internal/nearby?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`nearby_lookup_failed:${response.status}`);
      }

      const payload = (await response.json()) as NearbyResponse;
      const resolved = resolveSupportedTarget(payload);
      if (!resolved) {
        setMessage("What’s Live is not rolled out for this area yet.");
        return;
      }

      setTarget(resolved);
      setSession((value) => value + 1);
      setOpen(true);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as GeolocationPositionError).code === 1
      ) {
        return;
      }
      setMessage("Could not find a nearby live feed right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="fixed bottom-4 right-4 z-40 rounded-full border border-cyan-300/40 bg-zinc-900/95 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-[0_10px_30px_rgba(0,0,0,0.45)] disabled:opacity-70"
        >
          {loading ? "Finding Live Now..." : "What’s Live?"}
        </button>
        {message ? (
          <div className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl border border-white/10 bg-zinc-950/95 px-4 py-3 text-sm text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            {message}
          </div>
        ) : null}
      </div>
      {target ? (
        <Next48Drawer
          key={`${target.entityType}:${target.slug}:${session}`}
          open={open}
          onClose={() => setOpen(false)}
          entityType={target.entityType}
          slug={target.slug}
        />
      ) : null}
    </>
  );
}
