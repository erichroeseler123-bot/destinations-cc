(function () {
  var params = new URLSearchParams(window.location.search);
  var current = document.currentScript;
  var src = current && current.src ? new URL(current.src, window.location.origin) : null;
  var id = (src && src.searchParams.get("id")) || params.get("ga_id");

  if (!id) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", id, {
    page_path: window.location.pathname,
  });
})();
