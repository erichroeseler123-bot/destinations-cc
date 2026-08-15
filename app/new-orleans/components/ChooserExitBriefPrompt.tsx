"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import DailyBriefSignup from "./DailyBriefSignup";

const SEEN_KEY = "wno_chooser_exit_brief_seen";

export default function ChooserExitBriefPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let armed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      // The prompt can still work when storage is unavailable.
    }

    timer = setTimeout(() => {
      armed = true;
    }, 15000);

    const onMouseOut = (event: MouseEvent) => {
      if (!armed || event.relatedTarget || event.clientY > 6) return;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Do not block the prompt on storage failures.
      }
      setOpen(true);
      trackEvent("daily_brief_exit_prompt_shown", { surface: "wno_help_me_choose" });
      armed = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Get today's New Orleans picks by email">
      <div className="relative w-full max-w-3xl overflow-hidden border border-[#d4af37]/55 bg-[#171219] shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            trackEvent("daily_brief_exit_prompt_dismissed", { surface: "wno_help_me_choose" });
          }}
          className="absolute right-3 top-3 z-10 border border-white/20 bg-black/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:border-[#d4af37] hover:text-[#d4af37]"
          aria-label="Close email prompt"
        >
          Close
        </button>
        <DailyBriefSignup source="chooser-exit" />
      </div>
    </div>
  );
}
