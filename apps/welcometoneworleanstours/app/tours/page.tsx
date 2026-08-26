import CanonicalToursPage, { generateMetadata } from "@/app/new-orleans/tours/page";

export { generateMetadata };

export default function WnoToursPage() {
  return (
    <div data-wno-surface="tours">
      <CanonicalToursPage />
    </div>
  );
}
