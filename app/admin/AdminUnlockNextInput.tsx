"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AdminUnlockNextInput({
  defaultNext = "/admin/inbox",
}: {
  defaultNext?: string;
}) {
  const pathname = usePathname();
  const initial =
    pathname &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/internal/dashboard"))
      ? pathname
      : defaultNext;
  const [nextPath, setNextPath] = useState(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const full = `${window.location.pathname}${window.location.search || ""}`;
    if (full.startsWith("/admin") || full.startsWith("/internal/dashboard")) {
      setNextPath(full);
    }
  }, [pathname]);

  return <input type="hidden" name="next" value={nextPath} />;
}
