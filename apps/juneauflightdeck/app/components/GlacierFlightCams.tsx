"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export interface WeatherCamFeed {
  siteId: number;
  siteName: string;
  icao: string | null;
  corridor: string;
  cameraId: number;
  direction: string;
  bearing: number;
  imageUrl: string;
  capturedAt: string;
  dispatchUtility: string;
  vfrThresholdNotes: string;
}

interface ApiResponse {
  source: string;
  jurisdiction: string;
  regulation: string;
  updatedAt: string;
  feeds: WeatherCamFeed[];
}

export default function GlacierFlightCams() {
  const [feeds, setFeeds] = useState<WeatherCamFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState(180);
  const [error, setError] = useState<string | null>(null);

  const fetchCams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/faa-cams?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      if (data.feeds && data.feeds.length > 0) {
        setFeeds(data.feeds);
      }
      setLastRefreshed(new Date());
      setNextRefreshCountdown(180);
    } catch (err: unknown) {
      console.warn("FAA Cam fetch failed, keeping existing state:", err);
      setError("FAA camera network connection slow. Showing cached FAA stream.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCams();
    const interval = setInterval(() => {
      setNextRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchCams();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchCams]);

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin <= 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      return `${Math.round(diffMin / 60)}h ago`;
    } catch {
      return "Recent";
    }
  };

  return (
    <div
      id="live-cams"
      style={{
        background: "linear-gradient(135deg, rgba(8, 23, 38, 0.95) 0%, rgba(4, 14, 24, 0.98) 100%)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: "28px 24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        color: "var(--text)",
        maxWidth: 1100,
        margin: "32px auto",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          paddingBottom: 20,
          borderBottom: "1px solid var(--line)",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "3px 10px",
                borderRadius: 6,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#34d399",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
              Live FAA WeatherCams
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--muted)",
                fontFamily: "monospace",
              }}
            >
              FAA Part 135 VFR Corridor
            </span>
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "clamp(1.25rem, 3vw, 1.65rem)",
              fontWeight: 900,
              letterSpacing: "-0.01em",
              color: "#fff",
            }}
          >
            Juneau Icefield Flight Path Aviation Cams
          </h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)", maxWidth: 680 }}>
            Real-time visual feeds from FAA WeatherCam towers along helicopter tour corridors to Mendenhall Glacier,
            Herbert Glacier, and the Gastineau Channel climb-out.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", fontSize: "0.72rem", color: "var(--muted)" }}>
              {lastRefreshed ? `Refreshed ${lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Connecting..."}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#93c5fd", fontFamily: "monospace" }}>
              Next sync: {nextRefreshCountdown}s
            </span>
          </div>

          <button
            onClick={fetchCams}
            disabled={loading}
            style={{
              background: "rgba(15, 30, 48, 0.9)",
              border: "1px solid rgba(158, 217, 255, 0.3)",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Syncing..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {/* Pilot Dispatch Reality Box */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(20, 35, 55, 0.6) 0%, rgba(10, 25, 40, 0.8) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>🏔️</span>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 800, color: "#e0f2fe" }}>
              Why Helicopter Tours Cancel While Downtown Juneau Is Sunny
            </h4>
            <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.55, color: "#bae6fd" }}>
              Cruise docks sit at sea level, but glacier landing zones sit between <strong>1,800 and 4,000 feet</strong> in alpine granite passes.
              Under <strong>FAA Part 135 Visual Flight Rules (VFR)</strong>, commercial helicopter pilots cannot legally fly into clouds and must maintain at least <strong>1,000 feet of clearance beneath cloud ceilings</strong> with 3 miles of forward visibility.
              If coastal marine clouds hang low on Pedersen Hill or Mount Roberts, dispatch halts glacier flights even if the harbor is bathed in sunlight.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#fca5a5",
            fontSize: "0.82rem",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* Camera Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {feeds.map((feed) => (
          <div
            key={feed.cameraId}
            style={{
              background: "rgba(4, 18, 30, 0.9)",
              border: "1px solid rgba(158, 217, 255, 0.18)",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Camera Metadata Header */}
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(10, 28, 46, 0.8)",
                borderBottom: "1px solid rgba(158, 217, 255, 0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {feed.siteName}
                </h3>
                <span style={{ fontSize: "0.74rem", color: "#93c5fd" }}>{feed.corridor}</span>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "rgba(30, 58, 138, 0.4)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  color: "#bfdbfe",
                }}
              >
                Cam #{feed.cameraId}
              </span>
            </div>

            {/* Live Image Frame */}
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%", // 16:9 Aspect Ratio
                backgroundColor: "#030d17",
                overflow: "hidden",
              }}
            >
              <img
                src={`/api/faa-image?url=${encodeURIComponent(feed.imageUrl)}`}
                alt={`FAA WeatherCam - ${feed.siteName} (${feed.direction})`}
                loading="lazy"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {/* Bearing Overlay Badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 8,
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>🧭 {feed.direction} ({feed.bearing}°)</span>
              </div>

              {/* Timestamp Overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  color: "#cbd5e1",
                }}
              >
                {formatTimeAgo(feed.capturedAt)}
              </div>
            </div>

            {/* Dispatch Rationale & Safety Threshold */}
            <div style={{ padding: "14px 16px", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#94a3b8",
                    marginBottom: 4,
                  }}
                >
                  Dispatcher Utility
                </span>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--muted)" }}>
                  {feed.dispatchUtility}
                </p>
              </div>

              <div
                style={{
                  padding: "8px 10px",
                  background: "rgba(2, 12, 22, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                  borderRadius: 6,
                }}
              >
                <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#a5b4fc" }}>
                  Regulatory VFR Trigger:
                </span>
                <span style={{ fontSize: "0.74rem", color: "#94a3b8", lineHeight: 1.4 }}>
                  {feed.vfrThresholdNotes}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Decision Lane */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          paddingTop: 16,
          borderTop: "1px solid var(--line)",
        }}
      >
        <div>
          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)" }}>
            Seeing low clouds or weather holds on these cameras?
          </span>
          <strong style={{ fontSize: "0.85rem", color: "#fff" }}>
            Check afternoon clearing slots or cross-port backup routes.
          </strong>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/helicopter-waitlist"
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#fff",
              textDecoration: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: "0.84rem",
              fontWeight: 800,
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
            }}
          >
            Check Released Slots &rarr;
          </Link>

          <Link
            href="/tools#backup-router"
            style={{
              background: "rgba(15, 30, 48, 0.8)",
              border: "1px solid rgba(158, 217, 255, 0.3)",
              color: "#93c5fd",
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: "0.84rem",
              fontWeight: 700,
            }}
          >
            Inside Passage Backups
          </Link>
        </div>
      </div>
    </div>
  );
}
