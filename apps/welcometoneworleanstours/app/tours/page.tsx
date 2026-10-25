import CanonicalToursPage, { generateMetadata } from "@/app/new-orleans/tours/page";

export { generateMetadata };
export const dynamic = "force-dynamic";

export default function WnoToursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div data-wno-surface="tours" data-wno-version="storefront-lightframe-2026-09-11-cd3f6378">
      <CanonicalToursPage searchParams={searchParams} />
    </div>
  );
}
