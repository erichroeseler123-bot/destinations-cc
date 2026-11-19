"use client";

import React from "react";
import { trackFishingLodgeDirectoryEvent } from "@/lib/fishingLodgesTelemetry";

interface PrintFactSheetButtonProps {
  lodgeSlug: string;
}

export function PrintFactSheetButton({ lodgeSlug }: PrintFactSheetButtonProps) {
  function handlePrint() {
    trackFishingLodgeDirectoryEvent({
      event: "lfse_lodge_printable_compare_used",
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
      Print / Save Fact Sheet
    </button>
  );
}
