"use client";

import React, { useEffect } from "react";
import { SEAK_FISHING_LODGES_PATH } from "@/lib/fishingLodgesConfig";
import { trackFishingLodgeDirectoryEvent } from "@/lib/fishingLodgesTelemetry";

interface PrintFactSheetButtonProps {
  lodgeSlug: string;
}

export function PrintFactSheetButton({ lodgeSlug }: PrintFactSheetButtonProps) {
  const pagePath = `${SEAK_FISHING_LODGES_PATH}/${lodgeSlug}`;

  useEffect(() => {
    trackFishingLodgeDirectoryEvent({
      event: "lfse_lodge_page_view",
      pagePath,
      lodgeSlug,
    });
  }, [lodgeSlug, pagePath]);

  function handlePrint() {
    trackFishingLodgeDirectoryEvent({
      event: "lfse_lodge_printable_compare_used",
      pagePath,
      action: "print_individual_fact_sheet",
      lodgeSlug,
    });
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="button secondary"
      style={{ cursor: "pointer" }}
      data-testid="print-fact-sheet-btn"
    >
      Print / Save Page
    </button>
  );
}
