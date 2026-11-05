/**
 * Destination Command Center — External Partner Concierge Widget Loader
 *
 * Usage on any hotel, cruise, or partner site:
 * <div id="dcc-concierge-widget-root"></div>
 * <script
 *   src="https://www.destinationcommandcenter.com/embed/dcc-concierge-widget.js"
 *   data-destination="new-orleans"
 *   data-property="hotel-monteleone-nola"
 *   data-placement-id="nola-hotel-monteleone-demo-pilot"
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
    var placementId =
      (scriptEl &&
        (scriptEl.getAttribute("data-placement-id") ||
          scriptEl.getAttribute("data-placement"))) ||
      (property === "hotel-monteleone-nola"
        ? "nola-hotel-monteleone-demo-pilot"
        : "");
    var surface =
      (scriptEl && scriptEl.getAttribute("data-surface")) || "hotel_concierge";
    var pickupMode =
      (scriptEl && scriptEl.getAttribute("data-pickup-mode")) || "";
    var date = (scriptEl && scriptEl.getAttribute("data-date")) || "";
    var shipArrival =
      (scriptEl && scriptEl.getAttribute("data-ship-arrival")) || "";
    var shipAllAboard =
      (scriptEl && scriptEl.getAttribute("data-ship-all-aboard")) || "";
    var category =
      (scriptEl && scriptEl.getAttribute("data-category")) || "";
    var isTest =
      (scriptEl &&
        (scriptEl.getAttribute("data-is-test") ||
          scriptEl.getAttribute("data-test"))) ||
      "";
    var targetId =
      (scriptEl && scriptEl.getAttribute("data-target")) ||
      "dcc-concierge-widget-root";
    var height =
      (scriptEl &&
        (scriptEl.getAttribute("data-min-height") ||
          scriptEl.getAttribute("data-height"))) ||
      "780px";

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
    if (placementId) params.set("placementId", placementId);
    if (pickupMode) params.set("pickupMode", pickupMode);
    if (date) params.set("date", date);
    if (shipArrival) params.set("shipArrival", shipArrival);
    if (shipAllAboard) params.set("allAboard", shipAllAboard);
    if (category) params.set("category", category);
    if (isTest) params.set("isTest", isTest);
    if (window.location && window.location.origin) {
      params.set("parentOrigin", window.location.origin);
    }

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
    if (placementId) {
      iframe.setAttribute("data-placement-id", placementId);
    }

    window.addEventListener("message", function (ev) {
      if (
        ev &&
        ev.data &&
        ev.data.type === "dcc-concierge-resize" &&
        typeof ev.data.height === "number" &&
        ev.data.height > 320
      ) {
        iframe.style.height = Math.ceil(ev.data.height + 24) + "px";
      }
    });

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
