import React from "react";
import type {
  PortfolioAssuranceSummary,
  PortfolioCarriedContext,
} from "@/lib/dcc/commerce/portfolio";

export interface PortfolioHandoffAction {
  label: string;
  href: string;
  providerLabel: string;
  accountLabel: string;
}

export interface PortfolioCrossSiteLink {
  label: string;
  href: string;
}

export interface PortfolioAssuranceBannerProps {
  siteDomain: string;
  assurance: PortfolioAssuranceSummary;
  carriedContext?: PortfolioCarriedContext;
  handoffActions: PortfolioHandoffAction[];
  crossSiteLinks?: PortfolioCrossSiteLink[];
}

export function PortfolioAssuranceBanner({
  siteDomain,
  assurance,
  carriedContext,
  handoffActions,
  crossSiteLinks = [],
}: PortfolioAssuranceBannerProps) {
  const ctxPayload = carriedContext?.payload || {};
  const hasCarriedDetails = Boolean(
    carriedContext?.contextId ||
      ctxPayload.date ||
      ctxPayload.partySize ||
      ctxPayload.shipSlug ||
      ctxPayload.portSlug,
  );

  return (
    <section
      aria-label="DCC Decision Assurance & Attribution Disclosure"
      data-dcc-assurance-banner="true"
      data-dcc-site={siteDomain}
      data-dcc-engine-id={assurance.engineId}
      data-dcc-classification={assurance.primaryClassification}
      data-dcc-receipt-id={assurance.receiptId}
      data-dcc-evaluation-run-id={assurance.evaluationRunId}
      data-dcc-context-id={carriedContext?.contextId || ""}
      style={{
        maxWidth: 1120,
        margin: "20px auto",
        padding: "18px 22px",
        borderRadius: 14,
        background: "#0b1724",
        border: "1px solid rgba(148, 163, 184, 0.28)",
        color: "#e2e8f0",
        fontSize: "0.85rem",
        lineHeight: 1.55,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "rgba(56, 189, 248, 0.16)",
              color: "#7dd3fc",
              border: "1px solid rgba(56, 189, 248, 0.35)",
            }}
          >
            DCC v0.3 Classification: {assurance.primaryClassification.toUpperCase()}
          </span>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            Engine: <code>{assurance.engineId}@{assurance.engineVersion}</code>
          </span>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            · Isolated from commercial commission &amp; routing priority
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, fontSize: "0.76rem" }}>
          <a
            href={assurance.receiptVerifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600 }}
          >
            Inspect Decision Engine ({assurance.engineId}) ↗
          </a>
        </div>
      </div>

      {/* Unresolved Requirements & Honest Availability Policy */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(15, 23, 42, 0.75)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700, color: "#f8fafc", marginBottom: 4, fontSize: "0.8rem" }}>
          Evidence-Bounded Classification &amp; Unresolved Requirements:
        </div>
        <ul style={{ margin: "0 0 6px 18px", padding: 0, color: "#cbd5e1", fontSize: "0.8rem" }}>
          {assurance.unresolvedRequirements.map((req, idx) => (
            <li key={idx}>{req}</li>
          ))}
        </ul>
        <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
          {assurance.availabilityClaimPolicy}
        </div>
      </div>

      {/* Carried Trip Context */}
      {hasCarriedDetails && (
        <div
          data-dcc-carried-context="true"
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            marginBottom: 12,
            fontSize: "0.79rem",
            color: "#d1fae5",
          }}
        >
          <strong>Carried Trip Context:</strong>{" "}
          {carriedContext?.contextId && (
            <span>
              Opaque Ref <code>{carriedContext.contextId}</code>{" "}
              (Trip Context: {carriedContext.tripContextState || "active"} · Short-Lived Redemption Token:{" "}
              {carriedContext.redemptionTokenState || "active"}){" "}
            </span>
          )}
          {ctxPayload.date && <span>· Intended Date: <strong>{ctxPayload.date}</strong> </span>}
          {ctxPayload.partySize && <span>· Party Size: <strong>{ctxPayload.partySize}</strong> </span>}
          {ctxPayload.shipSlug && <span>· Ship: <strong>{ctxPayload.shipSlug}</strong> </span>}
          {ctxPayload.portSlug && <span>· Port: <strong>{ctxPayload.portSlug}</strong> </span>}
        </div>
      )}

      {/* Outbound Commercial Handoff Links & Cross-Site Context Links */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {handoffActions.map((action, idx) => (
            <a
              key={idx}
              href={action.href}
              data-dcc-handoff-link="true"
              data-dcc-provider={action.providerLabel}
              data-dcc-account={action.accountLabel}
              target="_blank"
              rel="sponsored noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: 8,
                background: "#0284c7",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.78rem",
                textDecoration: "none",
              }}
            >
              <span>{action.label}</span>
              <span style={{ opacity: 0.85, fontSize: "0.7rem" }}>
                ({action.providerLabel} · {action.accountLabel})
              </span>
            </a>
          ))}
        </div>

        {crossSiteLinks.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, fontSize: "0.76rem" }}>
            {crossSiteLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                data-dcc-cross-site-link="true"
                style={{ color: "#93c5fd", textDecoration: "underline", fontWeight: 600 }}
              >
                {link.label} →
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PortfolioAssuranceBanner;
