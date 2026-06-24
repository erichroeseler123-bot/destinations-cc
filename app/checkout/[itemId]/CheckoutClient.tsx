"use client";

import { useState, useEffect } from "react";
import RequestInviteModal from "@/components/RequestInviteModal";

interface EarthOsHappening {
  id: string;
  title: string;
  category: string;
  type: string;
  startTime: string;
  durationLabel: string;
  price: number | null;
  priceLabel: string;
  imageUrl: string;
  actionUrl: string;
  actionText: string;
  urgencyLabel: string | null;
  distanceText: string;
  whyItFits: string;
}

interface CheckoutClientProps {
  happening: EarthOsHappening;
  placeId: string;
}

const ACCENT_COLORS: Record<string, string> = {
  "new-orleans-la": "#00FF88", // Swamp Green
  "red-rocks-co": "#FF9F1C", // Sandstone Amber
  "eau-claire-wi": "#39FF14", // Runway Green
  "juneau-ak": "#00D2FF", // Glacier Blue
  "port-canaveral-orlando-fl": "#FF5E97" // Resort Coral
};

const gridBgStyle = {
  backgroundImage: `
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
  `,
  backgroundSize: "20px 20px",
  backgroundColor: "#07080a"
};

export default function CheckoutClient({ happening, placeId }: CheckoutClientProps) {
  const accentColor = ACCENT_COLORS[placeId] || "#00FF88";

  // 1. Countdown timer (5 minutes / 300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);
  const [isExpired, setIsExpired] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTransmissionId, setActiveTransmissionId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [transmissionStatus, setTransmissionStatus] = useState<"idle" | "sending" | "sent" | "authorized">("idle");

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem(`tx_id:${happening.id}`);
      const savedStatus = localStorage.getItem(`tx_status:${happening.id}`);
      const savedUrl = localStorage.getItem(`tx_url:${happening.id}`);
      
      if (savedId) setActiveTransmissionId(savedId);
      if (savedStatus) setTransmissionStatus(savedStatus as any);
      if (savedUrl) setCheckoutUrl(savedUrl);
    }
  }, [happening.id]);

  const updateStatus = (status: "idle" | "sending" | "sent" | "authorized", txId?: string | null, url?: string | null) => {
    setTransmissionStatus(status);
    if (typeof window !== "undefined") {
      localStorage.setItem(`tx_status:${happening.id}`, status);
      
      if (txId !== undefined) {
        setActiveTransmissionId(txId);
        if (txId) {
          localStorage.setItem(`tx_id:${happening.id}`, txId);
        } else {
          localStorage.removeItem(`tx_id:${happening.id}`);
        }
      }
      
      if (url !== undefined) {
        setCheckoutUrl(url);
        if (url) {
          localStorage.setItem(`tx_url:${happening.id}`, url);
        } else {
          localStorage.removeItem(`tx_url:${happening.id}`);
        }
      }
    }
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Polling invite status if status is "sent" and transmissionId exists
  useEffect(() => {
    if (transmissionStatus !== "sent" || !activeTransmissionId) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/request-invite?id=${activeTransmissionId}`);
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.transmission) {
            const tx = payload.transmission;
            if (tx.status === "AUTHORIZED" && tx.checkoutUrl) {
              if (isSubscribed) {
                updateStatus("authorized", activeTransmissionId, tx.checkoutUrl);
              }
            }
          }
        } else if (res.status === 404) {
          // If record deleted/burned, reset back to idle
          if (isSubscribed) {
            updateStatus("idle", null, null);
          }
        }
      } catch (err) {
        console.error("Error polling invite status:", err);
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [transmissionStatus, activeTransmissionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 2. Dynamic Scarcity State
  const [seatsLeft, setSeatsLeft] = useState(3);
  const [activeViewers, setActiveViewers] = useState(14);

  useEffect(() => {
    // Initialize seats based on happening details
    if (happening.urgencyLabel) {
      const match = happening.urgencyLabel.match(/(\d+)\s+seats?/i);
      if (match) {
        setSeatsLeft(parseInt(match[1], 10));
      } else {
        setSeatsLeft(Math.floor(Math.random() * 4) + 2); // 2 to 5
      }
    } else {
      setSeatsLeft(Math.floor(Math.random() * 6) + 3); // 3 to 8
    }
    setActiveViewers(Math.floor(Math.random() * 10) + 8); // 8 to 17
  }, [happening]);

  useEffect(() => {
    if (isExpired) return;
    const interval = setInterval(() => {
      // Fluctuating viewers
      setActiveViewers((prev) => {
        const diff = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const next = prev + diff;
        return next < 3 ? 3 : next > 25 ? 25 : next;
      });

      // Randomly decrement seats
      if (Math.random() > 0.85) {
        setSeatsLeft((prev) => (prev > 1 ? prev - 1 : 1));
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [isExpired]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = `/places/${placeId}`;
    }
  };

  const handlePayRedirect = () => {
    if (isExpired) return;
    window.location.href = happening.actionUrl;
  };

  // Calculate pricing values
  const basePrice = happening.price || 0;
  const processingFee = basePrice > 0 ? 3.5 : 0;
  const totalAmount = basePrice + processingFee;

  return (
    <div 
      className="checkout-container"
      style={gridBgStyle}
    >
      {/* Header */}
      <header className="checkout-header">
        <button 
          onClick={handleBack}
          className="checkout-back-btn"
        >
          &larr; BACK
        </button>
        <div className="checkout-header-status">
          <span className="checkout-header-status-dot" />
          <span className="checkout-header-status-label">
            CHECKOUT_GATE
          </span>
        </div>
      </header>

      {/* Urgency HUD */}
      <div className="checkout-hud">
        <div className="checkout-hud-status-bar">
          <span className="checkout-hud-status-label">
            {isExpired 
              ? "GATE_STATUS: EXPIRED" 
              : transmissionStatus === "authorized" 
                ? "GATE_STATUS: AUTHORIZED" 
                : "GATE_STATUS: SECURE_HOLD"}
          </span>
          <span className="checkout-hud-status-indicator">
            <span className={`checkout-hud-status-indicator-dot ${isExpired ? "expired" : "active"}`} />
            <span className={`checkout-hud-status-indicator-label ${isExpired ? "expired" : "active"}`}>
              {isExpired ? "DISCONNECTED" : "ACTIVE"}
            </span>
          </span>
        </div>
        <div className="checkout-hud-grid">
          {/* Hold Clock */}
          <div className="checkout-hud-card">
            <span className="checkout-hud-card-label">Hold Clock</span>
            <span className={`checkout-hud-card-value ${isExpired ? "expired" : "amber"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          {/* Live Capacity */}
          <div className="checkout-hud-card">
            <span className="checkout-hud-card-label">Capacity</span>
            <span className="checkout-hud-card-value red">
              {seatsLeft} Seats Left
            </span>
          </div>
          {/* Active Buyers */}
          <div className="checkout-hud-card">
            <span className="checkout-hud-card-label">Buyers</span>
            <span className="checkout-hud-card-value emerald">
              {activeViewers} Watching
            </span>
          </div>
        </div>
      </div>

      {/* Excursion Summary and Pricing Card */}
      <div className="checkout-main-card">
        {/* Banner Image */}
        {happening.imageUrl && (
          <div className="checkout-banner-img-wrap">
            <img 
              src={happening.imageUrl} 
              alt={happening.title} 
              className="checkout-banner-img"
            />
            <div className="checkout-banner-gradient" />
            <div className="checkout-banner-badge">
              {happening.category}
            </div>
          </div>
        )}

        <div className="checkout-details-wrap">
          <div className="checkout-details-info">
            <h2 className="checkout-details-title">
              {happening.title}
            </h2>
            <p className="checkout-details-desc">
              {happening.whyItFits}
            </p>
          </div>

          <div className="checkout-pricing-table">
            <div className="checkout-pricing-row">
              <span className="checkout-pricing-label">Departure</span>
              <span className="checkout-pricing-val">
                {new Date(happening.startTime).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
            <div className="checkout-pricing-row">
              <span className="checkout-pricing-label">Duration</span>
              <span className="checkout-pricing-val">{happening.durationLabel}</span>
            </div>
            <div className="checkout-pricing-row">
              <span className="checkout-pricing-label">Transit</span>
              <span className="checkout-pricing-val truncate" style={{ maxWidth: "180px" }}>{happening.distanceText}</span>
            </div>

            <div style={{ borderTop: "1px solid #27272a", paddingTop: "8px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div className="checkout-pricing-row">
                <span className="checkout-pricing-label">Base Fare</span>
                <span className="checkout-pricing-val">{happening.price === null ? "Free" : `$${basePrice.toFixed(2)}`}</span>
              </div>
              <div className="checkout-pricing-row">
                <span className="checkout-pricing-label">Secure Processing Fee</span>
                <span className="checkout-pricing-val">${processingFee.toFixed(2)}</span>
              </div>
              <div className="checkout-pricing-total-row">
                <span className="checkout-pricing-total-label">Total Price</span>
                <span style={{ color: accentColor }}>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer and Interactive Trigger */}
      <div className="flex-shrink-0">
        {isExpired ? (
          <button
            disabled
            className="checkout-btn-base checkout-btn-expired"
          >
            EXPIRED - RETURN TO RADAR
          </button>
        ) : transmissionStatus === "authorized" && checkoutUrl ? (
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem(`tx_id:${happening.id}`);
                localStorage.removeItem(`tx_status:${happening.id}`);
                localStorage.removeItem(`tx_url:${happening.id}`);
              }
              window.location.href = checkoutUrl;
            }}
            className="checkout-btn-base checkout-btn-emerald"
          >
            PROCEED TO SECURE CHECKOUT
          </button>
        ) : transmissionStatus === "sent" ? (
          <button
            disabled
            className="checkout-btn-base checkout-btn-disabled"
          >
            TRANSMISSION SECURED - AWAITING CLEARANCE
          </button>
        ) : transmissionStatus === "sending" ? (
          <button
            disabled
            className="checkout-btn-base checkout-btn-disabled"
          >
            ENCRYPTING PAYLOAD...
          </button>
        ) : happening.type === "private" || happening.category.toLowerCase().includes("private") ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="checkout-btn-base checkout-btn-amber"
          >
            REQUEST SECURE INVITE
          </button>
        ) : (
          <button
            onClick={handlePayRedirect}
            className="checkout-btn-base checkout-btn-emerald"
          >
            PROCEED TO SECURE CHECKOUT
          </button>
        )}

        <p className="checkout-footer-disclosure">
          GATE_ENCRYPTED: Seat hold valid until expiration. Tapping checkout directs you to merchant billing portal.
        </p>
      </div>

      <RequestInviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        happeningTitle={happening.title}
        onSubmit={async (data) => {
          updateStatus("sending");
          try {
            const res = await fetch("/api/request-invite", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                happeningId: happening.id,
                happeningTitle: happening.title,
                partySize: data.partySize,
                note: data.note,
                placeId: placeId || "new-orleans-la",
                price: basePrice
              }),
            });

            if (res.ok) {
              const payload = await res.json();
              updateStatus("sent", payload.transmissionId);
            } else {
              updateStatus("idle");
              alert("Transmission failed. Please retry.");
            }
          } catch (e) {
            console.error(e);
            updateStatus("idle");
            alert("Transmission failed. Connection error.");
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
