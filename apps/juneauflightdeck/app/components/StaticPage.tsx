import Link from "next/link";

export default function StaticPage({
  eyebrow,
  title,
  intro,
  bullets = [],
  ctaHref = "/",
  ctaLabel = "Plan your Juneau day",
  imageSrc = "/images/portfolio/mendenhall-glacier-overview.webp",
  imageAlt = "Mendenhall Glacier blue ice face, iceberg lake, and Coast Mountains in Juneau, Alaska",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  bullets?: string[];
  ctaHref?: string;
  ctaLabel?: string;
  imageSrc?: string | null;
  imageAlt?: string;
}) {
  return (
    <main className="page-shell static-page-shell">
      <section className="static-page-card">
        {imageSrc ? (
          <div
            style={{
              margin: "0 0 22px",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid var(--line, rgba(148, 163, 184, 0.25))",
              aspectRatio: "16 / 9",
              maxHeight: 300,
              background: "#071626",
            }}
          >
            <img
              src={imageSrc}
              alt={imageAlt}
              width={1440}
              height={900}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 48%", display: "block" }}
            />
          </div>
        ) : null}
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="static-page-title">{title}</h1>
        <p className="chooser-trust-line">{intro}</p>
        {bullets.length > 0 ? (
          <ul className="static-page-bullets">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        <p>
          <Link href={ctaHref} className="primary-cta">
            {ctaLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
