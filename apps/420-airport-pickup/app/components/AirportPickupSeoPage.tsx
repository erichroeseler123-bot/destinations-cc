import Link from "next/link";
import { buildAirportPickupCheckoutHref } from "@/lib/bookingLinks";

type CompareRow = {
  title: string;
  copy: string;
};

type AirportPickupSeoPageProps = {
  sourcePage: string;
  eyebrow: string;
  h1: string;
  quickAnswer: string;
  body: string;
  rows: CompareRow[];
  primary420?: boolean;
};

export default function AirportPickupSeoPage({
  sourcePage,
  eyebrow,
  h1,
  quickAnswer,
  body,
  rows,
  primary420 = true,
}: AirportPickupSeoPageProps) {
  const friendlyHref = buildAirportPickupCheckoutHref({
    product: "airport-dispensary",
    sourcePage,
    cta: "book-420-friendly-pickup",
  });
  const standardHref = buildAirportPickupCheckoutHref({
    product: "airport-pickup",
    sourcePage,
    cta: "book-standard-pickup",
  });

  return (
    <main className="site-shell static-page-shell">
      <section className="panel static-page-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="static-page-title">{h1}</h1>
        <p className="entry-snippet">{quickAnswer}</p>
        <div className="cta-row">
          <Link href={primary420 ? friendlyHref : standardHref} className="button">
            {primary420 ? "Book 420-Friendly Pickup" : "Book Standard Pickup"}
          </Link>
          <Link href={primary420 ? standardHref : friendlyHref} className="button-secondary">
            {primary420 ? "Book Standard Pickup" : "Book 420-Friendly Pickup"}
          </Link>
        </div>
      </section>

      <section className="panel">
        <p className="muted" style={{ maxWidth: 760 }}>
          {body}
        </p>
        <div className="trust-grid" style={{ marginTop: 20 }}>
          {rows.map((row) => (
            <div className="trust-item" key={row.title}>
              <strong>{row.title}</strong>
              <p className="muted">{row.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Book now</p>
        <h2>Choose the arrival lane before you land.</h2>
        <div className="cta-row">
          <Link href={friendlyHref} className="button">
            Book 420-Friendly Pickup
          </Link>
          <Link href={standardHref} className="button-secondary">
            Book Standard Pickup
          </Link>
        </div>
      </section>
    </main>
  );
}
