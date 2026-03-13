import { createHmac, randomUUID } from "crypto";
import { slugify } from "@/lib/dcc/slug";
import { matchCruiseShip } from "@/lib/dcc/cruise/shipRegistry";

export type DccHandoffInput = {
  sourceSlug?: string;
  portSlug?: string;
  topicSlug?: string;
  cruiseShip?: string;
  cruiseShipSlug?: string;
  date?: string;
  source?: string;
  version?: string;
  handoffId?: string;
  createdAt?: string;
};

export type WtaDccHandoffPayload = {
  source: string;
  version: string;
  handoffId: string;
  createdAt: string;
  destination: {
    portSlug?: string;
    date?: string;
  };
  traveler: {
    cruiseShip?: string;
    cruiseShipSlug?: string;
    cruiseDate?: string;
  };
  attribution?: {
    sourceSlug?: string;
    topicSlug?: string;
  };
  context?: {
    sourceSlug?: string;
    authorityTopic?: string;
  };
  booking?: {
    portSlug?: string;
    date?: string;
  };
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecodeToJson<T>(payload: string): T {
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return JSON.parse(json) as T;
}

function resolveSigningSecret(explicit?: string): string | null {
  const secret = explicit || process.env.DCC_WTA_HANDOFF_SIG_SECRET || "";
  return secret.trim() ? secret : null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function buildDccHandoffPayload(input: DccHandoffInput): WtaDccHandoffPayload {
  const matched = matchCruiseShip(input.cruiseShip || "", input.cruiseShipSlug);
  const providedSlug = slugify(input.cruiseShipSlug || "");

  return {
    source: input.source || "dcc",
    version: input.version || "1",
    handoffId: input.handoffId || randomUUID(),
    createdAt: input.createdAt || new Date().toISOString(),
    destination: {
      portSlug: input.portSlug || undefined,
      date: input.date || undefined,
    },
    traveler: {
      cruiseShip: matched?.cruiseShip || input.cruiseShip || undefined,
      cruiseShipSlug: matched?.cruiseShipSlug || providedSlug || undefined,
      cruiseDate: input.date || undefined,
    },
    attribution:
      input.sourceSlug || input.topicSlug
        ? {
            sourceSlug: input.sourceSlug || undefined,
            topicSlug: input.topicSlug || undefined,
          }
        : undefined,
    context:
      input.sourceSlug || input.topicSlug
        ? {
            sourceSlug: input.sourceSlug || undefined,
            authorityTopic: input.topicSlug || undefined,
          }
        : undefined,
    booking:
      input.portSlug || input.date
        ? {
            portSlug: input.portSlug || undefined,
            date: input.date || undefined,
          }
        : undefined,
  };
}

export function buildDccHandoffUrl(
  input: DccHandoffInput,
  pathname = "/handoff/dcc",
  opts?: { signingSecret?: string }
): string {
  const payload = buildDccHandoffPayload(input);
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const params = new URLSearchParams();
  params.set("payload", encodedPayload);

  const secret = resolveSigningSecret(opts?.signingSecret);
  if (secret) {
    params.set("sig", signPayload(encodedPayload, secret));
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function decodeDccHandoffPayload(payload: string): WtaDccHandoffPayload {
  return base64UrlDecodeToJson<WtaDccHandoffPayload>(payload);
}

function isPlaceholderRouterUrl(value: string): boolean {
  return value.includes("your-router-url-here");
}

export function buildDccWtaHandoffHref(
  input: DccHandoffInput,
  opts?: {
    pathname?: string;
    routerBaseUrl?: string;
    signingSecret?: string;
  }
): string {
  const pathname = opts?.pathname || "/handoff/dcc";
  const relative = buildDccHandoffUrl(input, pathname, {
    signingSecret: opts?.signingSecret,
  });
  const base = (opts?.routerBaseUrl || process.env.DCC_ROUTER_URL || "").trim();
  if (!base || isPlaceholderRouterUrl(base)) return relative;
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}
