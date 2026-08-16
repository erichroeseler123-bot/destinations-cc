import Link from "next/link";

type VisualEditorialCardProps = {
  title: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  eyebrow?: string;
};

export default function VisualEditorialCard({
  title,
  slug,
  description,
  imageUrl,
  eyebrow = "Our pick for this kind of day",
}: VisualEditorialCardProps) {
  const href = `/tours/${slug}`;

  return (
    <article className="group overflow-hidden border border-[#2f291f] bg-[#11100d] shadow-[0_18px_50px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-[#c9a86a]/80 hover:shadow-[0_24px_70px_rgba(0,0,0,.38)]">
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
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4c985]">{eyebrow}</p>
            <h3 className="mt-2 font-serif text-2xl leading-tight text-[#fff8eb] md:text-[1.7rem]">{title}</h3>
          </div>
        </div>
      </Link>

      <div className="p-5 md:p-6">
        {description && <p className="min-h-[3.25rem] text-sm leading-6 text-[#b9b0a2]">{description}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#2f291f] pt-4">
          <Link
            href={href}
            className="inline-flex min-h-11 items-center bg-[#c9a86a] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#17130c] transition hover:bg-[#f3dfb3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f3dfb3]"
          >
            See Availability
          </Link>
          <Link
            href={href}
            className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#d6bd82] transition hover:text-[#fff8eb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a86a]"
          >
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}
