"use client";

import { useEffect } from "react";
import type { WarmTransferPacket } from "@/lib/warmTransfer";
import { trackWarmTransferEvent } from "@/lib/warmTransferAnalytics";

type Props = {
  packet: WarmTransferPacket;
  lane: string | null;
};

export default function WarmTransferTelemetry({ packet, lane }: Props) {
  useEffect(() => {
    trackWarmTransferEvent({
      eventType: "plan_viewed",
      pagePath: "/plan",
      intent: packet.intent,
      topic: packet.topic,
      subtype: packet.subtype,
      context: packet.context,
      source: packet.source,
      sourcePage: packet.sourcePage,
      lane,
    });
  }, [lane, packet.context, packet.intent, packet.source, packet.sourcePage, packet.subtype, packet.topic]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLElement>("[data-warm-transfer-click]");
      if (!link) return;
      const targetId = link.getAttribute("data-warm-transfer-click") || undefined;
      const targetHref = link.getAttribute("href") || undefined;
      trackWarmTransferEvent({
        eventType: "plan_click",
        pagePath: "/plan",
        intent: packet.intent,
        topic: packet.topic,
        subtype: packet.subtype,
        context: packet.context,
        source: packet.source,
        sourcePage: packet.sourcePage,
        targetId,
        targetHref,
        lane,
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [lane, packet.context, packet.intent, packet.source, packet.sourcePage, packet.subtype, packet.topic]);

  return null;
}
