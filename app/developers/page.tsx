import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DCC Developers | Dense Coordinate Location API",
  description: "Use latitude and longitude to retrieve dense public location intelligence from Destination Command Center.",
  alternates: { canonical: "https://destinationcommandcenter.com/developers" },
};

const exampleLat = "39.66540";
const exampleLng = "-105.20570";

const MODULES = [
  ["identity", "Coordinate, timezone, elevation and canonical identity"],
  ["now", "Current weather and air-quality conditions"],
  ["conditions", "12-hour weather/air outlook and three-day context"],
  ["hazards", "Official alerts, recent earthquakes and NASA natural events"],
  ["water", "Nearby NOAA river/flood gauges when applicable"],
  ["official", "Official NWS forecast/zone context when applicable"],
  ["events", "Configured nearby event feeds when available"],
  ["machineFeeds", "Additional geographically mapped public machine feeds"],
] as const;

const SOURCES = [
  "Open-Meteo weather",
  "Open-Meteo / Copernicus CAMS air quality",
  "U.S. National Weather Service forecasts + alerts",
  "U.S. Geological Survey earthquakes",
  "NASA EONET natural events",
  "NOAA National Water Prediction Service gauges",
] as const;

export default function DevelopersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": "https://destinationcommandcenter.com/developers#article",
        url: "https://destinationcommandcenter.com/developers",
        name: "DCC Developers | Dense Coordinate Location API",
        headline: "One coordinate in. Dense public context out.",
        description: "Use latitude and longitude to retrieve dense public location intelligence from Destination Command Center.",
        isPartOf: { "@id": "https://destinationcommandcenter.com/#website" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Destination Command Center", item: "https://destinationcommandcenter.com/" },
          { "@type": "ListItem", position: 2, name: "Developers", item: "https://destinationcommandcenter.com/developers" },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Destination Command Center · Developers</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">One coordinate in. Dense public context out.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/58">
          Latitude and longitude are the canonical DCC location key. If you know a coordinate, you do not need to know which public weather, alert, earth, water, air-quality, event, or local source covers it. DCC selects the geographically applicable sources and returns one predictable location object.
        </p>

        <section className="mt-10 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.055] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">Canonical contract</p>
            <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100/65">dcc-location-v2</span>
          </div>
          <div className="mt-5 space-y-3 font-mono text-sm text-cyan-50">
            <p>Human: /location/{"{lat}"}/{"{lng}"}</p>
            <p>JSON: /api/location/{"{lat}"}/{"{lng}"}</p>
            <p>Precision: 5 decimal places</p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">Human page</p>
            <code className="mt-4 block break-all rounded-xl bg-black/30 p-4 text-sm text-white/72">https://destinationcommandcenter.com/location/{exampleLat}/{exampleLng}</code>
            <Link href={`/location/${exampleLat}/${exampleLng}`} className="mt-5 inline-flex text-sm font-black text-cyan-200">Open example →</Link>
          </article>
          <article className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">Machine endpoint</p>
            <code className="mt-4 block break-all rounded-xl bg-black/30 p-4 text-sm text-white/72">https://destinationcommandcenter.com/api/location/{exampleLat}/{exampleLng}</code>
            <a href={`/api/location/${exampleLat}/${exampleLng}`} className="mt-5 inline-flex text-sm font-black text-cyan-200">Open JSON →</a>
          </article>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Ordered response modules</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/48">Read the <code className="text-cyan-100">modules</code> object first. DCC returns only what mapped sources can support for that coordinate.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {MODULES.map(([name, description]) => (
              <div key={name} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <code className="text-sm font-black text-cyan-100">{name}</code>
                <p className="mt-2 text-xs leading-5 text-white/42">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Current core public sources</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {SOURCES.map((source) => (
              <div key={source} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/62">{source}</div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-white/42">Each response includes per-source availability and checked timestamps. DCC uses source-specific revalidation plus a short shared response cache so repeated agent reads do not hammer public upstream services.</p>
        </section>

        <section className="mt-8 rounded-[28px] border border-cyan-400/20 bg-cyan-500/[0.04] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">OCTO Core API & Booking Distribution</h2>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
              5% Fixed DCC Share
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            DCC provides an authorized distribution layer built on the Open Connectivity for Tour Operators (OCTO) standard.
            AI agents and applications query live operator availability and execute two-phase booking holds with explicit
            <code className="text-cyan-200"> expirationMinutes</code>. Operators retain merchant-of-record status and direct fulfillment authority.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">GET /api/octo/participants</span>
              <p className="mt-1 text-xs text-white/60">Registry of authorized operators, booking systems, and tech partners.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">POST /api/octo/availability</span>
              <p className="mt-1 text-xs text-white/60">Real-time availability check against upstream operator reservation systems.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">POST /api/octo/hold</span>
              <p className="mt-1 text-xs text-white/60">Two-phase reservation hold reserving seats for a 15-minute checkout window.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">POST /api/octo/confirm</span>
              <p className="mt-1 text-xs text-white/60">Confirm held reservation, generate digital voucher, and record 5% settlement.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-emerald-400/20 bg-emerald-500/[0.04] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">Cruise Port-Day Excursion API &amp; Standard MCP Server</h2>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              MCP 2025-03-26 · REST + JSON-RPC 2.0
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            Standard MCP clients connect to <code className="text-emerald-200">/api/v1/mcp</code> (<code className="text-emerald-200">initialize</code> → <code className="text-emerald-200">notifications/initialized</code> → <code className="text-emerald-200">tools/list</code> → <code className="text-emerald-200">tools/call</code>) or call the REST endpoint <code className="text-emerald-200">/api/v1/cruise/port-day-excursions</code> directly. Timing fit (<code className="text-emerald-200">fits</code>, <code className="text-emerald-200">runs_too_late</code>, <code className="text-emerald-200">needs_verification</code>) is evaluated deterministically and kept strictly separate from read-only live seat/price availability (<code className="text-emerald-200">remainingSeats: null</code> when seat count is unknown). Checkout handoffs are created only when the traveler explicitly chooses <strong>Continue to checkout</strong> via <code className="text-emerald-200">dcc_prepare_tour_checkout</code>.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">GET /api/v1/cruise/port-day-excursions · MCP: dcc_search_port_excursions</span>
              <p className="mt-1 text-xs text-white/60">SQL-backed port-day excursion search and sailing-window timing fit evaluator. Labels blank all-aboard times as port estimates with <code className="text-emerald-200">needs_verification</code>.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">POST /api/v1/cruise/port-day-excursions · MCP: dcc_check_tour_availability</span>
              <p className="mt-1 text-xs text-white/60">Strictly read-only (<code className="text-emerald-200">readOnly: true</code>) live availability check for an exact product option, date, departure time, and party size. Never creates a commercial handoff.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">MCP: dcc_prepare_tour_checkout (New Orleans 15200P6 / TG10)</span>
              <p className="mt-1 text-xs text-white/60">After the traveler approves checkout, validates timing fit and live availability, resolves provider URL and affiliate account server-side, and returns <code className="text-emerald-200">handoffId</code>, <code className="text-emerald-200">clickId</code>, and the durable record&apos;s absolute <code className="text-emerald-200">outboundAffiliateUrl</code>.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">1. Runnable REST Examples (New Orleans · Product 15200P6 · Option TG10 · 08:00 Departure)</p>
              <pre className="mt-3 overflow-x-auto text-xs leading-5 text-cyan-100">{`# A) 1:15 p.m. (13:15) All Aboard -> status: "fits" (returns to pier at 12:15 with +60m buffer)
curl -s "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions?port=new-orleans&date=2027-07-15&shipArrival=07:00&allAboard=13:15&partySize=2&productCode=15200P6"

# B) 1:14 p.m. (13:14) All Aboard -> status: "runs_too_late" (+59m buffer < 60m required)
curl -s "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions?port=new-orleans&date=2027-07-15&shipArrival=07:00&allAboard=13:14&partySize=2&productCode=15200P6"

# C) Blank All Aboard -> status: "needs_verification", shipAllAboardTimeLabel: "15:30 (port estimate)"
curl -s "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions?port=new-orleans&date=2027-07-15&shipArrival=07:00&partySize=2&productCode=15200P6"

# D) Read-Only Live Availability Check (Option TG10, 2027-07-15, 08:00, Party Size 3 — separate from timing fit)
curl -s -X POST "https://www.destinationcommandcenter.com/api/v1/cruise/port-day-excursions" \\
  -H "Content-Type: application/json" \\
  -d '{"port":"new-orleans","productCode":"15200P6","optionCode":"TG10","date":"2027-07-15","departureTime":"08:00","partySize":3}'`}</pre>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">2. Runnable MCP Client Handshake &amp; Tool Calls (POST /api/v1/mcp)</p>
              <pre className="mt-3 overflow-x-auto text-xs leading-5 text-cyan-100">{`# 1. Initialize MCP session
curl -s -X POST "https://www.destinationcommandcenter.com/api/v1/mcp" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"mcp-client","version":"1.0.0"}}}'

# 2. Send notifications/initialized
curl -s -X POST "https://www.destinationcommandcenter.com/api/v1/mcp" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'

# 3. List tools (includes dcc_search_port_excursions, dcc_check_tour_availability, and dcc_prepare_tour_checkout)
curl -s -X POST "https://www.destinationcommandcenter.com/api/v1/mcp" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# 4. Call dcc_search_port_excursions (1:15 p.m. -> fits | 1:14 p.m. -> runs_too_late | blank -> needs_verification)
curl -s -X POST "https://www.destinationcommandcenter.com/api/v1/mcp" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"dcc_search_port_excursions","arguments":{"port":"new-orleans","date":"2027-07-15","shipArrival":"07:00","allAboard":"1:15 p.m.","partySize":3,"productCode":"15200P6"}}}'

# 5. Call dcc_check_tour_availability (Read-only — Option TG10, 2027-07-15, 08:00, partySize 3)
curl -s -X POST "https://www.destinationcommandcenter.com/api/v1/mcp" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"dcc_check_tour_availability","arguments":{"port":"new-orleans","productCode":"15200P6","optionCode":"TG10","date":"2027-07-15","departureTime":"08:00","partySize":3}}}'

# 6. Call dcc_prepare_tour_checkout (Continue to checkout — idempotent, returns handoffId, clickId, and absolute outboundAffiliateUrl)
curl -s -X POST "https://www.destinationcommandcenter.com/api/v1/mcp" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $DCC_COMMERCE_API_KEY" \\
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"dcc_prepare_tour_checkout","arguments":{"port":"new-orleans","productCode":"15200P6","optionCode":"TG10","date":"2027-07-15","departureTime":"08:00","partySize":3,"shipArrival":"07:00","allAboard":"15:30","travelerApprovedCheckout":true,"idempotencyKey":"nola-15200p6-tg10-2027-07-15-p3-001"}}}'`}</pre>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">3A. Claude Remote MCP Connector</p>
                <p className="mt-2 text-xs leading-5 text-white/65">
                  In Claude Desktop or Claude Web (<a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" className="underline text-cyan-200">Custom Connectors using Remote MCP</a>), open <strong>Settings → Integrations / Connectors → Add Custom Connector</strong> and enter:
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-2.5 text-[11px] leading-5 text-cyan-100">{`Name: Destination Command Center
Remote MCP URL:
https://www.destinationcommandcenter.com/api/v1/mcp`}</pre>
                <p className="mt-2 text-[11px] leading-4 text-white/50">
                  Tested with Streamable HTTP JSON-RPC 2.0 (<code className="text-emerald-200">2025-03-26</code>). Read tools work without credentials; pass <code className="text-emerald-200">Authorization: Bearer &lt;token&gt;</code> for higher partner rate tiers.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">3B. Cursor MCP Configuration</p>
                <p className="mt-2 text-xs leading-5 text-white/65">
                  Add DCC&apos;s remote Streamable HTTP MCP server to <code className="text-cyan-200">.cursor/mcp.json</code> (or global <code className="text-cyan-200">~/.cursor/mcp.json</code>):
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-2.5 text-[11px] leading-5 text-cyan-100">{`{
  "mcpServers": {
    "destination-command-center": {
      "url": "https://www.destinationcommandcenter.com/api/v1/mcp"
    }
  }
}`}</pre>
                <p className="mt-2 text-[11px] leading-4 text-white/50">
                  Cursor automatically runs <code className="text-emerald-200">initialize</code>, <code className="text-emerald-200">notifications/initialized</code>, and <code className="text-emerald-200">tools/list</code> and exposes <code className="text-emerald-200">dcc_search_port_excursions</code>, <code className="text-emerald-200">dcc_check_tour_availability</code>, and <code className="text-emerald-200">dcc_prepare_tour_checkout</code>.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">3C. OpenAI Plugins &amp; Remote MCP</p>
                <p className="mt-2 text-xs leading-5 text-white/65">
                  Designed around OpenAI&apos;s transition from legacy Custom GPT Actions toward first-class <strong>MCP / Plugin Connectors</strong> in the Responses API and ChatGPT connectors:
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-2.5 text-[11px] leading-5 text-cyan-100">{`{
  "type": "mcp",
  "server_label": "dcc_port_excursions",
  "server_url": "https://www.destinationcommandcenter.com/api/v1/mcp",
  "require_approval": {
    "never": {
      "tool_names": [
        "dcc_search_port_excursions",
        "dcc_check_tour_availability"
      ]
    }
  }
}`}</pre>
                <p className="mt-2 text-[11px] leading-4 text-white/50">
                  Keep <code className="text-emerald-200">dcc_prepare_tour_checkout</code> gated behind traveler confirmation, or import <code className="text-emerald-200">/openapi.json</code> for REST plugin runtimes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Machine discovery</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Agent contract", "/agent.json"],
              ["Well-known agent contract", "/.well-known/agent.json"],
              ["MCP Discovery Manifest", "/.well-known/mcp.json"],
              ["MCP JSON-RPC Endpoint", "/api/v1/mcp"],
              ["Port-Day Excursions API", "/api/v1/cruise/port-day-excursions?port=new-orleans&limit=1"],
              ["LLM instructions", "/llms.txt"],
              ["OpenAPI schema", "/openapi.json"],
              ["API Catalog (RFC 9264)", "/.well-known/api-catalog"],
              ["OCTO Participant Registry", "/api/octo/participants"],
              ["Authorized Operators", "/operators"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.05]">
                <strong className="text-sm text-white">{label}</strong>
                <code className="mt-2 block text-xs text-white/42">{href}</code>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-2xl font-black">How to interpret a response</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/52">
            DCC aggregates time-sensitive public-source observations. Use provider names, timestamps, freshness fields, and source links when available. A missing module means DCC does not currently have a mapped usable source for that coordinate; it does not prove that the real-world condition or service is absent. Machine coordinate reads do not require reverse geocoding; a human-readable place name is optional.
          </p>
        </section>
      </div>
    </main>
  );
}
