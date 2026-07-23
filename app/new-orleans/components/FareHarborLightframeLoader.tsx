"use client";

import Script from "next/script";

export default function FareHarborLightframeLoader() {
  return (
    <Script
      id="fareharbor-lightframe-script"
      src="https://fareharbor.com/embeds/api/v1/"
      strategy="afterInteractive"
    />
  );
}
