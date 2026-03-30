"use client";

import { useMemo } from "react";

export type LiveSlot = {
  slotId: string;
  itemId: string;
  startIso: string;
  displayTime: string;
  type: string;
  seatsLeft: number;
  bookHref: string;
};

export default function SlotList({
  slots,
  generatedAt
}: {
  slots: LiveSlot[];
  generatedAt: string;
}) {
  const updatedLabel = useMemo(() => {
    const parsed = new Date(generatedAt);
    if (Number.isNaN(parsed.getTime())) return "Live now";
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  }, [generatedAt]);

  return (
    <>
      <div className="meta-row">
        <div className="last-updated">Last updated: {updatedLabel}</div>
        <button className="refresh-link" type="button" onClick={() => window.location.reload()}>
          Refresh live slots
        </button>
      </div>

      <div className="list">
        {slots.length ? (
          slots.map((slot) => {
            const badgeClass = slot.seatsLeft <= 5 ? "seat-badge low" : "seat-badge";
            return (
              <a key={slot.slotId} href={slot.bookHref} className="slot-card">
                <div className="slot-head">
                  <div>
                    <div className="slot-time">{slot.displayTime}</div>
                    <h3>{slot.type}</h3>
                  </div>
                  <div className={badgeClass}>
                    {slot.seatsLeft <= 5 ? `Only ${slot.seatsLeft} left` : `${slot.seatsLeft} seats left`}
                  </div>
                </div>
                <div className="slot-summary">
                  Pick the time that fits and finish the reservation directly with the provider through FareHarbor.
                </div>
                <div className="button">Book this slot</div>
              </a>
            );
          })
        ) : (
          <div className="slot-card">
            <h3>No open swamp slots right now</h3>
            <div className="slot-summary">
              If nothing is showing, availability is likely tight at the moment. Refresh again or open the full booking surface.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
