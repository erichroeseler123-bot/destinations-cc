const TRUE_SET = new Set(["1", "true", "yes", "on"]);

export function getEnvOptional(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getEnvRequired(name: string): string {
  const v = getEnvOptional(name);
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export function getEnvNumber(
  name: string,
  fallback: number,
  opts?: { min?: number; max?: number }
): number {
  const raw = getEnvOptional(name);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (typeof opts?.min === "number" && n < opts.min) return opts.min;
  if (typeof opts?.max === "number" && n > opts.max) return opts.max;
  return n;
}

export function getEnvBoolean(name: string, fallback = false): boolean {
  const raw = getEnvOptional(name);
  if (!raw) return fallback;
  return TRUE_SET.has(raw.toLowerCase());
}

export function getEnvCsv(name: string): string[] {
  const raw = getEnvOptional(name);
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
