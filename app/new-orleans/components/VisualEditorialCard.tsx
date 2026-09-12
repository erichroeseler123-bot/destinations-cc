import Link from "next/link";
import FareHarborBookingButton from "./FareHarborBookingButton";

type VisualEditorialCardProps = {
  title: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  eyebrow?: string;
  badge?: string;
  operatorName?: string;
  durationLabel?: string;
  pickupSummary?: string;
  inclusions?: string[];
  bookingHref?: string;
  bookingItemId?: string | number;
  bookingFlowId?: string | number;
  companyShortname?: string;
  asn?: string;
  refCode?: string;
};

export default function VisualEditorialCard({
  title,
  slug,
  description,
  imageUrl,
  eyebrow = "Our pick for this kind of day",
  badge,
  operatorName,
  durationLabel,
  pickupSummary,
  inclusions,
  bookingHref,
  bookingItemId,
  bookingFlowId,
  companyShortname,
  asn,
  refCode = "wtonot-category",
}: VisualEditorialCardProps) {
  const href = `/tours/${slug}`;
  const effectiveBookingHref = bookingHref || href;

  return (
    <article className="group flex flex-col justify-between overflow-hidden border border-[#2f291f] bg-[#11100d] shadow-[0_18px_50px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-[#c9a86a]/80 hover:shadow-[0_24px_70px_rgba(0,0,0,.38)]">
      <div>
        <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a] focus-visible:ring-inset">
          <div className="relative aspect-[16/9] overflow-hidden bg-[#17140f]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.035] group-hover:opacity-95"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(201,168,106,.22),transparent_36%),linear-gradient(135deg,#211b12,#0d0c0a)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a09] via-[#0b0a09]/45 to-transparent" />
            {badge && (
              <div className="absolute left-4 top-4 z-10">
                <span className="inline-block rounded bg-[#11100d]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/40 backdrop-blur-sm">
                  {badge}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4c985]">{eyebrow}</p>
              <h3 className="mt-2 font-serif text-2xl leading-tight text-[#fff8eb] md:text-[1.7rem]">{title}</h3>
            </div>
          </div>
        </Link>

        <div className="p-5 md:p-6">
          {operatorName && (
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              Operated by {operatorName}
            </p>
          )}

          {(durationLabel || pickupSummary) && (
            <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#dcd4c7]">
              {durationLabel && (
                <span className="font-semibold text-[#f3dfb3]">
                  ⏱ {durationLabel}
                </span>
              )}
              {pickupSummary && (
                <span className="text-[#aaa193]">
                  📍 {pickupSummary}
                </span>
              )}
            </div>
          )}

          {description && <p className="text-sm leading-6 text-[#b9b0a2]">{description}</p>}

          {inclusions && inclusions.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-[#a89f91]">
              {inclusions.slice(0, 3).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#c9a86a]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-5 pt-0 md:p-6 md:pt-0">
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#2f291f] pt-4">
          {companyShortname && bookingItemId ? (
            <FareHarborBookingButton
              productTitle={title}
              productSlug={slug}
              shortname={companyShortname}
              itemId={bookingItemId}
              flowId={bookingFlowId}
              asn={asn || "welcometoneworleanstours"}
              refCode={refCode}
              fallbackHref={effectiveBookingHref}
              fullItems="yes"
              placement="category_card"
              className="inline-flex min-h-11 items-center bg-[#c9a86a] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#17130c] transition hover:bg-[#f3dfb3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f3dfb3]"
            >
              Check Dates & Prices
            </FareHarborBookingButton>
          ) : (
            <Link
              href={href}
              className="inline-flex min-h-11 items-center bg-[#c9a86a] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#17130c] transition hover:bg-[#f3dfb3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f3dfb3]"
            >
              See Availability
            </Link>
          )}
          <Link
            href={href}
            className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#d6bd82] transition hover:text-[#fff8eb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a]"
          >
            Tour Details →
          </Link>
        </div>
      </div>
    </article>
  );
}
