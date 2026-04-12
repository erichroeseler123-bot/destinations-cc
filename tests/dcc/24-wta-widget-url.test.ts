import test from "node:test";
import assert from "node:assert/strict";
import { buildWtaProductWidgetUrl, WTA_WIDGET_BASE } from "@/lib/wta/embed";

test("WTA widget builder uses branded host and keeps attribution query params", () => {
  const url = new URL(
    buildWtaProductWidgetUrl({
      company: "coastalhelicopters",
      item: "413056",
      attribution: {
        handoffId: "handoff-123",
        source: "dcc",
        sourceSlug: "dcc-juneau-helicopter-embed",
        sourcePage: "/juneau/helicopter-tours",
        topicSlug: "helicopter-tours",
        portSlug: "juneau-alaska",
        productSlug: "icefield-excursion",
        widgetPlacement: "inline-primary",
        embedId: "juneau-heli-1",
        embedDomain: "destinationcommandcenter.com",
        embedPath: "/juneau/helicopter-tours",
        returnPath: "/juneau/helicopter-tours",
      },
    })
  );

  assert.equal(url.origin, new URL(WTA_WIDGET_BASE).origin);
  assert.equal(url.pathname, "/widget/coastalhelicopters/413056");
  assert.equal(url.searchParams.get("dcc_handoff_id"), "handoff-123");
  assert.equal(url.searchParams.get("source"), "dcc");
  assert.equal(url.searchParams.get("source_slug"), "dcc-juneau-helicopter-embed");
  assert.equal(url.searchParams.get("source_page"), "/juneau/helicopter-tours");
  assert.equal(url.searchParams.get("port_slug"), "juneau-alaska");
  assert.equal(url.searchParams.get("product_slug"), "icefield-excursion");
  assert.equal(url.searchParams.get("widget_placement"), "inline-primary");
  assert.equal(url.searchParams.get("embed_id"), "juneau-heli-1");
  assert.equal(url.searchParams.get("embed_domain"), "destinationcommandcenter.com");
  assert.equal(url.searchParams.get("embed_path"), "/juneau/helicopter-tours");
  assert.equal(
    url.searchParams.get("dcc_return"),
    "https://destinationcommandcenter.com/juneau/helicopter-tours?dcc_handoff_id=handoff-123"
  );
});
