"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

type TrackOnMountProps = {
  name: string;
  props: {
    surface: string;
    corridor?: string | null;
    [key: string]: unknown;
  };
};

export default function TrackOnMount({ name, props }: TrackOnMountProps) {
  const pathname = usePathname() || "/";
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    trackEvent(name, {
      ...props,
      page: pathname,
    });
    tracked.current = true;
  }, [name, pathname, props]);

  return null;
}
