import { readFile } from "fs/promises";
import path from "path";

export type ArgoWaitlistEntry = {
  createdAt: string;
  email: string;
  name: string | null;
  source: string;
  preferredMonth: string | null;
  partySize: number | null;
};

export type ArgoWaitlistFilters = {
  preferredMonth?: string;
  minPartySize?: number;
  maxPartySize?: number;
};

function toNumberOrNull(value: string | null | undefined) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseWaitlistLine(line: string): ArgoWaitlistEntry | null {
  if (!line.trim()) return null;
  try {
    const raw = JSON.parse(line) as Partial<ArgoWaitlistEntry>;
    if (!raw.email || !raw.createdAt || !raw.source) return null;
    return {
      createdAt: String(raw.createdAt),
      email: String(raw.email),
      name: raw.name ? String(raw.name) : null,
      source: String(raw.source),
      preferredMonth: raw.preferredMonth ? String(raw.preferredMonth) : null,
      partySize: toNumberOrNull(raw.partySize as unknown as string),
    };
  } catch {
    return null;
  }
}

export async function readArgoWaitlist(): Promise<ArgoWaitlistEntry[]> {
  const filePath = path.join(process.cwd(), "data", "waitlist", "argo-launch-alerts.jsonl");
  let content = "";
  try {
    content = await readFile(filePath, "utf8");
  } catch {
    return [];
  }

  return content
    .split("\n")
    .map(parseWaitlistLine)
    .filter((x): x is ArgoWaitlistEntry => Boolean(x));
}

export function filterArgoWaitlist(
  entries: ArgoWaitlistEntry[],
  filters: ArgoWaitlistFilters,
): ArgoWaitlistEntry[] {
  return entries.filter((entry) => {
    if (filters.preferredMonth && entry.preferredMonth !== filters.preferredMonth) return false;
    if (typeof filters.minPartySize === "number" && (entry.partySize || 0) < filters.minPartySize) return false;
    if (typeof filters.maxPartySize === "number" && (entry.partySize || 0) > filters.maxPartySize) return false;
    return true;
  });
}

export function waitlistToCsv(entries: ArgoWaitlistEntry[]): string {
  const escapeCell = (value: string | number | null) => {
    const text = value == null ? "" : String(value);
    if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
      return `"${text.replaceAll("\"", "\"\"")}"`;
    }
    return text;
  };

  const header = ["createdAt", "email", "name", "source", "preferredMonth", "partySize"];
  const rows = entries.map((entry) => [
    entry.createdAt,
    entry.email,
    entry.name,
    entry.source,
    entry.preferredMonth,
    entry.partySize,
  ]);

  return [header.join(","), ...rows.map((row) => row.map(escapeCell).join(","))].join("\n");
}
