import type { ReactNode } from "react";
import Link from "next/link";
import type { CtaConfig } from "./types";

type NetworkLinkProps = {
  cta: CtaConfig;
  className: string;
  children?: ReactNode;
};

export function NetworkLink({ cta, className, children }: NetworkLinkProps) {
  const label = children || cta.label;

  if (cta.external) {
    return (
      <a
        href={cta.href}
        className={className}
        aria-label={cta.ariaLabel}
        rel="sponsored noopener noreferrer"
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={cta.href} className={className} aria-label={cta.ariaLabel}>
      {label}
    </Link>
  );
}
