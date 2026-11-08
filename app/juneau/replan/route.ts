import { NextResponse } from "next/server";
import {
  evaluateLowBandwidthJuneauPlanAsync,
  JUNEAU_LOW_BW_OFFLINE_STORAGE_KEY,
  parseLowBandwidthJuneauInput,
  type LowBandwidthJuneauBerth,
} from "@/lib/dcc/lowBandwidthJuneauReplan";

export const dynamic = "force-dynamic";

const BERTH_OPTIONS: Array<{ value: LowBandwidthJuneauBerth; label: string }> = [
  { value: "CT", label: "CT — Cruise Ship Terminal (Downtown, 60m buffer)" },
  { value: "FKL", label: "FKL — South Franklin Dock (60m buffer)" },
  { value: "AS", label: "AS — Alaska Steamship Dock (Downtown, 60m buffer)" },
  { value: "ACT", label: "ACT — Alaska Cruise Terminal (90m shuttle buffer)" },
  { value: "AJ", label: "AJ — AJ Dock (90m shuttle buffer)" },
  { value: "TENDER", label: "TENDER — Anchor / Tender (90m tender buffer)" },
  { value: "UNKNOWN", label: "UNKNOWN — Unconfirmed Berth (Confirm ship timing)" },
];

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = parseLowBandwidthJuneauInput(url.searchParams);
  const plan = await evaluateLowBandwidthJuneauPlanAsync(input);
  const failedOptionId = url.searchParams.get("failed_option_id")?.trim() || null;
  const filterFitsOnly = url.searchParams.get("filter") === "fits_only";

  const checkedTimeDisplay = new Date(plan.checkedAtIso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Juneau",
  });

  const serializedSnapshot = JSON.stringify({
    checkedAtIso: plan.checkedAtIso,
    checkedTimeDisplay,
    input: plan.input,
    summaryHeadline: plan.summaryHeadline,
    summaryDetail: plan.summaryDetail,
    primaryHandoffHref: plan.primaryHandoffHref,
    primaryHandoffLabel: plan.primaryHandoffLabel,
  }).replace(/</g, "\\u003c");

  const berthOptionsHtml = BERTH_OPTIONS.map(
    (b) =>
      `<option value="${esc(b.value)}"${plan.input.berth === b.value ? " selected" : ""}>${esc(b.label)}</option>`,
  ).join("");

  const rowsHtml = plan.options
    .map((opt) => {
      const badgeClass = opt.deprioritizedByFlightCancel
        ? "badge-amber"
        : opt.timing.status === "FITS_CRUISE_WINDOW"
          ? "badge-green"
          : opt.timing.status === "CONFIRM_SHIP_TIMING"
            ? "badge-sky"
            : "badge-rose";

      const statusText = opt.deprioritizedByFlightCancel
        ? "Paused (Flight Canceled Pivot)"
        : opt.timing.statusBadgeLabel;

      const ctaClass = opt.flightDeckHandoffAllowed ? "cta-fit" : "cta-fail";
      const rowHighlight =
        filterFitsOnly && opt.fitsNow
          ? ' class="row-fit-highlight"'
          : failedOptionId === opt.optionId || failedOptionId === opt.engineOptionId
            ? ' class="row-failed-highlight"'
            : "";

      const fallbackHtml =
        !opt.fitsNow && opt.tripVerdictBeforeCheckout.whenNoOfferFitsFallback
          ? `<div class="opt-subnote" data-testid="replan-no-fit-fallback-${esc(opt.optionId)}"><strong>Alt:</strong> ${esc(opt.tripVerdictBeforeCheckout.whenNoOfferFitsFallback.verifiedFittingAlternative?.summary ?? "Downtown walk-off zone")}<br/><strong>Check:</strong> ${esc(opt.tripVerdictBeforeCheckout.whenNoOfferFitsFallback.exactDetailToVerify)}</div>`
          : "";

      return `<tr${rowHighlight} data-testid="replan-row-${esc(opt.optionId)}" data-engine-option-id="${esc(opt.engineOptionId)}" data-fits-now="${opt.fitsNow ? "true" : "false"}">
        <td>
          <div class="opt-title">${esc(opt.title)}</div>
          <div class="opt-meta">${esc(opt.categoryLabel)} · ${esc(opt.durationLabel)} · ${esc(opt.priceFromLabel)}</div>
          <div class="opt-subnote mono" data-testid="replan-verdict-math-${esc(opt.optionId)}"><strong>Verdict Math:</strong> ${esc(opt.tripVerdictBeforeCheckout.stepByStepMath.equationSummary)}</div>
        </td>
        <td>
          <span class="badge ${badgeClass}">${esc(statusText)}</span>
          <span class="badge badge-sky" data-testid="replan-seat-badge-${esc(opt.optionId)}">${esc(opt.tripVerdictBeforeCheckout.seatAvailabilityBadge.label)}</span>
          <div class="opt-reason">${esc(opt.timing.reason)}</div>
          ${fallbackHtml}
        </td>
        <td class="mono">
          <div>Earliest check-in: <strong>${esc(opt.timing.earliestCheckInLocal || "Confirm")}</strong></div>
          <div>Est. gangway return: <strong>${esc(opt.timing.estimatedGangwayReturnLocal || "Confirm")}</strong></div>
          <div>All-aboard cutoff: <strong>${esc(opt.timing.confirmedAllAboardLocal || "Unconfirmed")}</strong></div>
        </td>
        <td>
          <div>Required DCC buffer: <strong>${esc(opt.timing.dccBufferMinutes)} min</strong></div>
          <div class="opt-meta">${esc(opt.weatherResilienceLabel)}</div>
        </td>
        <td>
          <a href="${esc(opt.allowedNextStepHref)}"
             data-testid="replan-handoff-${esc(opt.optionId)}"
             data-allowed-next-step="${esc(opt.allowedNextStepType)}"
             ${opt.flightDeckHandoffAllowed ? 'data-dcc-requires-connection="true"' : ""}
             class="cta-btn ${ctaClass}">${esc(opt.allowedNextStepLabel)}</a>
          <div class="opt-subnote">${
            opt.flightDeckHandoffAllowed
              ? "Carries ship, arrival, all-aboard &amp; party size"
              : "Preserves ship, arrival, all-aboard &amp; berth"
          }</div>
        </td>
      </tr>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Juneau Low-Bandwidth Cruise Replan | Destination Command Center</title>
  <meta name="description" content="Text-first Juneau port-call replan tool for weak ship Wi-Fi (< 50 KB cold first load including CSS & JS). Update arrival, all-aboard, or canceled flight status and see what still fits." />
  <link rel="canonical" href="https://destinationcommandcenter.com/juneau/replan" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #070b12; color: #f4f4f5; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.45; }
    a { color: #67e8f9; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .wrap { max-width: 960px; margin: 0 auto; padding: 16px; }
    .top-nav { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 14px; font-size: 12px; color: #cbd5e1; }
    .card { border: 1px solid rgba(255,255,255,0.14); background: #0f172a; border-radius: 14px; padding: 16px; }
    .subcard { border: 1px solid rgba(255,255,255,0.1); background: rgba(2,6,23,0.65); border-radius: 10px; padding: 12px; margin-bottom: 12px; font-size: 12px; }
    .recheck-card { border: 1px solid rgba(34,211,238,0.35); background: rgba(8,51,68,0.28); border-radius: 10px; padding: 12px; margin-bottom: 12px; font-size: 12px; }
    .alert-amber { border: 1px solid rgba(251,191,36,0.45); background: rgba(120,53,15,0.3); color: #fef3c7; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px; }
    .kicker { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #67e8f9; }
    h1 { margin: 4px 0 6px; font-size: 20px; color: #fff; }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .grid-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .field label { display: block; font-size: 11px; font-weight: 600; color: #d4d4d8; margin-bottom: 4px; }
    .field input[type="text"], .field input[type="date"], .field input[type="time"], .field input[type="number"], .field select {
      width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: #020617; color: #fff; padding: 6px 8px; font-size: 12px;
    }
    .btn-primary { border: 0; border-radius: 8px; background: #22d3ee; color: #020617; font-weight: 700; font-size: 12px; padding: 8px 14px; cursor: pointer; }
    .btn-emerald { display: inline-block; border-radius: 10px; background: #34d399; color: #020617; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; padding: 9px 14px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    th { border-bottom: 1px solid rgba(255,255,255,0.16); padding: 8px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; }
    td { border-bottom: 1px solid rgba(255,255,255,0.08); padding: 10px 8px; vertical-align: top; }
    .row-fit-highlight { background: rgba(16,185,129,0.08); }
    .row-failed-highlight { background: rgba(244,63,94,0.08); }
    .opt-title { font-weight: 700; color: #fff; }
    .opt-meta { font-size: 11px; color: #a1a1aa; margin-top: 2px; }
    .opt-reason { font-size: 11px; color: #d4d4d8; margin-top: 4px; }
    .opt-subnote { font-size: 10px; color: #a1a1aa; margin-top: 4px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; }
    .badge { display: inline-block; border-radius: 5px; padding: 2px 6px; font-size: 11px; font-weight: 700; border: 1px solid transparent; }
    .badge-green { border-color: rgba(52,211,153,0.45); background: rgba(16,185,129,0.16); color: #a7f3d0; }
    .badge-amber { border-color: rgba(251,191,36,0.45); background: rgba(245,158,11,0.16); color: #fde68a; }
    .badge-sky { border-color: rgba(56,189,248,0.45); background: rgba(14,165,233,0.16); color: #bae6fd; }
    .badge-rose { border-color: rgba(251,113,133,0.45); background: rgba(244,63,94,0.16); color: #fecdd3; }
    .cta-btn { display: inline-block; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 700; text-decoration: none; }
    .cta-fit { border: 1px solid rgba(103,232,249,0.45); background: rgba(6,182,212,0.18); color: #cffafe; }
    .cta-fail { border: 1px solid rgba(251,191,36,0.5); background: rgba(245,158,11,0.2); color: #fef3c7; }
    footer { margin-top: 14px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); border-radius: 10px; padding: 10px 12px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <main class="wrap">
    <nav class="top-nav">
      <div>
        <a href="/juneau">&larr; Full Juneau Port Guide</a>
        <span style="margin:0 6px;color:#475569;">|</span>
        <span style="color:#67e8f9;font-weight:700;">Ultra-Light Ship Wi-Fi Replan (&lt; 50 KB Cold First Load)</span>
      </div>
      <div class="mono" style="color:#94a3b8;">Engine: evaluateJuneauPortDayScenario · Zero external JS/CSS chunks</div>
    </nav>

    <section class="card" data-testid="dcc-juneau-low-bw-replan" data-compressed-target-bytes="${plan.compressedTargetBytes}">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:8px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;margin-bottom:12px;">
        <div>
          <div class="kicker">Juneau Cruise Port — Low-Bandwidth Replan View (&lt; 50 KB Target)</div>
          <h1>Update Ship Arrival or All-Aboard Time on Weak Wi-Fi</h1>
          <p style="margin:0;font-size:12px;color:#d4d4d8;">Text-first decision engine powered by <code>evaluateJuneauPortDayScenario</code>. Recomputes gangway buffers and carries your trip details to Juneau Flight Deck when an option fits.</p>
        </div>
        <div class="mono" style="font-size:11px;color:#d4d4d8;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:6px 10px;">
          Checked: <strong data-testid="dcc-replan-checked-at">${esc(checkedTimeDisplay)} AKDT</strong>
        </div>
      </div>

      ${
        failedOptionId || filterFitsOnly
          ? `<div class="alert-amber" data-testid="dcc-replan-filtered-fit-notice">
              <strong>Filtered to options that fit your port window:</strong> Your trip details (${esc(plan.input.ship)}, ${esc(plan.input.date)}, arrival ${esc(plan.input.arrivalTime)}, all-aboard ${esc(plan.input.allAboardTime || "Unconfirmed")}, Berth ${esc(plan.input.berth)}, party of ${plan.input.partySize}) are preserved below.${failedOptionId ? ` Selected option <code>${esc(failedOptionId)}</code> did not clear your ship's return buffer.` : ""}
            </div>`
          : ""
      }

      <div id="dcc-juneau-offline-banner" class="alert-amber" style="display:none;" role="status" aria-live="polite">
        <div style="font-weight:700;">Offline Mode — Showing Last Saved Plan (<span id="dcc-offline-saved-time">${esc(checkedTimeDisplay)}</span>)</div>
        <div style="margin-top:2px;">${esc(plan.offlinePolicyNote)}</div>
      </div>

      <div class="recheck-card" data-testid="juneau-replan-compact-card">
        <div class="kicker" style="margin-bottom:8px;">Shared Trip Recheck Summary (Identical Across Web, Low-BW &amp; Agent API)</div>
        <div class="grid-3">
          <div class="subcard" style="margin:0;">
            <div style="font-size:10px;text-transform:uppercase;color:#94a3b8;font-weight:700;">1. What Changed</div>
            <div style="margin-top:4px;color:#f1f5f9;">${esc(plan.recheckCard.whatChanged)}</div>
          </div>
          <div class="subcard" style="margin:0;">
            <div style="font-size:10px;text-transform:uppercase;color:#6ee7b7;font-weight:700;">2. What Still Fits</div>
            <div style="margin-top:4px;color:#f1f5f9;">${esc(plan.recheckCard.whatStillFits)}</div>
          </div>
          <div class="subcard" style="margin:0;">
            <div style="font-size:10px;text-transform:uppercase;color:#67e8f9;font-weight:700;">3. Next Step</div>
            <div style="margin-top:4px;color:#f1f5f9;">${esc(plan.recheckCard.nextStep)}</div>
          </div>
        </div>
      </div>

      <div class="subcard" data-testid="juneau-replan-tide-panel">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;">
          <div><strong>NOAA CO-OPS Station ${esc(plan.tides.stationId)}</strong> (${esc(plan.tides.stationName)}) · Datum: <strong>${esc(plan.tides.datum)}</strong> · Date: <strong>${esc(plan.tides.requestedDate)}</strong></div>
          <span class="mono" style="font-size:11px;color:#67e8f9;">${plan.tides.status === "noaa_timeout_unavailable" ? "Tide Feed Degraded (Time-Fit Unaffected)" : "Predictions Active (lst_ldt)"}</span>
        </div>
        <div style="margin-top:4px;color:#cbd5e1;"><strong>High Tides:</strong> ${esc(plan.tides.predictedHighLow.filter((p) => p.type === "H").map((p) => `${p.time.slice(-5)} (${p.heightFt.toFixed(1)} ft)`).join(", ") || "Pending")} · <strong>Low Tides:</strong> ${esc(plan.tides.predictedHighLow.filter((p) => p.type === "L").map((p) => `${p.time.slice(-5)} (${p.heightFt.toFixed(1)} ft)`).join(", ") || "Pending")}</div>
        <div style="margin-top:2px;font-size:11px;color:#94a3b8;">${esc(plan.tides.tideSummaryText)} · <em>PAJN weather is context only; operator is source for flight holds, dispatch, and seats.</em></div>
      </div>

      <form method="GET" action="/juneau/replan" class="subcard">
        <div class="grid-form">
          <div class="field">
            <label for="replan-ship">Cruise Ship</label>
            <input id="replan-ship" name="ship" type="text" value="${esc(plan.input.ship)}" />
          </div>
          <div class="field">
            <label for="replan-date">Port Date</label>
            <input id="replan-date" name="date" type="date" value="${esc(plan.input.date)}" />
          </div>
          <div class="field">
            <label for="replan-arrival">Ship Arrival (Local)</label>
            <input id="replan-arrival" name="arrival" type="time" value="${esc(plan.input.arrivalTime)}" />
          </div>
          <div class="field">
            <label for="replan-all-aboard">All-Aboard Cutoff</label>
            <input id="replan-all-aboard" name="all_aboard" type="time" value="${esc(plan.input.allAboardTime || "")}" />
          </div>
          <div class="field">
            <label for="replan-berth">Assigned Berth / Dock</label>
            <select id="replan-berth" name="berth">${berthOptionsHtml}</select>
          </div>
          <div class="field">
            <label for="replan-party">Party Size</label>
            <input id="replan-party" name="party_size" type="number" min="1" max="24" value="${plan.input.partySize}" />
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;">
          <label style="font-size:12px;color:#fcd34d;cursor:pointer;">
            <input type="checkbox" name="flight_canceled" value="1"${plan.input.flightCanceled ? " checked" : ""} />
            My helicopter glacier flight was canceled by weather — prioritize surface whale &amp; Mendenhall backups
          </label>
          <div style="display:flex;gap:8px;align-items:center;">
            <button type="submit" class="btn-primary">Recalculate What Fits</button>
            <a href="/juneau/replan" style="font-size:11px;color:#94a3b8;">Reset</a>
          </div>
        </div>
      </form>

      <div class="subcard" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;">
        <div>
          <div style="font-weight:700;color:#fff;font-size:14px;" data-testid="dcc-juneau-replan-headline">${esc(plan.summaryHeadline)}</div>
          <div style="color:#d4d4d8;margin-top:2px;">${esc(plan.summaryDetail)}</div>
        </div>
        <a href="${esc(plan.primaryHandoffHref)}" data-testid="dcc-juneau-replan-primary-handoff" data-dcc-requires-connection="true" class="btn-emerald">${esc(plan.primaryHandoffLabel)}</a>
      </div>

      <div id="fitting-options" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Excursion / Backup Option</th>
              <th>Cruise Window Fit</th>
              <th>Check-In &amp; Gangway Return</th>
              <th>Buffer &amp; Weather Rule</th>
              <th>Next Step</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </section>

    <footer>
      <strong>Offline &amp; Bandwidth Guarantee:</strong> This route saves your latest evaluated Juneau plan to <code>localStorage["${JUNEAU_LOW_BW_OFFLINE_STORAGE_KEY}"]</code> so you can review gangway cutoffs and what fits when ship Wi-Fi drops. Live availability and booking on Juneau Flight Deck require an active connection.
    </footer>
  </main>

  <script id="dcc-juneau-replan-offline-script">
    (function(){
      var KEY = ${JSON.stringify(JUNEAU_LOW_BW_OFFLINE_STORAGE_KEY)};
      var currentSnap = ${serializedSnapshot};
      try { localStorage.setItem(KEY, JSON.stringify(currentSnap)); } catch (e) {}
      function syncConn() {
        var b = document.getElementById("dcc-juneau-offline-banner");
        var t = document.getElementById("dcc-offline-saved-time");
        var links = document.querySelectorAll("[data-dcc-requires-connection='true']");
        var offline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (b) b.style.display = offline ? "block" : "none";
        if (offline && t) {
          try {
            var raw = localStorage.getItem(KEY);
            if (raw) {
              var parsed = JSON.parse(raw);
              if (parsed && parsed.checkedTimeDisplay) t.textContent = parsed.checkedTimeDisplay;
            }
          } catch (e) {}
        }
        for (var i = 0; i < links.length; i++) {
          var el = links[i];
          if (offline) {
            el.setAttribute("aria-disabled", "true");
            el.style.opacity = "0.55";
            el.title = "Updated availability and booking require an active connection.";
          } else {
            el.removeAttribute("aria-disabled");
            el.style.opacity = "1";
            el.title = "";
          }
        }
      }
      window.addEventListener("online", syncConn);
      window.addEventListener("offline", syncConn);
      syncConn();
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      "x-dcc-cold-first-load-budget": "under-50kb-html-css-js",
    },
  });
}
