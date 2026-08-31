import DellsHomeClient from "./components/DellsHomeClient";

export const dynamic = "force-static";

const PNE =
  "https://people-n-equipment.vercel.app/?utm_source=welcometothedells&utm_medium=referral&utm_campaign=dells_equipment_owners";

export default function HomePage() {
  return (
    <>
      <DellsHomeClient />
      <section
        aria-label="Local equipment owners"
        style={{
          maxWidth: 1120,
          margin: "0 auto 48px",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(24,63,46,.18)",
            borderRadius: 18,
            padding: "24px 26px",
            background: "#f7f2e8",
            color: "#17231d",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            For local equipment owners
          </div>
          <h2 style={{ margin: "8px 0 8px", fontSize: "clamp(24px,4vw,36px)" }}>
            Own equipment near the Dells? Put it to work.
          </h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.6, maxWidth: 760 }}>
            People &amp; Equipment is testing a free local marketplace for trailers,
            skid steers, mini excavators, generators, mowers and other useful equipment.
            No account is required for the first pilot intake.
          </p>
          <a
            href={PNE}
            style={{
              display: "inline-block",
              padding: "12px 16px",
              borderRadius: 10,
              background: "#183f2e",
              color: "white",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Add my equipment →
          </a>
        </div>
      </section>
    </>
  );
}
