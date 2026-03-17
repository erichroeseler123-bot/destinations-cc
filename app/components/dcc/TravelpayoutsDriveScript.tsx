"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

import { shouldLoadTravelpayoutsDriveForPath } from "@/lib/travelpayouts/policy";

type TravelpayoutsDriveScriptProps = {
  enabled: boolean;
  src: string;
  allowedPrefixes: string[];
  blockedPrefixes: string[];
};

export default function TravelpayoutsDriveScript({
  enabled,
  src,
  allowedPrefixes,
  blockedPrefixes,
}: TravelpayoutsDriveScriptProps) {
  const pathname = usePathname() || "/";
  const shouldLoad = shouldLoadTravelpayoutsDriveForPath(pathname, {
    enabled,
    src,
    allowedPrefixes,
    blockedPrefixes,
  });

  if (!shouldLoad) return null;

  return (
    <Script
      id="travelpayouts-drive"
      src={src}
      strategy="afterInteractive"
      data-noptimize="1"
      data-cfasync="false"
      data-wpfc-render="false"
    />
  );
}
