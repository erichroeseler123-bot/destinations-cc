import ledger from "@/data/claims/dcc.claim-ledger.v1.json";

type Claim = (typeof ledger.claims)[number];
const CLAIM_PREFIX = "dcc-claim-";
const byId = new Map<string, Claim>(ledger.claims.map(claim => [claim.claimId, claim]));

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char] || char);
}

export function isPublicLedgerClaimId(id: string): boolean {
  return id.startsWith(CLAIM_PREFIX);
}

export function buildPublicLedgerClaimResponse(
  request: Request,
  referenceId: string,
  headOnly = false,
): Response {
  const claimId = referenceId.slice(CLAIM_PREFIX.length);
  const claim = byId.get(claimId);
  if (!claim) {
    return Response.json({ ok: false, error: "Claim record not found" }, {
      status: 404, headers: { "Cache-Control": "no-store" }
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const currentStatus = claim.status === "verified" &&
    claim.checkedAt <= today && claim.nextCheckAt >= today
    ? "verified" : claim.status === "verified" ? "stale" : claim.status;
  const recordUrl = `https://www.destinationcommandcenter.com/r/${referenceId}`;
  const payload = {
    schemaVersion: ledger.schemaVersion,
    referenceId,
    recordUrl,
    claimId: claim.claimId,
    claimText: claim.claimText,
    category: claim.category,
    authorityName: claim.authorityName,
    authorityUrl: claim.authorityUrl,
    checkedAt: claim.checkedAt,
    nextCheckAt: claim.nextCheckAt,
    currentStatus,
    limitationsNote: claim.limitationsNote
  };
  const url = new URL(request.url);
  const accept = request.headers.get("accept") || "";
  const html = url.searchParams.get("format") === "html" ||
    (accept.includes("text/html") && !accept.includes("application/json"));
  const headers = {
    "Cache-Control": "public, max-age=300, s-maxage=3600",
    "Vary": "Accept",
    "Content-Type": html ? "text/html; charset=utf-8" : "application/json; charset=utf-8"
  };
  if (!html) return headOnly
    ? new Response(null, { status: 200, headers })
    : Response.json(payload, { headers });

  const statusLabel = currentStatus === "verified"
    ? "Source checked and within review window"
    : "Source requires a new check";
  const document = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>DCC source record: ${escapeHtml(claim.claimId)}</title></head>
<body style="max-width:48rem;margin:3rem auto;padding:0 1rem;font:1rem/1.6 system-ui,sans-serif;color:#172033">
<main><p><a href="https://www.destinationcommandcenter.com/">Destination Command Center</a> / Research record</p>
<h1>${escapeHtml(claim.claimText)}</h1>
<p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
<dl><dt>Original authority</dt><dd><a href="${escapeHtml(claim.authorityUrl)}">${escapeHtml(claim.authorityName)}</a></dd>
<dt>Checked</dt><dd>${escapeHtml(claim.checkedAt)}</dd>
<dt>Review due</dt><dd>${escapeHtml(claim.nextCheckAt)}</dd>
<dt>Limitations</dt><dd>${escapeHtml(claim.limitationsNote)}</dd></dl>
<p><a href="${escapeHtml(claim.authorityUrl)}">Read the original source</a></p></main></body></html>`;
  return new Response(headOnly ? null : document, { status: 200, headers });
}
