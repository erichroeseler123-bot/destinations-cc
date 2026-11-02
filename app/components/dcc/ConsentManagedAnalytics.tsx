"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

export type DccConsentState = "unset" | "accepted" | "declined";

export const DCC_CONSENT_STORAGE_KEY = "dcc_cookie_consent";
export const DCC_CONSENT_COOKIE_NAME = "dcc_cookie_consent";

export function readStoredDccConsent(): DccConsentState {
  if (typeof window === "undefined") return "unset";
  try {
    const stored = window.localStorage.getItem(DCC_CONSENT_STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") {
      return stored;
    }
    const cookieMatch = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${DCC_CONSENT_COOKIE_NAME}=(accepted|declined)(?:;|$)`)
    );
    if (cookieMatch && (cookieMatch[1] === "accepted" || cookieMatch[1] === "declined")) {
      return cookieMatch[1];
    }
  } catch {
    // Ignore storage access errors in restricted browsing modes
  }
  return "unset";
}

export function writeStoredDccConsent(nextState: "accepted" | "declined"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DCC_CONSENT_STORAGE_KEY, nextState);
    const maxAge = 60 * 60 * 24 * 180; // 180 days
    document.cookie = `${DCC_CONSENT_COOKIE_NAME}=${nextState}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("dcc-consent-change", { detail: nextState }));
  } catch {
    // Ignore storage errors
  }
}

export default function ConsentManagedAnalytics({
  gaMeasurementId,
  gygPartnerId,
}: {
  gaMeasurementId: string;
  gygPartnerId?: string;
}) {
  const [consent, setConsent] = useState<DccConsentState>("unset");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(readStoredDccConsent());
    setHydrated(true);

    const handleConsentEvent = (event: Event) => {
      const custom = event as CustomEvent<DccConsentState>;
      if (custom.detail === "accepted" || custom.detail === "declined") {
        setConsent(custom.detail);
      } else {
        setConsent(readStoredDccConsent());
      }
    };

    window.addEventListener("dcc-consent-change", handleConsentEvent);
    return () => window.removeEventListener("dcc-consent-change", handleConsentEvent);
  }, []);

  const handleAccept = () => {
    writeStoredDccConsent("accepted");
    setConsent("accepted");
  };

  const handleDecline = () => {
    writeStoredDccConsent("declined");
    setConsent("declined");
  };

  return (
    <>
      {hydrated && consent === "accepted" ? (
        <>
          <Script
            id="dcc-ga-gtag"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="dcc-ga-init"
            src={`/ga-init.js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          {gygPartnerId ? (
            <Script
              id="getyourguide-partner-analytics"
              src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
              strategy="afterInteractive"
              async
              defer
              data-gyg-partner-id={gygPartnerId}
            />
          ) : null}
        </>
      ) : null}

      {hydrated && consent === "unset" ? (
        <aside
          role="region"
          aria-label="Cookie and analytics consent"
          data-dcc-consent-banner="true"
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "1rem",
            right: "1rem",
            maxWidth: "46rem",
            margin: "0 auto",
            zIndex: 9999,
            background: "rgba(15, 20, 28, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
            color: "#f4f4f5",
            fontSize: "0.85rem",
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ margin: 0, color: "#d4d4d8" }}>
              <strong style={{ color: "#ffffff" }}>Privacy &amp; Analytics Controls:</strong>{" "}
              Destination Command Center keeps optional analytics (Google Analytics) and partner attribution scripts disabled until you opt in. Read our{" "}
              <Link href="/privacy" style={{ color: "#67e8f9", textDecoration: "underline" }}>
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/affiliate-disclosure"
                style={{ color: "#67e8f9", textDecoration: "underline" }}
              >
                Affiliate &amp; Portfolio Disclosure
              </Link>
              .
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handleDecline}
                data-consent-action="decline"
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.24)",
                  background: "transparent",
                  color: "#f4f4f5",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Essential Only (Decline)
              </button>
              <button
                type="button"
                onClick={handleAccept}
                data-consent-action="accept"
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(103, 232, 249, 0.5)",
                  background: "rgba(8, 145, 178, 0.35)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Accept Analytics &amp; Partner Cookies
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
