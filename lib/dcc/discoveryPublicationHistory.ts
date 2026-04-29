import { createHash } from "crypto";

export type DiscoverySurfacePublicationLike = {
  id: string;
  role: "dcc" | "satellite" | "operator";
  domain: string;
  siteName: string;
  sitemap: {
    path: string;
    body: string;
  };
  llms: {
    path: string;
    body: string;
  };
  agent: {
    path: string;
    payload: Record<string, unknown>;
  };
};

export type DiscoveryPublicationDriftRecord = {
  publicationId: string;
  surfaceId: string;
  role: DiscoverySurfacePublicationLike["role"];
  domain: string;
  siteName: string;
  generatedAt: string;
  publishedAt: string;
  version: string;
  contentHash: string;
  agentHash: string;
  llmsHash: string;
  sitemapHash: string;
  winnerCode: string | null;
  winnerConfidence: string | null;
  fitReason: string | null;
  resolutionPath: string | null;
  previousPublicationId: string | null;
  previousWinnerCode: string | null;
  previousWinnerConfidence: string | null;
  changed: boolean;
  changedFields: string[];
  winnerChangedAt: string | null;
  metadata: Record<string, unknown>;
};

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractIntentWinner(payload: Record<string, unknown>) {
  const intents = firstRecord(payload.intents);
  if (!intents) return null;

  for (const intentConfig of Object.values(intents)) {
    const record = firstRecord(intentConfig);
    if (!record) continue;
    const winnerCode =
      firstString(record.top_product_code) ||
      firstString(record.winner_code) ||
      firstString(record.product_code);
    if (!winnerCode) continue;

    return {
      winnerCode,
      winnerConfidence:
        firstString(record.winner_confidence) || firstString(record.confidence),
      fitReason: firstString(record.fit_reason),
      resolutionPath:
        firstString(record.resolution_path) || firstString(record.resolver),
    };
  }

  return null;
}

export function extractDiscoveryWinnerSignals(payload: Record<string, unknown>) {
  const direct = {
    winnerCode:
      firstString(payload.top_product_code) ||
      firstString(payload.winner_code) ||
      firstString(payload.product_code),
    winnerConfidence:
      firstString(payload.winner_confidence) || firstString(payload.confidence),
    fitReason: firstString(payload.fit_reason),
    resolutionPath:
      firstString(payload.resolution_path) || firstString(payload.resolver),
  };

  if (direct.winnerCode) {
    return direct;
  }

  return (
    extractIntentWinner(payload) || {
      winnerCode: null,
      winnerConfidence: null,
      fitReason: null,
      resolutionPath: null,
    }
  );
}

export function buildDiscoveryPublicationDriftRecord(input: {
  publication: DiscoverySurfacePublicationLike;
  generatedAt: string;
  publishedAt: string;
  version: string;
  previous?: DiscoveryPublicationDriftRecord | null;
}) {
  const { publication, generatedAt, publishedAt, version, previous = null } = input;
  const agentBody = `${JSON.stringify(publication.agent.payload, null, 2)}\n`;
  const llmsBody = publication.llms.body;
  const sitemapBody = publication.sitemap.body;
  const contentHash = hashValue([agentBody, llmsBody, sitemapBody].join("\n---\n"));
  const agentHash = hashValue(agentBody);
  const llmsHash = hashValue(llmsBody);
  const sitemapHash = hashValue(sitemapBody);
  const winnerSignals = extractDiscoveryWinnerSignals(publication.agent.payload);

  const changedFields: string[] = [];
  if (!previous) {
    changedFields.push("initial_publish");
  } else {
    if (previous.contentHash !== contentHash) changedFields.push("content_hash");
    if (previous.agentHash !== agentHash) changedFields.push("agent_hash");
    if (previous.llmsHash !== llmsHash) changedFields.push("llms_hash");
    if (previous.sitemapHash !== sitemapHash) changedFields.push("sitemap_hash");
    if (previous.winnerCode !== winnerSignals.winnerCode) changedFields.push("winner_code");
    if (previous.winnerConfidence !== winnerSignals.winnerConfidence) {
      changedFields.push("winner_confidence");
    }
  }

  const changed = changedFields.length > 0;
  const winnerChangedAt =
    previous?.winnerCode === winnerSignals.winnerCode
      ? previous.winnerChangedAt
      : winnerSignals.winnerCode
        ? publishedAt
        : previous?.winnerChangedAt || null;

  return {
    publicationId: `${publication.id}:${publishedAt}`,
    surfaceId: publication.id,
    role: publication.role,
    domain: publication.domain,
    siteName: publication.siteName,
    generatedAt,
    publishedAt,
    version,
    contentHash,
    agentHash,
    llmsHash,
    sitemapHash,
    winnerCode: winnerSignals.winnerCode,
    winnerConfidence: winnerSignals.winnerConfidence,
    fitReason: winnerSignals.fitReason,
    resolutionPath: winnerSignals.resolutionPath,
    previousPublicationId: previous?.publicationId || null,
    previousWinnerCode: previous?.winnerCode || null,
    previousWinnerConfidence: previous?.winnerConfidence || null,
    changed,
    changedFields,
    winnerChangedAt,
    metadata: {
      filePaths: {
        sitemap: publication.sitemap.path,
        llms: publication.llms.path,
        agent: publication.agent.path,
      },
    },
  } satisfies DiscoveryPublicationDriftRecord;
}
