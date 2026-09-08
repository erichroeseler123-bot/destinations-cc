import CanonicalToursPage, { generateMetadata } from "@/app/new-orleans/tours/page";

export { generateMetadata };

export default function WnoToursPage() {
  return (
    <div data-wno-surface="tours" data-wno-version="storefront-lightframe-2026-09-08">
      <CanonicalToursPage />
    </div>
  );
}
