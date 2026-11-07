(function () {
  var hasAccepted = false;
  try {
    var consent =
      (window.localStorage && window.localStorage.getItem("dcc_cookie_consent")) || "";
    hasAccepted =
      consent === "accepted" || document.cookie.indexOf("dcc_cookie_consent=accepted") !== -1;
  } catch (_err) {
    hasAccepted = false;
  }

  var params = new URLSearchParams(window.location.search);
  var current = document.currentScript;
  var src = current && current.src ? new URL(current.src, window.location.origin) : null;
  var id = (src && src.searchParams.get("id")) || params.get("ga_id");

  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  var defaultStatus = hasAccepted ? "granted" : "denied";
  window.gtag("consent", "default", {
    analytics_storage: defaultStatus,
    ad_storage: defaultStatus,
    ad_user_data: defaultStatus,
    ad_personalization: defaultStatus,
    wait_for_update: 500,
  });

  window.gtag("js", new Date());
  window.gtag("config", id, {
    page_path: window.location.pathname,
  });

  window.addEventListener("dcc-consent-change", function (event) {
    var nextState = event && event.detail;
    var nextStatus = nextState === "accepted" ? "granted" : "denied";
    window.gtag("consent", "update", {
      analytics_storage: nextStatus,
      ad_storage: nextStatus,
      ad_user_data: nextStatus,
      ad_personalization: nextStatus,
    });
  });
})();
