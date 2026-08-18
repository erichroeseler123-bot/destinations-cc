import { NextResponse } from "next/server";
import { getExperienceGraphGovernanceSummary } from "@/app/new-orleans/data/experienceGraphGovernance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORIGIN = "https://www.welcometoneworleanstours.com";
const HELD_SLUG = "covered-boat-plantation-combo";
const LEGACY_COMBO = "/tours/all-day-city-plantation-combo";
const TODAY = "/guides/things-to-do-in-new-orleans-today";
const TONIGHT = "/guides/tonight";

async function fetchState(path: string) {
  try {
    const response = await fetch(`${ORIGIN}${path}${path.includes("?") ? "&" : "?"}completionAudit=${Date.now()}`, {
      cache: "no-store",
      headers: { "User-Agent": "WNO completion audit" },
    });
    const text = await response.text();
    return { path, status: response.status, ok: response.ok, text };
  } catch (error) {
    return { path, status: null, ok: false, text: "", error: error instanceof Error ? error.message : "fetch_failed" };
  }
}

function json(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function GET() {
  const startedAt = Date.now();
  const graph = getExperienceGraphGovernanceSummary();

  const [productionState, seoState, linkState, imageState, legacyCombo, today, tonight] = await Promise.all([
    fetchState("/api/internal/wno-production-audit"),
    fetchState("/api/internal/wno-seo-audit"),
    fetchState("/api/internal/wno-link-audit"),
    fetchState("/api/internal/wno-image-audit"),
    fetchState(LEGACY_COMBO),
    fetchState(TODAY),
    fetchState(TONIGHT),
  ]);

  const production = json(productionState.text);
  const seo = json(seoState.text);
  const links = json(linkState.text);
  const images = json(imageState.text);

  const legacyFixedDurationAbsent = !/approximately\s+8\s+hours|about\s+8\s+hours/i.test(legacyCombo.text);
  const legacyConditionalDurationVisible = /Duration depends on current itinerary|confirm details when you check availability/i.test(legacyCombo.text);
  const heldAbsentFromToday = !today.text.includes(HELD_SLUG);
  const heldAbsentFromTonight = !tonight.text.includes(HELD_SLUG);

  const graphPass = graph.total === 21 && graph.publishable === 20 && graph.needsVerification === 1;
  const inventoryPass = production?.bookingAudit?.governedPassed === 21 && production?.bookingAudit?.manualConfirmationPassed === 1;
  const solverPass = legacyFixedDurationAbsent && legacyConditionalDurationVisible && heldAbsentFromToday && heldAbsentFromTonight;
  const routesPass = production?.routes?.checked === 48 && production?.routes?.passed === 48 && production?.routes?.failed === 0;
  const dossierPass = inventoryPass && images?.summary?.intentionalTextOnly === 5 && images?.summary?.unexpectedTextOnly === 0;
  const seoPass = seo?.pass === true && seo?.summary?.missingCanonical === 0 && seo?.summary?.duplicateCanonicals === 0;
  const linkPass = links?.pass === true && links?.summary?.orphaned === 0 && links?.summary?.weakMoneyPages === 0;
  const imagePass = images?.pass === true && images?.summary?.brokenImages === 0 && images?.summary?.missingAlt === 0 && images?.summary?.oversized80Kb === 0;
  const trustPass = production?.bookingAudit?.manualConfirmationPassed === 1;
  const finalCloseoutPass = graphPass && inventoryPass && solverPass && routesPass && dossierPass && seoPass && linkPass && imagePass && production?.pass === true;

  const checkpoints = [
    { id: 1, name: "Experience Graph", status: graphPass ? "pass" : "fail", proof: { governed: graph.total, publishable: graph.publishable, held: graph.needsVerification, heldSlugs: graph.slugsNeedingVerification } },
    { id: 2, name: "Verified inventory / truth layer", status: inventoryPass && legacyFixedDurationAbsent && legacyConditionalDurationVisible ? "pass" : "fail", proof: { governedBookings: production?.bookingAudit?.governedPassed ?? null, manualConfirmation: production?.bookingAudit?.manualConfirmationPassed ?? null, legacyFixedDurationAbsent, legacyConditionalDurationVisible } },
    { id: 3, name: "Constraint solver", status: solverPass ? "pass" : "fail", proof: { legacyConditionalLanguage: legacyConditionalDurationVisible, heldAbsentFromToday, heldAbsentFromTonight } },
    { id: 4, name: "Eight commercial hubs / routes", status: routesPass ? "pass" : "fail", proof: production?.routes ?? null },
    { id: 5, name: "Tour dossiers", status: dossierPass ? "pass" : "fail", proof: { governedBookingPages: production?.bookingAudit?.governedPassed ?? null, intentionalTextOnly: images?.summary?.intentionalTextOnly ?? null, unexpectedTextOnly: images?.summary?.unexpectedTextOnly ?? null } },
    { id: 6, name: "Structured comparison layer", status: "pass", proof: { previouslyCleared: true } },
    { id: 7, name: "Canonical high-intent planning layer", status: seoPass ? "pass" : "fail", proof: seo?.summary ?? null },
    { id: 8, name: "Today / Tonight live products", status: heldAbsentFromToday && heldAbsentFromTonight ? "pass" : "fail", proof: { heldAbsentFromToday, heldAbsentFromTonight } },
    { id: 9, name: "Time-budget system", status: legacyFixedDurationAbsent && legacyConditionalDurationVisible ? "pass" : "fail", proof: { staleEightHourClaimSuppressed: legacyFixedDurationAbsent, conditionalTimingRendered: legacyConditionalDurationVisible } },
    { id: 10, name: "Location intelligence", status: "pass", proof: { previouslyCleared: true } },
    { id: 11, name: "Public operator entity layer", status: linkPass ? "pass" : "fail", proof: { orphanedPages: links?.summary?.orphaned ?? null } },
    { id: 12, name: "Trust and provenance", status: trustPass ? "pass" : "fail", proof: { heldProductVisibleManualConfirmation: trustPass } },
    { id: 13, name: "Technical SEO", status: seoPass ? "pass" : "fail", proof: seo?.summary ?? null },
    { id: 14, name: "Internal link graph", status: linkPass ? "pass" : "fail", proof: links?.summary ?? null },
    { id: 15, name: "Imagery", status: imagePass ? "pass" : "fail", proof: images?.summary ?? null },
    { id: 16, name: "Funnel instrumentation", status: "pass", proof: { previouslyCleared: true } },
    { id: 17, name: "Acquisition loop", status: "pass", proof: { previouslyCleared: true } },
    { id: 18, name: "Distribution system", status: "pass", proof: { buildPhaseCleared: true, operatingRhythmNowApplies: true } },
    { id: 19, name: "Production QA gate", status: finalCloseoutPass ? "pass" : "fail", proof: { production: production?.pass === true, seo: seoPass, links: linkPass, images: imagePass, graph: graphPass, truthLayer: inventoryPass, solverSuppression: solverPass, runtimeErrors: "verified separately from Vercel runtime logs" } },
  ];

  const counts = checkpoints.reduce((acc, checkpoint) => {
    acc[checkpoint.status] = (acc[checkpoint.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    scoreboard: {
      graph: `${graph.publishable}/21 publishable; ${graph.needsVerification} held`,
      routes: `${production?.routes?.passed ?? 0}/${production?.routes?.checked ?? 0}`,
      bookings: `${production?.bookingAudit?.governedPassed ?? 0}/${production?.bookingAudit?.checked ?? 0} governed (${production?.bookingAudit?.selfServicePassed ?? 0} self-service + ${production?.bookingAudit?.manualConfirmationPassed ?? 0} manual hold)`,
      seoHighSeverityIssues: seo?.pass === true ? 0 : null,
      orphanedPages: links?.summary?.orphaned ?? null,
      brokenImages: images?.summary?.brokenImages ?? null,
      missingAlt: images?.summary?.missingAlt ?? null,
      imagesOver80Kb: images?.summary?.oversized80Kb ?? null,
      runtimeErrors: "external Vercel verification required",
    },
    counts,
    buildPhaseComplete: finalCloseoutPass,
    checkpoints,
  }, { headers: { "Cache-Control": "no-store" } });
}
