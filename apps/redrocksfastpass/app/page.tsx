import Image from "next/image";
import Link from "next/link";
import { buildDccReturnUrl } from "@/lib/dcc";
import { listInventory } from "@/lib/inventoryStore";

export const dynamic = "force-dynamic";

const PAGE_URL = "https://redrocksfastpass.com/";

type InventorySlot = Awaited<ReturnType<typeof listInventory>>[number];

function getDenverDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function normalizeDayLabel(dateKey: string, fallback: string) {
  const todayKey = getDenverDateKey();
  if (dateKey === todayKey) return "Today";
  if (dateKey === addDays(todayKey, 1)) return "Tomorrow";
  return fallback;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ dcc_handoff_id?: string; dcc_return?: string }>;
}) {
  const params = await searchParams;
  const slots = await listInventory();
  const handoffId = params.dcc_handoff_id || "";
  const dccReturn =
    params.dcc_return || (handoffId ? buildDccReturnUrl("/red-rocks-shuttle", handoffId) : "");
  const qrUrl = handoffId
    ? `${PAGE_URL}?dcc_handoff_id=${encodeURIComponent(handoffId)}${
        dccReturn ? `&dcc_return=${encodeURIComponent(dccReturn)}` : ""
      }`
    : PAGE_URL;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrUrl)}`;

  const grouped = slots.reduce<Map<string, InventorySlot[]>>((map, slot) => {
    const list = map.get(slot.dateLabel);
    if (list) {
      list.push(slot);
    } else {
      map.set(slot.dateLabel, [slot]);
    }
    return map;
  }, new Map());

  const schedule = Array.from(grouped.entries())
    .slice(0, 2)
    .map(([label, daySlots]) => ({
      title: normalizeDayLabel(daySlots[0]?.id.split("-").slice(0, 3).join("-") || "", label),
      subtitle: label,
      slots: daySlots,
    }));

  return (
    <main>
      <section className="hero">
        <div className="hero-copy-wrap">
          <p className="eyebrow">Red Rocks Day Pass</p>
          <h1>$25 round-trip.</h1>
          <p className="subhead">
            Easy ride from downtown to Red Rocks Park. Morning departures for hiking, views, and photos. No car needed.
          </p>
          <div className="pill-row">
            <span className="pill">Union Station</span>
          </div>
        </div>
      </section>

      <section className="desktop-handoff">
        <div className="desktop-copy">
          <p className="eyebrow">Mobile only</p>
          <h2>Scan and go.</h2>
          <p>Easy daytime access to Red Rocks with transport included.</p>
        </div>
        <Image src={qrImage} alt="QR code for Red Rocks Fast Pass" width={260} height={260} />
      </section>

      <div className="mobile-flow">
        <section className="panel">
          <div className="schedule-list">
            <details style={{ margin: "0 0 20px", fontSize: "0.95rem" }}>
              <summary style={{ fontWeight: 600, cursor: "pointer" }}>FAQ</summary>
              <p>
                <strong>How much?</strong> $25 round-trip only.
              </p>
              <p>
                <strong>Where?</strong> Start downtown at Union Station. Red Rocks transport is included.
              </p>
              <p>
                <strong>When?</strong> Morning departures. Guaranteed return in the afternoon.
              </p>
              <p>
                <strong>What is it?</strong> A Red Rocks daytime visit for sightseeing, hiking, and photos. No concerts.
              </p>
              <p>
                <strong>One-way?</strong> No. Round-trip only.
              </p>
            </details>
            {schedule.map((group) => (
              <section key={group.subtitle} className="schedule-day">
                <div className="schedule-heading">
                  <h3>{group.title}</h3>
                  <p>{group.subtitle}</p>
                </div>
                <div className="schedule-buttons">
                  {group.slots.map((slot) =>
                    slot.soldOut ? (
                      <div key={slot.id} className="time-button sold-out">
                        <span>{slot.departLabel}</span>
                        <em>Sold out</em>
                      </div>
                    ) : (
                      <Link
                        key={slot.id}
                        href={`/checkout?slot=${encodeURIComponent(slot.id)}${
                          handoffId ? `&dcc_handoff_id=${encodeURIComponent(handoffId)}` : ""
                        }${dccReturn ? `&dcc_return=${encodeURIComponent(dccReturn)}` : ""}`}
                        className="time-button"
                      >
                        <span>{slot.departLabel}</span>
                      </Link>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
          <div className="rule-box">Easy downtown access. Operated by GoSno LLC. Guaranteed return trip.</div>
        </section>
      </div>

      <footer className="footer">
        Red Rocks Day Pass • Operated by GoSno LLC • © 2026 • <Link href="https://gosno.co">gosno.co</Link>
      </footer>
    </main>
  );
}
