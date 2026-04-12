"use client";

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

type TrackedExternalAnchorProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  shownEvents?: EventDescriptor[];
  clickEvents?: EventDescriptor[];
  eventName?: string;
  eventProps: {
    surface: string;
    corridor?: string | null;
    [key: string]: unknown;
  };
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

export default function TrackedExternalAnchor({
  href,
  className,
  children,
  shownEvents,
  clickEvents,
  eventName = "excursion_click",
  eventProps,
  target = "_blank",
  rel = "noopener noreferrer sponsored nofollow",
}: TrackedExternalAnchorProps) {
  const pathname = usePathname() || "/";
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    emit(pathname, shownEvents);
    shown.current = true;
  }, [pathname, shownEvents]);

  function handleClick() {
    if (clickEvents?.length) {
      emit(pathname, clickEvents);
      return;
    }
    trackEvent(eventName, {
      ...eventProps,
      page: pathname,
    });
  }

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
