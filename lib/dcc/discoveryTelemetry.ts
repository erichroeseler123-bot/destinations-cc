const MACHINE_PATTERN = /(bot|crawler|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|vkshare|whatsapp|telegrambot|discordbot|slackbot|applebot|googleother|gptbot|chatgpt-user|claudebot|anthropic-ai|perplexitybot|bytespider|cohere-ai)/i;

function truncate(value: string | null, max = 240) {
  if (!value) return null;
  return value.slice(0, max);
}

export function classifyRequester(userAgent: string | null) {
  if (!userAgent) return "unknown";
  return MACHINE_PATTERN.test(userAgent) ? "machine" : "human_or_app";
}

export function logDiscoveryRequest(input: {
  surface: string;
  path: string;
  userAgent?: string | null;
  referer?: string | null;
  coordinate?: string | null;
  indexable?: boolean | null;
}) {
  const userAgent = input.userAgent || null;
  console.log(
    JSON.stringify({
      level: "info",
      msg: "dcc_discovery_request",
      surface: input.surface,
      path: input.path,
      requesterClass: classifyRequester(userAgent),
      userAgent: truncate(userAgent),
      referer: truncate(input.referer || null),
      coordinate: input.coordinate || null,
      indexable: input.indexable ?? null,
      ts: new Date().toISOString(),
    }),
  );
}
