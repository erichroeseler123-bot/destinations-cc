/**
 * Destination Command Center — External Partner Concierge Widget Loader
 *
 * Usage on any hotel, cruise, or partner site:
 * <div id="dcc-concierge-widget-root"></div>
 * <script
 *   src="https://www.destinationcommandcenter.com/embed/dcc-concierge-widget.js"
 *   data-destination="new-orleans"
 *   data-property="hotel-monteleone-nola"
 *   data-surface="hotel_concierge"
 *   data-pickup-mode="hotel_pickup"
 *   async
 * ></script>
 */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function mountWidget() {
    var scriptEl =
      document.currentScript ||
      document.querySelector('script[src*="dcc-concierge-widget.js"]');

    var destination =
      (scriptEl && scriptEl.getAttribute("data-destination")) || "new-orleans";
    var property =
      (scriptEl && scriptEl.getAttribute("data-property")) ||
      "hotel-monteleone-nola";
    var surface =
      (scriptEl && scriptEl.getAttribute("data-surface")) || "hotel_concierge";
    var pickupMode =
      (scriptEl && scriptEl.getAttribute("data-pickup-mode")) || "";
    var targetId =
      (scriptEl && scriptEl.getAttribute("data-target")) ||
      "dcc-concierge-widget-root";
    var height = (scriptEl && scriptEl.getAttribute("data-height")) || "780px";

    var baseUrl = "https://www.destinationcommandcenter.com";
    if (scriptEl && scriptEl.src) {
      try {
        var parsed = new URL(scriptEl.src);
        baseUrl = parsed.origin;
      } catch (_e) {
        // Keep production origin
      }
    }

    var params = new URLSearchParams();
    params.set("destination", destination);
    params.set("property", property);
    params.set("surface", surface);
    if (pickupMode) params.set("pickupMode", pickupMode);

    var iframe = document.createElement("iframe");
    iframe.src = baseUrl + "/embed/concierge?" + params.toString();
    iframe.title =
      "Destination Command Center — Tour & Excursion Concierge Widget";
    iframe.style.width = "100%";
    iframe.style.minHeight = height;
    iframe.style.border = "0";
    iframe.style.borderRadius = "16px";
    iframe.style.overflow = "hidden";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("data-dcc-concierge-embed", "true");

    var container = document.getElementById(targetId);
    if (container) {
      container.innerHTML = "";
      container.appendChild(iframe);
    } else if (scriptEl && scriptEl.parentNode) {
      scriptEl.parentNode.insertBefore(iframe, scriptEl.nextSibling);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget);
  } else {
    mountWidget();
  }
})();
