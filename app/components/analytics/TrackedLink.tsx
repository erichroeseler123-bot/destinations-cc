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

export function withTrackedLinkContext(event: EventDescriptor, href: string): EventDescriptor {
  const targetPath = typeof event.props.target_path === "string" ? event.props.target_path : href;
  const targetUrl = typeof event.props.target_url === "string" ? event.props.target_url : href;
  const eventHref = typeof event.props.href === "string" ? event.props.href : href;

  return {
    ...event,
    props: {
      ...event.props,
      target_path: targetPath,
      target_url: targetUrl,
      href: eventHref,
    },
  };
}

function emit(pathname: string, events: EventDescriptor[] | undefined, href: string) {
  if (!events?.length) return;
  for (const event of events) {
    const enrichedEvent = withTrackedLinkContext(event, href);
    trackEvent(enrichedEvent.name, {
      ...enrichedEvent.props,
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
    emit(pathname, shownEvents, href);
    shown.current = true;
  }, [href, pathname, shownEvents]);

  function handleClick() {
    emit(pathname, clickEvents, href);
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
