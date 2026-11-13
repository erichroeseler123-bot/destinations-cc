import { NextResponse } from "next/server";
import {
  buildJourneyCorsHeaders,
  buildPortReplanEvaluation,
  CANONICAL_CRUISE_LEAD_RULE,
  CANONICAL_CRUISE_RETURN_BUFFER_MINUTES,
  resolveCanonicalCruisePortForJourney,
  sanitizeJourneyId,
  sanitizeShareCode,
} from "@/lib/dcc/cruiseJourneyIntelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildJourneyCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const wantsJson =
    url.searchParams.get("format")?.trim().toLowerCase() === "json" ||
    request.headers.get("accept")?.includes("application/json");
  const corsHeaders = buildJourneyCorsHeaders(request.headers.get("origin"));

  const resolvedPort = resolveCanonicalCruisePortForJourney(slug);
  if (!resolvedPort) {
    if (wantsJson && url.searchParams.get("format")?.trim().toLowerCase() === "json") {
      return NextResponse.json(
        {
          ok: false,
          error: "unknown_cruise_port",
          message: "Requested cruise port slug is not in DCC's canonical port directory.",
        },
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Cache-Control": "no-store",
          },
        },
      );
    }
    const notFoundHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Cruise Port Not Found | Destination Command Center</title>
  <style>body{margin:0;background:#070b12;color:#f4f4f5;font-family:system-ui,sans-serif;padding:24px}a{color:#67e8f9}</style>
</head>
<body>
  <main style="max-width:640px;margin:0 auto;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:20px;background:#0f172a">
    <h1 style="margin-top:0;font-size:20px">Cruise Port Not Found (404)</h1>
    <p style="font-size:14px;color:#cbd5e1">This port slug is not in the Destination Command Center canonical cruise port directory.</p>
    <p style="font-size:14px"><a href="/ports">&larr; Browse Canonical Cruise Ports Directory</a></p>
  </main>
</body>
</html>`;
    return new NextResponse(notFoundHtml, {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  const evaluation = await buildPortReplanEvaluation({
    port: resolvedPort,
    searchParams: url.searchParams,
  });

  if (url.searchParams.get("format")?.trim().toLowerCase() === "json") {
    return NextResponse.json(evaluation, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
        "x-dcc-cold-first-load-budget": "under-50kb-html-css-js",
      },
    });
  }

  const journeyId = sanitizeJourneyId(
    url.searchParams.get("journey_id") || url.searchParams.get("journeyId"),
  );
  const shareCode = sanitizeShareCode(
    url.searchParams.get("shareCode") || url.searchParams.get("share_code"),
  );
  const qaTest = url.searchParams.get("qa_test") === "1";

  const storageKey = `dcc_port_replan_v1_${evaluation.portSlug}`;
  const offlineSnapshotJson = JSON.stringify({
    checkedAtIso: evaluation.checkedAtIso,
    portSlug: evaluation.portSlug,
    portName: evaluation.portName,
    schedule: evaluation.schedule,
    headline: evaluation.backupPlanSummary.headline,
    cruisePromenadeReturnUrl: evaluation.links.cruisePromenadeReturnUrl,
  }).replace(/</g, "\\u003c");

  const excursionsRowsHtml =
    evaluation.matchingExcursionsPreview.length > 0
      ? evaluation.matchingExcursionsPreview
          .map((item) => {
            const isPreferred = item.bufferState === "preferred";
            const isReduced = item.bufferState === "reduced_buffer";
            const badgeClass = isPreferred
              ? "badge-green"
              : isReduced
                ? "badge-amber"
                : "badge-sky";
            const badgeLabel = isPreferred
              ? "2h+ Return Buffer (Matches Schedule)"
              : isReduced
                ? "Reduced Buffer (<120 min)"
                : "Needs Timing Verification";
            const warningHtml = isReduced
              ? `<div class="warn-note">Warning: Returns with less than ${CANONICAL_CRUISE_RETURN_BUFFER_MINUTES} minutes before all-aboard. Confirm gangway/tender queue margins before selecting.</div>`
              : item.bufferState === "needs_verification"
                ? `<div class="warn-note">Timing note: Operator return or ship cutoff requires confirmation against ${esc(evaluation.schedule.allAboardTime)} all-aboard.</div>`
                : "";
            const priceText =
              item.priceFrom !== undefined ? `From $${item.priceFrom.toFixed(0)}` : "Check rate";
            return `<tr data-testid="port-replan-excursion-${esc(item.productCode)}" data-buffer-state="${esc(item.bufferState)}">
              <td>
                <div class="opt-title">${esc(item.title)}</div>
                <div class="opt-meta">${esc(item.productCode)} &middot; ${item.durationMinutes} min &middot; ${esc(priceText)} &middot; ${item.bookingPathType === "direct" ? "Direct Operator" : "Verified Partner"}</div>
                ${warningHtml}
              </td>
              <td><span class="badge ${badgeClass}">${esc(badgeLabel)}</span></td>
              <td><a class="cta-btn" data-dcc-requires-connection="true" href="${esc(evaluation.links.portGuideUrl)}?shipArrival=${encodeURIComponent(evaluation.schedule.arrivalTime)}&amp;allAboard=${encodeURIComponent(evaluation.schedule.allAboardTime)}&amp;date=${encodeURIComponent(evaluation.schedule.portDate)}&amp;partySize=${evaluation.schedule.partySize}${journeyId ? `&amp;journey_id=${encodeURIComponent(journeyId)}` : ""}">View Schedule Fit &rarr;</a></td>
            </tr>`;
          })
          .join("\n")
      : `<tr><td colspan="3" style="color:#cbd5e1">Use the walkable near-pier options below or open the <a href="${esc(evaluation.links.portGuideUrl)}">full ${esc(evaluation.portName)} port guide</a> when ship connectivity improves.</td></tr>`;

  const walkableHtml = evaluation.walkableNearPierOptions
    .map(
      (opt) => `<div class="subcard" style="margin:0">
        <div class="opt-title">${esc(opt.title)}</div>
        <div class="opt-meta">${esc(opt.zone)} &middot; ${esc(opt.roundTripMinutesNote)}</div>
        <div style="margin-top:4px;color:#cbd5e1">${esc(opt.whySafeUnderShortenedWindow)}</div>
      </div>`,
    )
    .join("\n");

  const immediateActionsHtml = evaluation.backupPlanSummary.immediateActions
    .map((step) => `<li>${esc(step)}</li>`)
    .join("");

  const checklistHtml = evaluation.emergencyReturnChecklist
    .map((item) => `<li>${esc(item)}</li>`)
    .join("");

  const dockBadgeText =
    evaluation.dockOrTender === "tender"
      ? "Tender Port (Allow Queue Margin)"
      : evaluation.dockOrTender === "dock"
        ? "Dockside Berth"
        : "Mixed Dock / Tender Port";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(evaluation.portName)} Ship-Wi-Fi Port Replan | Destination Command Center</title>
  <meta name="description" content="Ultra-lightweight (&lt; 50 KB) port-day emergency and schedule-change replan tool for ${esc(evaluation.portName)} with DCC's 120-minute return buffer rule." />
  <link rel="canonical" href="https://destinationcommandcenter.com/ports/${esc(evaluation.portSlug)}/replan" />
  <style>
    :root{color-scheme:dark}*{box-sizing:border-box}
    body{margin:0;background:#070b12;color:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.45}
    a{color:#67e8f9;text-decoration:none}a:hover{text-decoration:underline}
    .wrap{max-width:940px;margin:0 auto;padding:14px}
    .top-nav{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:10px;margin-bottom:12px;font-size:12px;color:#cbd5e1}
    .card{border:1px solid rgba(255,255,255,.14);background:#0f172a;border-radius:14px;padding:15px;margin-bottom:12px}
    .subcard{border:1px solid rgba(255,255,255,.1);background:rgba(2,6,23,.68);border-radius:10px;padding:11px;margin-bottom:10px;font-size:12px}
    .kicker{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#67e8f9}
    h1{margin:4px 0 6px;font-size:20px;color:#fff}
    h2{margin:0 0 6px;font-size:14px;color:#fff}
    .grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
    .grid-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin-bottom:10px}
    .field label{display:block;font-size:11px;font-weight:600;color:#d4d4d8;margin-bottom:3px}
    .field input,.field select{width:100%;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:#020617;color:#fff;padding:6px 8px;font-size:12px}
    .btn-primary{border:0;border-radius:8px;background:#22d3ee;color:#020617;font-weight:700;font-size:12px;padding:8px 13px;cursor:pointer}
    .btn-emerald{display:inline-block;border-radius:9px;background:#34d399;color:#020617;font-weight:800;font-size:12px;padding:8px 13px;text-decoration:none}
    table{width:100%;border-collapse:collapse;font-size:12px;text-align:left}
    th{border-bottom:1px solid rgba(255,255,255,.16);padding:7px;font-size:11px;text-transform:uppercase;color:#a1a1aa}
    td{border-bottom:1px solid rgba(255,255,255,.08);padding:9px 7px;vertical-align:top}
    .opt-title{font-weight:700;color:#fff}.opt-meta{font-size:11px;color:#a1a1aa;margin-top:2px}
    .warn-note{margin-top:4px;padding:5px 7px;border-radius:6px;border:1px solid rgba(251,191,36,.45);background:rgba(120,53,15,.28);color:#fde68a;font-size:11px}
    .badge{display:inline-block;border-radius:5px;padding:2px 6px;font-size:11px;font-weight:700;border:1px solid transparent}
    .badge-green{border-color:rgba(52,211,153,.45);background:rgba(16,185,129,.16);color:#a7f3d0}
    .badge-amber{border-color:rgba(251,191,36,.45);background:rgba(245,158,11,.16);color:#fde68a}
    .badge-sky{border-color:rgba(56,189,248,.45);background:rgba(14,165,233,.16);color:#bae6fd}
    .cta-btn{display:inline-block;border-radius:7px;padding:5px 9px;font-size:11px;font-weight:700;border:1px solid rgba(103,232,249,.45);background:rgba(6,182,212,.18);color:#cffafe}
    ul{margin:6px 0 0;padding-left:18px;color:#e2e8f0}li{margin-bottom:4px}
    footer{margin-top:10px;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 12px;font-size:11px;color:#94a3b8}
  </style>
</head>
<body>
  <main class="wrap">
    <nav class="top-nav">
      <div>
        <a href="${esc(evaluation.links.portGuideUrl)}">&larr; Full ${esc(evaluation.portName)} Port Guide</a>
        <span style="margin:0 6px;color:#475569">|</span>
        <span style="color:#67e8f9;font-weight:700">Ship-Wi-Fi Emergency &amp; Change Replan (&lt; 50 KB)</span>
      </div>
      <div>
        <a href="${esc(evaluation.links.cruisePromenadeReturnUrl)}" data-testid="replan-return-cruise-promenade" class="btn-emerald">${esc(evaluation.links.cruisePromenadeReturnLabel)}</a>
      </div>
    </nav>

    <section class="card" data-testid="dcc-port-low-bw-replan" data-port-slug="${esc(evaluation.portSlug)}">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:8px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:10px;margin-bottom:10px">
        <div>
          <div class="kicker">${esc(evaluation.portName)} (${esc(evaluation.country)}) &middot; ${esc(dockBadgeText)}</div>
          <h1>${esc(evaluation.portName)} Port-Day Schedule Change &amp; 2-Hour Buffer Replan</h1>
          <p style="margin:0;font-size:12px;color:#cbd5e1">Canonical Rule: <strong>${CANONICAL_CRUISE_RETURN_BUFFER_MINUTES}-minute (2-hour) return buffer</strong> before all-aboard. Target back at pier by <strong>${esc(evaluation.schedule.recommendedBackByPierTime || "2h before all-aboard")}</strong>.</p>
        </div>
        <span class="badge badge-green">120-Min Buffer Rule</span>
      </div>

      <div id="dcc-port-offline-banner" class="warn-note" style="display:none;margin-bottom:10px" role="status">
        Offline on Ship Wi-Fi &mdash; Displaying cached ${esc(evaluation.portName)} backup plan &amp; emergency return checklist.
      </div>

      <div class="grid-3" style="margin-bottom:10px">
        <div class="subcard" style="margin:0">
          <div class="kicker">Dock / Tender Profile</div>
          <div style="margin-top:4px;color:#f1f5f9"><strong>${esc(dockBadgeText)}:</strong> ${esc(evaluation.berthSummary)}</div>
        </div>
        <div class="subcard" style="margin:0">
          <div class="kicker">Town Transfer &amp; Local Basics</div>
          <div style="margin-top:4px;color:#f1f5f9">${esc(evaluation.distanceToTownSummary)}</div>
          <div class="opt-meta">${esc(evaluation.currencyAndLanguage)}</div>
        </div>
        <div class="subcard" style="margin:0">
          <div class="kicker">Active Backup Playbook</div>
          <div style="margin-top:4px;color:#f1f5f9"><strong>${esc(evaluation.backupPlanSummary.headline)}</strong></div>
          <div class="opt-meta">${esc(evaluation.backupPlanSummary.detail)}</div>
        </div>
      </div>

      <form method="GET" action="/ports/${esc(evaluation.portSlug)}/replan" class="subcard">
        ${journeyId ? `<input type="hidden" name="journey_id" value="${esc(journeyId)}" />` : ""}
        ${shareCode ? `<input type="hidden" name="shareCode" value="${esc(shareCode)}" />` : ""}
        ${qaTest ? `<input type="hidden" name="qa_test" value="1" />` : ""}
        <div class="grid-form">
          <div class="field">
            <label for="rp-ship">Ship</label>
            <input id="rp-ship" name="ship" type="text" value="${esc(evaluation.schedule.ship)}" />
          </div>
          <div class="field">
            <label for="rp-date">Port Date</label>
            <input id="rp-date" name="date" type="date" value="${esc(evaluation.schedule.portDate)}" />
          </div>
          <div class="field">
            <label for="rp-arr">Arrival</label>
            <input id="rp-arr" name="arrival" type="time" value="${esc(evaluation.schedule.arrivalTime)}" />
          </div>
          <div class="field">
            <label for="rp-aa">All-Aboard</label>
            <input id="rp-aa" name="all_aboard" type="time" value="${esc(evaluation.schedule.allAboardTime)}" />
          </div>
          <div class="field">
            <label for="rp-party">Guests</label>
            <input id="rp-party" name="party_size" type="number" min="1" max="24" value="${evaluation.schedule.partySize}" />
          </div>
          <div class="field">
            <label for="rp-disruption">Port Disruption</label>
            <select id="rp-disruption" name="disruption">
              <option value="normal"${evaluation.schedule.disruptionMode === "normal" ? " selected" : ""}>On Schedule</option>
              <option value="late_docking"${evaluation.schedule.disruptionMode === "late_docking" ? " selected" : ""}>Late Docking</option>
              <option value="tender_delay"${evaluation.schedule.disruptionMode === "tender_delay" ? " selected" : ""}>Tender Queue Delay</option>
              <option value="weather_cancel"${evaluation.schedule.disruptionMode === "weather_cancel" ? " selected" : ""}>Weather Tour Cancel</option>
            </select>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px">
          <button type="submit" class="btn-primary">Recalculate 2h Buffer Plan</button>
          <a href="${esc(evaluation.links.dccHandoffUrl)}" data-testid="replan-sync-group-handoff" style="font-size:12px;font-weight:700">Sync Updated Port Window to Cruise Promenade &rarr;</a>
        </div>
      </form>

      <div class="subcard">
        <h2>${esc(CANONICAL_CRUISE_LEAD_RULE)}</h2>
        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr>
                <th>Excursion Departure</th>
                <th>Return Buffer Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${excursionsRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <div class="subcard">
        <h2>Walkable &amp; Self-Paced Near-Pier Backup Options (Zero Cutoff Risk)</h2>
        <div class="grid-3" style="margin-top:8px">
          ${walkableHtml}
        </div>
      </div>

      <div class="grid-3">
        <div class="subcard" style="margin:0">
          <h2>Late-Docking / Tender / Weather Immediate Actions</h2>
          <ul>${immediateActionsHtml}</ul>
        </div>
        <div class="subcard" style="margin:0">
          <h2>Emergency Return-to-Ship Checklist</h2>
          <ul>${checklistHtml}</ul>
        </div>
      </div>
    </section>

    <footer>
      Zero-PII Low-Bandwidth Replan (&lt; 50 KB standalone HTML/CSS/JS). Cached locally under <code>${esc(storageKey)}</code> for spotty ship Wi-Fi. JSON feed: <a href="/ports/${esc(evaluation.portSlug)}/replan?format=json">?format=json</a>.
    </footer>
  </main>
  <script>
    (function(){
      var k=${JSON.stringify(storageKey)},s=${offlineSnapshotJson};
      try{localStorage.setItem(k,JSON.stringify(s));}catch(e){}
      function u(){var b=document.getElementById("dcc-port-offline-banner");if(b)b.style.display=(typeof navigator!=="undefined"&&navigator.onLine===false)?"block":"none";}
      window.addEventListener("online",u);window.addEventListener("offline",u);u();
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
