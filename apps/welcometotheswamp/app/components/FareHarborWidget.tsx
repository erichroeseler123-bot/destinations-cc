import React from "react";
import { SITE_CONFIG } from "../site-config";

interface FareHarborWidgetProps {
  companyShortname?: string;
  itemId?: string | number;
  flowId?: string | number;
  layout?: "calendar" | "grid";
  refCode?: string;
  campaign?: string;
  className?: string;
}

export default function FareHarborWidget({
  companyShortname,
  itemId,
  flowId,
  layout = "calendar",
  refCode,
  campaign,
  className,
}: FareHarborWidgetProps) {
  // If the companyShortname is missing, show the dev-only message
  if (!companyShortname) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div
          style={{
            border: "1px dashed rgba(239, 68, 68, 0.4)",
            padding: "1.25rem",
            borderRadius: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.05)",
            color: "#f87171",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: "0.85rem",
            margin: "1rem 0",
            textAlign: "center",
          }}
          className={className}
        >
          <strong>[Dev Only] Booking Setup Pending:</strong> FareHarbor company shortname is not configured. 
        </div>
      );
    }
    return null;
  }

  // Build the FareHarbor embed URL
  const baseUrl = `https://fareharbor.com/embeds/${layout}/${encodeURIComponent(companyShortname)}/`;
  const itemPath = itemId ? `items/${encodeURIComponent(String(itemId))}/` : "";
  const embedUrl = new URL(`${baseUrl}${itemPath}`);

  // Set parameters
  embedUrl.searchParams.set("full-items", "yes");
  if (flowId) {
    embedUrl.searchParams.set("flow", String(flowId));
  }

  // Set ASN for affiliate commission tracking
  const asn = refCode || SITE_CONFIG.fareharborSwampAsn || "aktourcenter";
  if (asn) {
    embedUrl.searchParams.set("asn", asn);
  }

  // Set ref for campaign / source tracking
  if (campaign) {
    embedUrl.searchParams.set("ref", campaign);
  }

  return (
    <div className={`fh-container ${className || ""}`} style={{ width: "100%", overflow: "hidden" }}>
      <iframe
        src={embedUrl.toString()}
        width="100%"
        height="600"
        frameBorder="0"
        style={{ border: "none", borderRadius: "12px", background: "transparent" }}
        title={`FareHarbor ${layout} booking widget`}
      />
    </div>
  );
}
