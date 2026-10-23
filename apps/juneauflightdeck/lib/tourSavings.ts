// Public adult starting prices checked 2026-10-23. These compare experience
// types, not confirmed inventory, identical departures, or all-in booking terms.
export const SAVINGS_CHECKED_DATE = "October 23, 2026";
export const PRICE_COMPARISONS = [
  {
    category: "glacier-walk",
    title: "Mendenhall Glacier helicopter & guided walk",
    cruiseLine: "Norwegian",
    cruiseCents: 48999,
    operator: "TEMSCO",
    operatorCents: 40900,
    cruiseUrl: "https://www.ncl.com/shore-excursions/JNU_18/Mendenhall-Glacier-By-Helicopter-Guided-Walk",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
  },
  {
    category: "glacier-walk",
    title: "Mendenhall Glacier helicopter & guided walk",
    cruiseLine: "Disney",
    cruiseCents: 46900,
    operator: "TEMSCO",
    operatorCents: 40900,
    cruiseUrl: "https://disneycruise.disney.go.com/en-eu/port-adventures/juneau-alaska-mendenhall-glacier-and-guided-walk/",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
  },
  {
    category: "glacier-trek",
    title: "Helicopter glacier trek · two hours on the ice",
    cruiseLine: "Carnival",
    cruiseCents: 59199,
    operator: "NorthStar",
    operatorCents: 54900,
    cruiseUrl: "https://www.carnival.com/shore-excursions/juneau/helicopter-flightseeing--glacier-trek-171067",
    operatorUrl: "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
  },
  {
    category: "dog-sledding",
    title: "Dog sledding on Mendenhall Glacier by helicopter",
    cruiseLine: "Norwegian",
    cruiseCents: 76999,
    operator: "TEMSCO",
    operatorCents: 75900,
    cruiseUrl: "https://www.ncl.com/shore-excursions/JNU_33/Dogsledding-On-Mendenhall-Glacier-Via-Helicopter",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
  },
  {
    category: "dog-sledding",
    title: "Dog sledding on Mendenhall Glacier by helicopter",
    cruiseLine: "Carnival",
    cruiseCents: 77899,
    operator: "TEMSCO",
    operatorCents: 75900,
    cruiseUrl: "https://www.carnival.com/shore-excursions/juneau/dog-sledding-on-mendenhall-glacier-via-helicopter-171032",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
  },
  {
    category: "dog-sledding",
    title: "Dog sledding on Mendenhall Glacier by helicopter",
    cruiseLine: "Disney",
    cruiseCents: 89900,
    operator: "TEMSCO",
    operatorCents: 75900,
    cruiseUrl: "https://disneycruise.disney.go.com/port-adventures/juneau-alaska-dog-sledding-on-the-mendenhall-glacier/",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
  },
  {
    category: "dog-sledding",
    title: "Dog sledding on Mendenhall Glacier by helicopter",
    cruiseLine: "Princess",
    cruiseCents: 78995,
    operator: "TEMSCO",
    operatorCents: 75900,
    cruiseUrl: "https://www.princess.com/ports-excursions/juneau-alaska-excursions/dog-sledding-on-the-mendenhall-glacier-by-helicopter/",
    operatorUrl: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
  },
] as const;

export type SavingsMode = "all" | typeof PRICE_COMPARISONS[number]["category"] | "custom";

export const SAVINGS_OPTIONS: ReadonlyArray<{ value: SavingsMode; label: string }> = [
  { value: "all", label: "All 3: walk, trek & dog sled" },
  { value: "glacier-walk", label: "Helicopter glacier walk" },
  { value: "glacier-trek", label: "Helicopter glacier trek" },
  { value: "dog-sledding", label: "Helicopter dog sledding" },
  { value: "custom", label: "My checkout prices" },
];

export function getComparisons(mode: SavingsMode) {
  if (mode === "custom") return [];
  return PRICE_COMPARISONS.filter(comparison => mode === "all" || comparison.category === mode);
}

export function averageSavingsCents(comparisons: ReadonlyArray<{ cruiseCents: number; operatorCents: number }>): number | null {
  if (comparisons.length === 0) return null;
  return Math.round(
    comparisons.reduce((sum, comparison) => sum + comparison.cruiseCents - comparison.operatorCents, 0) / comparisons.length,
  );
}

export function readPriceCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) && cents <= 10000000 ? cents : null;
}

export function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
