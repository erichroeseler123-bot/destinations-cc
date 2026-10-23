// Public adult starting prices checked 2026-10-23. These compare experience
// types, not confirmed inventory, identical departures, or all-in booking terms.
export const SAVINGS_CHECKED_DATE = "October 23, 2026";
export const PRICE_COMPARISONS = [
  {
    title: "Mendenhall Glacier helicopter & guided walk",
    cruiseLine: "Norwegian",
    cruiseCents: 48999,
    operator: "TEMSCO",
    operatorCents: 40900,
    cruiseUrl: "https://www.ncl.com/shore-excursions/JNU_18/Mendenhall-Glacier-By-Helicopter-Guided-Walk",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/",
  },
  {
    title: "Mendenhall Glacier helicopter & guided walk",
    cruiseLine: "Disney",
    cruiseCents: 46900,
    operator: "TEMSCO",
    operatorCents: 40900,
    cruiseUrl: "https://disneycruise.disney.go.com/en-eu/port-adventures/juneau-alaska-mendenhall-glacier-and-guided-walk/",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/",
  },
  {
    title: "Helicopter glacier trek · two hours on the ice",
    cruiseLine: "Carnival",
    cruiseCents: 59199,
    operator: "NorthStar",
    operatorCents: 54900,
    cruiseUrl: "https://www.carnival.com/shore-excursions/juneau/helicopter-flightseeing--glacier-trek-171067",
    operatorUrl: "https://northstartrekking.com/",
  },
] as const;

export const AVERAGE_LISTED_SAVINGS_CENTS = Math.round(
  PRICE_COMPARISONS.reduce((sum, comparison) => sum + comparison.cruiseCents - comparison.operatorCents, 0) / PRICE_COMPARISONS.length,
);

export function readPriceCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) && cents <= 10000000 ? cents : null;
}

export function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
