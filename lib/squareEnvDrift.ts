type LegacySquareEnvAlias = {
  name: string;
  replacement: string;
};

const warnedLegacyAliases = new Set<string>();

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function reportLegacySquareEnvAlias(alias: LegacySquareEnvAlias, context: string) {
  const warningKey = `${context}:${alias.name}:${alias.replacement}`;
  if (warnedLegacyAliases.has(warningKey)) return;
  warnedLegacyAliases.add(warningKey);

  console.warn("DRIFT_DETECTED: legacy Square env alias used", {
    alias: alias.name,
    replacement: alias.replacement,
    context,
  });
}

export function readCanonicalSquareEnv(
  canonicalNames: string[],
  legacyAliases: LegacySquareEnvAlias[],
  context: string,
) {
  for (const name of canonicalNames) {
    const value = readEnv(name);
    if (value) return value;
  }

  for (const alias of legacyAliases) {
    const value = readEnv(alias.name);
    if (value) {
      reportLegacySquareEnvAlias(alias, context);
      return value;
    }
  }

  return "";
}

export function hasLegacySquareEnvAlias(name: string) {
  return Boolean(readEnv(name));
}
