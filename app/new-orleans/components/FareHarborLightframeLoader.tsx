"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function FareHarborLightframeLoader() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    if (typeof window !== "undefined" && window.FH) {
      setShouldLoad(true);
      return;
    }

    const triggerLoad = () => {
      setShouldLoad(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("scroll", triggerLoad);
      window.removeEventListener("pointerdown", triggerLoad);
      window.removeEventListener("touchstart", triggerLoad);
      window.removeEventListener("keydown", triggerLoad);
      window.removeEventListener("wno:load-fareharbor", triggerLoad);
    };

    window.addEventListener("scroll", triggerLoad, { passive: true, once: true });
    window.addEventListener("pointerdown", triggerLoad, { passive: true, once: true });
    window.addEventListener("touchstart", triggerLoad, { passive: true, once: true });
    window.addEventListener("keydown", triggerLoad, { passive: true, once: true });
    window.addEventListener("wno:load-fareharbor", triggerLoad, { once: true });

    return cleanup;
  }, [shouldLoad]);

  if (!shouldLoad) return null;

  return (
    <Script
      id="fareharbor-lightframe-script"
      src="https://fareharbor.com/embeds/api/v1/"
      strategy="lazyOnload"
    />
  );
}
