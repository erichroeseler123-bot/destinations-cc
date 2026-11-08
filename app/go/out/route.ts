import { NextResponse } from "next/server";
import { resolveOrGenerateW3cTraceparent } from "@/lib/dcc/machine";
import {
  createCommercialHandoff,
  type CommercialProvider,
} from "@/lib/dcc/commerce";
import { getDurableTourByIdOrAlias } from "@/lib/dcc/catalog/durableCatalogStore";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

const APPROVED_OUTBOUND_HOSTS = new Set([
  "www.viator.com",
  "viator.com",
  "fareharbor.com",
  "www.fareharbor.com",
  "www.pacwhale.com",
  "pacwhale.com",
  "www.alaskataxi.com",
  "alaskataxi.com",
  "www.alaskacruisetransfer.com",
  "alaskacruisetransfer.com",
  "www.allenmarine.com",
  "allenmarine.com",
  "www.juneautours.com",
  "juneautours.com",
  "gosno.co",
  "www.gosno.co",
  "partyatredrocks.com",
  "www.partyatredrocks.com",
]);

export async function GET(request: Request) {
  await syncDurableLedgerWithPostgres();
  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);
  const sp = url.searchParams;

  const rawTarget =
    sp.get("u")?.trim() ||
    sp.get("target")?.trim() ||
    sp.get("url")?.trim() ||
    "";
  const productCode =
    sp.get("product")?.trim() ||
    sp.get("offer")?.trim() ||
    sp.get("productCode")?.trim() ||
    sp.get("t")?.replace(/^viator:/i, "").trim() ||
    "";
  const optionCode =
    sp.get("option")?.trim() ||
    sp.get("optionCode")?.trim() ||
    null;
  const portSlug =
    sp.get("port")?.trim() ||
    sp.get("property")?.trim() ||
    null;
  const surface =
    sp.get("surface")?.trim() ||
    sp.get("s")?.trim() ||
    "dcc_port_day_catalog";
  const trackingTag =
    sp.get("trackingTag")?.trim() ||
    sp.get("c")?.trim() ||
    (productCode
      ? `dcc_port_day_${portSlug || "port"}_${productCode}${optionCode ? `_${optionCode}` : ""}`
      : "dcc_port_day_handoff");

  const catalogTour = productCode
    ? await getDurableTourByIdOrAlias(productCode)
    : null;

  let resolvedTargetUrl = rawTarget || catalogTour?.bookingUrl || "";
  if (!resolvedTargetUrl) {
    return NextResponse.json(
      { ok: false, error: "MISSING_TARGET_URL_OR_PRODUCT" },
      { status: 400 }
    );
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(resolvedTargetUrl);
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_TARGET_URL" },
      { status: 400 }
    );
  }

  const hostLower = parsedTarget.hostname.toLowerCase();
  const isCatalogHost = (() => {
    if (!catalogTour?.bookingUrl) return false;
    try {
      return new URL(catalogTour.bookingUrl).hostname.toLowerCase() === hostLower;
    } catch {
      return false;
    }
  })();

  if (
    parsedTarget.protocol !== "https:" ||
    (!APPROVED_OUTBOUND_HOSTS.has(hostLower) && !isCatalogHost)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAPPROVED_CHECKOUT_DESTINATION",
        host: parsedTarget.hostname,
      },
      { status: 403 }
    );
  }

  const provider: CommercialProvider = hostLower.includes("viator.com")
    ? "viator"
    : hostLower.includes("fareharbor.com")
      ? "fareharbor"
      : "direct";

  const handoff = await createCommercialHandoff({
    originatingSite:
      request.headers.get("referer") ||
      url.hostname ||
      "destinationcommandcenter.com",
    targetSite: parsedTarget.hostname,
    provider,
    providerAccount:
      parsedTarget.searchParams.get("pid") ||
      parsedTarget.searchParams.get("asn") ||
      null,
    productCode: productCode || catalogTour?.providerProductCode || "dcc-product",
    productTitle: catalogTour?.title || null,
    productDestinationUrl: parsedTarget.toString(),
    campaign: trackingTag,
    intendedDate: sp.get("date")?.trim() || null,
    intendedOption: optionCode,
    partySize: Number(sp.get("partySize") || sp.get("adults") || 2) || 2,
    callerClientId: `client:${surface}`,
    traceparent,
  });

  await syncDurableLedgerWithPostgres({ forcePushLocal: true });

  return NextResponse.redirect(handoff.outboundAffiliateUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      traceparent,
      "X-DCC-Handoff-Id": handoff.handoffId,
      "X-DCC-Click-Id": handoff.clickId,
      "X-DCC-Provider": handoff.provider,
      "X-DCC-Product-Code": productCode || catalogTour?.providerProductCode || "",
      "X-DCC-Option-Code": optionCode || "",
    },
  });
}
