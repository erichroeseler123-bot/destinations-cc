import fs from "fs";
import os from "os";
import path from "path";
import { buildDiscoveryStackSnapshot, type DiscoverySurfacePublication } from "@/lib/dcc/discoveryStack";

export type DiscoveryPublicationFileRecord = {
  path: string;
  contentType: string;
  body: string;
};

export type DiscoveryPublicationTarget = {
  id: string;
  role: DiscoverySurfacePublication["role"];
  domain: string;
  siteName: string;
  storageKey: string;
  files: {
    sitemap: string;
    llms: string;
    agent: string;
  };
};

export type PublishedDiscoverySurface = Omit<DiscoveryPublicationTarget, "files"> & {
  publishedAt: string;
  files: {
    sitemap: DiscoveryPublicationFileRecord;
    llms: DiscoveryPublicationFileRecord;
    agent: DiscoveryPublicationFileRecord;
  };
};

export type PublishedDiscoverySnapshot = {
  generatedAt: string;
  publishedAt: string;
  version: string;
  surfaces: PublishedDiscoverySurface[];
};

const DEFAULT_STORE_PATH = path.join(os.tmpdir(), "dcc-discovery-stack-publications.json");

function getStorePath() {
  return process.env.DCC_DISCOVERY_PUBLICATION_STORE_PATH || DEFAULT_STORE_PATH;
}

function ensureStoreDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function stableStringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function buildStorageKey(id: string) {
  return `discovery:${id}`;
}

function serializePublication(publication: DiscoverySurfacePublication): PublishedDiscoverySurface {
  const storageKey = buildStorageKey(publication.id);
  const publishedAt = new Date().toISOString();

  return {
    id: publication.id,
    role: publication.role,
    domain: publication.domain,
    siteName: publication.siteName,
    storageKey,
    publishedAt,
    files: {
      sitemap: {
        path: publication.sitemap.path,
        contentType: "application/xml; charset=utf-8",
        body: publication.sitemap.body,
      },
      llms: {
        path: publication.llms.path,
        contentType: "text/plain; charset=utf-8",
        body: publication.llms.body,
      },
      agent: {
        path: publication.agent.path,
        contentType: "application/json; charset=utf-8",
        body: `${stableStringify(publication.agent.payload)}\n`,
      },
    },
  };
}

export function listDiscoveryPublicationTargets(): DiscoveryPublicationTarget[] {
  return buildDiscoveryStackSnapshot().publications.map((publication) => {
    const storageKey = buildStorageKey(publication.id);

    return {
      id: publication.id,
      role: publication.role,
      domain: publication.domain,
      siteName: publication.siteName,
      storageKey,
      files: {
        sitemap: `${storageKey}${publication.sitemap.path}`,
        llms: `${storageKey}${publication.llms.path}`,
        agent: `${storageKey}${publication.agent.path}`,
      },
    };
  });
}

export function readPublishedDiscoverySnapshot(): PublishedDiscoverySnapshot | null {
  try {
    return JSON.parse(fs.readFileSync(getStorePath(), "utf8")) as PublishedDiscoverySnapshot;
  } catch {
    return null;
  }
}

export function publishDiscoveryStackSnapshot(): PublishedDiscoverySnapshot {
  const snapshot = buildDiscoveryStackSnapshot();
  const publishedSnapshot: PublishedDiscoverySnapshot = {
    generatedAt: snapshot.generatedAt,
    publishedAt: new Date().toISOString(),
    version: snapshot.version,
    surfaces: snapshot.publications.map(serializePublication),
  };

  const storePath = getStorePath();
  ensureStoreDir(storePath);
  fs.writeFileSync(storePath, `${stableStringify(publishedSnapshot)}\n`);

  return publishedSnapshot;
}

export function getPublishedDiscoverySurface(id: string): PublishedDiscoverySurface | null {
  return readPublishedDiscoverySnapshot()?.surfaces.find((surface) => surface.id === id) ?? null;
}

export function getDiscoveryPublicationStorePath() {
  return getStorePath();
}
