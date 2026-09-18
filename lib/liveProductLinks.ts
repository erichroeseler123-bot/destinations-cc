export const WTS_CONFIRMED_VIATOR_PRODUCTS = {
  airboat: {
    productCode: "3780AIRBOAT",
    title: "Airboat Ride with Optional Transportation from New Orleans",
    supplier: "Gray Line New Orleans",
    destinationId: 675,
    destinationSlug: "New-Orleans",
    productSlug: "Airboat-Ride-with-Round-Trip-Transport-from-New-Orleans",
  },
  smallBoat: {
    productCode: "3780SWAMP",
    title: "New Orleans Swamp and Bayou Alligator Tour",
    supplier: "Gray Line New Orleans",
    destinationId: 675,
    destinationSlug: "New-Orleans",
    productSlug: "Swamp-and-Bayou-Sightseeing-Tour-with-Boat-Ride-from-New-Orleans",
  },
  pickup: {
    productCode: "6953SWAMPTRANS",
    title: "New Orleans Swamp and Bayou Boat Tour with Transportation",
    supplier: "Cajun Encounters Tour Co.",
    destinationId: 675,
    destinationSlug: "New-Orleans",
    productSlug: "Honey-Island-Swamp-Tour-With-Transport",
  },
} as const;

export function getWtsLiveProductLinks() {
  const pid =
    process.env.NEXT_PUBLIC_VIATOR_PID?.trim() ||
    process.env.VIATOR_PID?.trim() ||
    "P00306962";
  const mcid =
    process.env.NEXT_PUBLIC_VIATOR_MCID?.trim() ||
    process.env.VIATOR_MCID?.trim() ||
    "42383";

  return {
    airboatHref:
      `https://www.viator.com/tours/${WTS_CONFIRMED_VIATOR_PRODUCTS.airboat.destinationSlug}/${WTS_CONFIRMED_VIATOR_PRODUCTS.airboat.productSlug}/d${WTS_CONFIRMED_VIATOR_PRODUCTS.airboat.destinationId}-${WTS_CONFIRMED_VIATOR_PRODUCTS.airboat.productCode}?pid=${pid}&mcid=${mcid}&medium=link&campaign=wts-plan-airboat&utm_source=welcometotheswamp.com&utm_medium=affiliate&utm_campaign=wts-plan-airboat`,
    smallBoatHref:
      `https://www.viator.com/tours/${WTS_CONFIRMED_VIATOR_PRODUCTS.smallBoat.destinationSlug}/${WTS_CONFIRMED_VIATOR_PRODUCTS.smallBoat.productSlug}/d${WTS_CONFIRMED_VIATOR_PRODUCTS.smallBoat.destinationId}-${WTS_CONFIRMED_VIATOR_PRODUCTS.smallBoat.productCode}?pid=${pid}&mcid=${mcid}&medium=link&campaign=wts-plan-covered-boat&utm_source=welcometotheswamp.com&utm_medium=affiliate&utm_campaign=wts-plan-covered-boat`,
    pickupHref:
      `https://www.viator.com/tours/${WTS_CONFIRMED_VIATOR_PRODUCTS.pickup.destinationSlug}/${WTS_CONFIRMED_VIATOR_PRODUCTS.pickup.productSlug}/d${WTS_CONFIRMED_VIATOR_PRODUCTS.pickup.destinationId}-${WTS_CONFIRMED_VIATOR_PRODUCTS.pickup.productCode}?pid=${pid}&mcid=${mcid}&medium=link&campaign=wts-plan-pickup&utm_source=welcometotheswamp.com&utm_medium=affiliate&utm_campaign=wts-plan-pickup`,
  };
}
