import Script from "next/script";

import { getGetYourGuidePublicConfig } from "@/lib/getyourguide/config";

export default function PartnerAnalyticsScript() {
  const { partnerId } = getGetYourGuidePublicConfig();

  if (!partnerId) return null;

  return (
    <Script
      id="getyourguide-partner-analytics"
      src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
      strategy="afterInteractive"
      async
      defer
      data-gyg-partner-id={partnerId}
    />
  );
}
