"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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

const DCC_ORIGIN = process.env.NEXT_PUBLIC_DCC_ORIGIN || "https://www.destinationcommandcenter.com";
const PAGE_URL = "https://juneauflightdeck.com/";
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1508264165352-258a6f82b6f4?auto=format&fit=crop&w=1400&q=80";
const QR_IMAGE = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(PAGE_URL)}`;

function buildSeasonBounds() {
  const year = new Date().getFullYear();
  return {
    min: `${year}-05-01`,
    max: `${year}-09-30`,
  };
}

function formatDuration(durationMinutes: number | null) {
  if (!Number.isFinite(durationMinutes) || durationMinutes === null || durationMinutes <= 0) return null;
  if (durationMinutes % 60 === 0) return `${durationMinutes / 60} hr`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (!hours) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
}

function formatUpdatedLabel(generatedAt: string) {
  const parsed = new Date(generatedAt);
  if (Number.isNaN(parsed.getTime())) return "Live now";
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export default function JuneauHomeClient({
  initialDate,
  initialQuery,
  initialData,
}: {
  initialDate: string;
  initialQuery: string;
  initialData: JuneauProductsResponse | null;
}) {
  const bounds = buildSeasonBounds();
  const [date, setDate] = useState(initialDate);
  const [query, setQuery] = useState(initialQuery);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [data, setData] = useState<JuneauProductsResponse>({
    generatedAt: initialData?.generatedAt || new Date().toISOString(),
    selectedDate: initialData?.selectedDate || initialDate || null,
    signals: initialData?.signals || {},
    browseHref: initialData?.browseHref,
    products: initialData?.products || [],
  });
  const [loading, setLoading] = useState(false);
  const skippedInitialFetchRef = useRef(false);

  useEffect(() => {
    const current = new URL(window.location.href);
    if (date) current.searchParams.set("date", date);
    else current.searchParams.delete("date");
    if (query.trim()) current.searchParams.set("q", query.trim());
    else current.searchParams.delete("q");
    window.history.replaceState({}, "", current.toString());
  }, [date, query]);

  useEffect(() => {
    if (!date) return;

    if (
      !skippedInitialFetchRef.current &&
      refreshNonce === 0 &&
      initialData &&
      initialDate === date
    ) {
      skippedInitialFetchRef.current = true;
      return;
    }

    let ignore = false;
    setLoading(true);

    fetch(`${DCC_ORIGIN}/api/public/juneau-heli-products-viator?date=${encodeURIComponent(date)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load Juneau helicopter products");
        return (await response.json()) as JuneauProductsResponse;
      })
      .then((payload) => {
        if (!ignore) setData(payload);
      })
      .catch(() => {
        if (!ignore) {
          setData({
            generatedAt: new Date().toISOString(),
            selectedDate: date,
            signals: {},
            products: [],
          });
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [date, initialData, initialDate, refreshNonce]);

  const updatedLabel = formatUpdatedLabel(data.generatedAt);
  const normalizedQuery = normalizeQuery(query);
  const filteredProducts = data.products.filter((product) => {
    if (!normalizedQuery) return true;
    const haystack = normalizeQuery(
      [product.title, product.description, product.supplierName].filter(Boolean).join(" "),
    );
    return haystack.includes(normalizedQuery);
  });
  const uniqueOperators = Array.from(
    new Set(filteredProducts.map((product) => product.supplierName).filter(Boolean)),
  );
  const groupedProducts = filteredProducts.reduce<Array<{ operator: string; products: ViatorProduct[] }>>(
    (groups, product) => {
      const operator = product.supplierName || "Other Juneau operators";
      const existing = groups.find((group) => group.operator === operator);
      if (existing) {
        existing.products.push(product);
      } else {
        groups.push({ operator, products: [product] });
      }
      return groups;
    },
    [],
  );

  return (
    <main>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Juneau helicopter tours</p>
            <h1>Pick your date. Open the right helicopter tours.</h1>
            <p className="trust-line">DCC Fast Pass - Real-time availability to direct bookings</p>
            <p className="hero-copy">
              Juneau cruise visitors usually only get one port day. Pick that date first, then open
              helicopter tours from the companies showing for that day without wading through unrelated Alaska products.
            </p>
            <div className="cta-row">
              <a href="#live-slots" className="button">
                Check your date
              </a>
              {data.browseHref ? (
                <a href={data.browseHref} className="button-secondary">
                  Browse more helicopter tours
                </a>
              ) : null}
            </div>
          </div>

          <div className="handoff">
            <div className="eyebrow">Desktop handoff</div>
            <div style={{ fontFamily: "\"Avenir Next\", \"Segoe UI\", sans-serif", fontWeight: 800 }}>
              This site is designed for mobile.
            </div>
            <Image src={QR_IMAGE} alt="QR code to open Juneau Flight Deck on your phone" width={220} height={220} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div style={{ position: "relative", width: "100%", height: 240, borderRadius: 24, overflow: "hidden", marginBottom: 18 }}>
          <Image src={HERO_IMAGE} alt="Juneau helicopter tour mood image" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
        <h2>How booking works</h2>
        <p className="muted">
          This is a date-first Juneau helicopter surface. Choose the exact day you will be in port,
          then compare helicopter products across the operators showing for that day.
        </p>
        <div className="notice">
          Booking notice: Juneau Flight Deck helps you compare helicopter products quickly and move into
          the Viator partner booking flow. DCC may earn a commission when you book, but the goal is to
          cut the search mess down to a short, usable list.
        </div>
      </section>

      <section className="panel" id="live-slots">
        <p className="eyebrow">Date-first booking</p>
        <h2>Select your Juneau day</h2>
        <p className="muted">Choose the one day you will actually be in port. Then check helicopter tours across the Juneau companies showing for that date.</p>
        <div className="meta-row">
          <input
            className="date-input"
            type="date"
            min={bounds.min}
            max={bounds.max}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="meta-row">
          <input
            className="date-input"
            type="text"
            placeholder="Optional filter: glacier landing, dog sled, operator name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {date ? (
          <>
            <div className="meta-row">
              <div className="last-updated">Last updated: {updatedLabel}</div>
              <button className="refresh-link" type="button" onClick={() => setRefreshNonce((value) => value + 1)}>
                Refresh this date
              </button>
            </div>
            <h2 style={{ marginTop: 18 }}>Helicopter tours to check for {date}</h2>
            {data.signals.headline ? <p className="muted">{data.signals.headline}</p> : null}
            {filteredProducts.length ? (
              <p className="muted" style={{ marginTop: 10 }}>
                {filteredProducts.length} tour{filteredProducts.length === 1 ? "" : "s"} across {uniqueOperators.length} compan{uniqueOperators.length === 1 ? "y" : "ies"}
                {query.trim() ? ` matching "${query.trim()}"` : ""}.
              </p>
            ) : null}
            <div className="list">
              {loading ? (
                <div className="slot-card">
                  <h3>Loading helicopter products</h3>
                  <div className="slot-summary">Checking Juneau helicopter products for your selected date now.</div>
                </div>
              ) : groupedProducts.length ? (
                groupedProducts.map((group) => (
                  <section key={group.operator} className="slot-card" style={{ gap: 18 }}>
                    <div>
                      <div className="slot-time">Operator</div>
                      <h3 style={{ marginBottom: 0 }}>{group.operator}</h3>
                      <div className="slot-summary">
                        {group.products.length} helicopter tour{group.products.length === 1 ? "" : "s"} showing for this date.
                      </div>
                    </div>
                    <div className="list">
                      {group.products.map((product) => {
                        const durationLabel = formatDuration(product.durationMinutes);
                        return (
                          <a key={product.id} href={product.bookHref} className="slot-card product-card">
                            {product.imageUrl ? (
                              <div className="product-image-wrap">
                                <Image
                                  src={product.imageUrl}
                                  alt={product.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  style={{ objectFit: "cover" }}
                                />
                              </div>
                            ) : null}
                            <div className="slot-head">
                              <div>
                                <div className="slot-time">Helicopter tour</div>
                                <h3>{product.title}</h3>
                              </div>
                              {product.priceLabel ? <div className="seat-badge">{product.priceLabel}</div> : null}
                            </div>
                            {product.description ? <div className="slot-summary">{product.description}</div> : null}
                            <div className="product-meta">
                              {durationLabel ? <span>{durationLabel}</span> : null}
                              {product.supplierName ? <span>{product.supplierName}</span> : null}
                            </div>
                            <div className="slot-summary">
                              Open this product and confirm the exact availability for your selected cruise day inside the booking flow.
                            </div>
                            <div className="button">Open this tour</div>
                          </a>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="slot-card">
                  <h3>No helicopter products are showing right now</h3>
                  <div className="slot-summary">
                    {query.trim()
                      ? `No helicopter products matched "${query.trim()}" for this date. Clear the filter or try the broader browse button above.`
                      : "The current Viator search did not return matching Juneau helicopter products. Refresh again or try the broader browse button above."}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </section>

      <footer className="footer">DCC Fast Pass - To Direct Bookings</footer>
    </main>
  );
}
