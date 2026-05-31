"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackWesternWisconsinClick } from "@/app/components/dcc/WesternWisconsinTelemetry";

export default function WesternWisconsinTrackedLink({
  href,
  sourcePage,
  action,
  fitSignal,
  metadata,
  className,
  children,
}: {
  href: string;
  sourcePage: string;
  action: string;
  fitSignal?: string;
  metadata?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackWesternWisconsinClick({
          sourcePage,
          targetPath: href,
          action,
          fitSignal,
          metadata,
        })
      }
    >
      {children}
    </Link>
  );
}
