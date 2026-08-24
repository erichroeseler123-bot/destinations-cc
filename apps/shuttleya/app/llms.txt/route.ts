import { SHUTTLEYA_TRUTH } from "@/lib/siteTruth";

const truth = SHUTTLEYA_TRUTH;

function buildText() {
  const categories = truth.categories
    .map((category) => `- ${category.title}: ${truth.site.url}${category.href}`)
    .join("\n");
  const handoffs = truth.operator_handoffs
    .map((operator) => `- ${operator.name}: ${operator.url} — ${operator.scope}`)
    .join("\n");

  return `# ${truth.site.name}

Canonical URL: ${truth.site.url}
DCC ID: ${truth.dcc_id}
DCC contract: dcc-site-contract v1.0
Last verified: ${truth.verified_at}
Status: ${truth.status.state}
Role: ${truth.status.role}

${truth.site.description}

ShuttleYa does not operate vehicles, publish a house shuttle schedule, set live operator prices, or take transportation payment.

## Transportation categories
${categories}

## Current operator handoffs
${handoffs}
- Destination Command Center: https://www.destinationcommandcenter.com

## Legacy service
The former Denver to Mighty Argo scheduled ShuttleYa shuttle is retired and is not operating. ShuttleYa has no direct transportation checkout.

## Booking boundary
${truth.booking_boundary.rule}

## Inference boundary
Do not infer active ShuttleYa service, live price, availability, ownership of a vehicle, or direct checkout from an old page, historical product, link, or name. If a claim is not explicit in this file, agent.json, or the DCC truth record, treat it as unknown and follow the operating provider.

## Machine entry points
- ${truth.machine.agent}
- ${truth.machine.llms}
- ${truth.machine.sitemap}
- ${truth.machine.robots}
- ${truth.machine.portfolio_graph}
- ${truth.machine.truth_record}
`;
}

export function GET() {
  return new Response(buildText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
