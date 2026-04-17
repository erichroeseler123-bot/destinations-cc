"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { trackWidgetEvent, type DecisionWidget } from "../../lib/telemetry";

export default function DecisionWidgetCard({
  widget,
  pageType,
  sourcePage,
  onActionClick,
  showImage = true,
}: {
  widget: DecisionWidget;
  pageType: string;
  sourcePage: string;
  onActionClick?: () => void;
  showImage?: boolean;
}) {
  const impressionTrackedRef = useRef(false);
  const actionTakenRef = useRef(false);

  useEffect(() => {
    if (impressionTrackedRef.current) return;
    impressionTrackedRef.current = true;
    trackWidgetEvent("widget_impression", {
      widget_id: widget.id,
      product_id: widget.productId,
      variant: widget.variant,
      intent: widget.intent,
      corridor: widget.corridor,
      page_type: pageType,
      source_page: sourcePage,
      recommendation_label: widget.recommendationLabel,
      position: widget.position,
      action: widget.action,
    });
  }, [pageType, sourcePage, widget]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (actionTakenRef.current) return;
      trackWidgetEvent("widget_abandon", {
        widget_id: widget.id,
        product_id: widget.productId,
        variant: widget.variant,
        intent: widget.intent,
        corridor: widget.corridor,
        page_type: pageType,
        source_page: sourcePage,
        recommendation_label: widget.recommendationLabel,
        position: widget.position,
        action: widget.action,
      });
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [pageType, sourcePage, widget]);

  const clickEventName =
    widget.action === "detail_page"
      ? "widget_open_detail"
      : widget.action === "inline_selector"
        ? "widget_open_selector"
        : widget.action === "add_to_cart"
          ? "widget_add_to_cart"
          : "widget_click";

  function handleClick() {
    actionTakenRef.current = true;
    onActionClick?.();

    const basePayload = {
      widget_id: widget.id,
      product_id: widget.productId,
      variant: widget.variant,
      intent: widget.intent,
      corridor: widget.corridor,
      page_type: pageType,
      source_page: sourcePage,
      recommendation_label: widget.recommendationLabel,
      position: widget.position,
      action: widget.action,
      destination: widget.href,
    };

    if (widget.variant !== "primary") {
      trackWidgetEvent("widget_fallback_click", basePayload);
    }

    trackWidgetEvent(clickEventName, basePayload);
  }

  return (
    <article className={`decision-widget decision-widget--${widget.variant}`}>
      {showImage && widget.imageUrl ? (
        <div className="decision-widget__image-wrap">
          <Image
            src={widget.imageUrl}
            alt={widget.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      ) : null}

      <div className="decision-widget__label">{widget.recommendationLabel}</div>

      <h3>{widget.title}</h3>
      <p className="decision-widget__promise">{widget.promiseLine}</p>

      <div className="decision-widget__details">
        {widget.priceFrom ? <span>{widget.priceFrom}</span> : null}
        {widget.durationLabel ? <span>{widget.durationLabel}</span> : null}
      </div>

      <a
        href={widget.href}
        className={
          widget.variant === "primary"
            ? "button button-primary decision-widget__cta"
            : "button button-secondary decision-widget__cta"
        }
        onClick={handleClick}
      >
        {widget.ctaLabel}
      </a>
    </article>
  );
}
