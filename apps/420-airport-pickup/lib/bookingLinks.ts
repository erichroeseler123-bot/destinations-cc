const CHECKOUT_URL = "https://www.destinationcommandcenter.com/checkout";

type AirportPickupPackage = "airport-pickup" | "airport-dispensary";

type AirportPickupCheckoutInput = {
  product: AirportPickupPackage;
  sourcePage: string;
  cta: string;
};

export function buildAirportPickupCheckoutHref({
  product,
  sourcePage,
  cta,
}: AirportPickupCheckoutInput) {
  const params = new URLSearchParams();
  const mode = product === "airport-dispensary" ? "420" : "standard";

  params.set("route", "airport-420-pickup");
  params.set("product", product);
  params.set("product_slug", product);
  params.set("package", product === "airport-dispensary" ? "420-friendly" : "standard");
  params.set("mode", mode);
  params.set("arrival_focus", product);
  params.set("qty", "1");
  params.set("partySize", "1");
  params.set("pickup", "DEN Terminal Level 5 - East side");
  params.set("pickup_label", "DEN");
  params.set("dropoff", "Denver metro drop-off");
  params.set("pickupTime", "Arrival-based");
  params.set("source_page", sourcePage);
  params.set("decision_corridor", "airport-420-pickup");
  params.set("decision_cta", cta);
  params.set("decision_action", "checkout");
  params.set("decision_option", mode);
  params.set("decision_product", product);
  params.set("decision_entry", "flow-first");
  params.set("decision_state", "chosen");

  return `${CHECKOUT_URL}?${params.toString()}`;
}
