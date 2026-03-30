import JuneauHomeClient from "./components/JuneauHomeClient";

export const dynamic = "force-dynamic";

type ViatorProduct = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  supplierName: string | null;
  bookHref: string;
};

type JuneauProductsResponse = {
  generatedAt: string;
  selectedDate?: string | null;
  signals: { headline?: string };
  browseHref?: string;
  products: ViatorProduct[];
};

const DCC_ORIGIN = process.env.DCC_ORIGIN || "https://www.destinationcommandcenter.com";

async function getInitialData(date: string | null): Promise<JuneauProductsResponse | null> {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  try {
    const response = await fetch(
      `${DCC_ORIGIN}/api/public/juneau-heli-products-viator?date=${encodeURIComponent(date)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("Failed to load Juneau helicopter products");
    return (await response.json()) as JuneauProductsResponse;
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      selectedDate: date,
      signals: {},
      products: [],
    };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const initialDate = typeof resolved.date === "string" ? resolved.date : null;
  const initialQuery = typeof resolved.q === "string" ? resolved.q : "";
  const initialData = await getInitialData(initialDate);

  return (
    <JuneauHomeClient
      initialDate={initialDate || ""}
      initialQuery={initialQuery}
      initialData={initialData}
    />
  );
}
