"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

type EventDescriptor = {
  name: string;
  props: {
    surface: string;
    corridor?: string | null;
    [key: string]: unknown;
  };
};

type TrackedLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  shownEvents?: EventDescriptor[];
  clickEvents?: EventDescriptor[];
  target?: string;
  rel?: string;
};

function emit(pathname: string, events?: EventDescriptor[]) {
  if (!events?.length) return;
  for (const event of events) {
    trackEvent(event.name, {
      ...event.props,
      page: pathname,
    });
  }
}

export default function TrackedLink({
  href,
  className,
  children,
  shownEvents,
  clickEvents,
  target,
  rel,
}: TrackedLinkProps) {
  const pathname = usePathname() || "/";
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    emit(pathname, shownEvents);
    shown.current = true;
  }, [pathname, shownEvents]);

  function handleClick() {
    emit(pathname, clickEvents);
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={handleClick} target={target} rel={rel}>
      {children}
    </a>
  );
}
