import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const SATELLITES = [
  {
    id: "wno-tours",
    agent: "apps/welcometoneworleanstours/app/agent.json/route.ts",
    llms: "apps/welcometoneworleanstours/app/llms.txt/route.ts",
  },
  {
    id: "welcome-to-the-dells",
    agent: "apps/welcometothedells/app/agent.json/route.ts",
    llms: "apps/welcometothedells/app/llms.txt/route.ts",
  },
  {
    id: "welcome-to-the-swamp",
    agent: "apps/welcometotheswamp/app/agent.json/route.ts",
    llms: "apps/welcometotheswamp/app/llms.txt/route.ts",
  },
  {
    id: "french-quarter-orientation",
    agent: "apps/frenchquarterorientation/app/agent.json/route.ts",
    llms: "apps/frenchquarterorientation/app/llms.txt/route.ts",
  },
  {
    id: "juneau-flight-deck",
    agent: "apps/juneauflightdeck/app/agent.json/route.ts",
    llms: "apps/juneauflightdeck/app/llms.txt/route.ts",
  },
  {
    id: "last-frontier-shore-excursions",
    agent: "apps/last-frontier-shore-excursions/app/agent.json/route.ts",
    llms: "apps/last-frontier-shore-excursions/app/llms.txt/route.ts",
  },
  {
    id: "save-on-the-strip",
    agent: "apps/saveonthestrip/app/agent.json/route.ts",
    llms: "apps/saveonthestrip/app/llms.txt/route.ts",
  },
  {
    id: "420-friendly-airport-pickup",
    agent: "apps/420-airport-pickup/app/agent.json/route.ts",
    llms: "apps/420-airport-pickup/app/llms.txt/route.ts",
  },
] as const;

async function source(pathname: string) {
  return readFile(new URL(`../../${pathname}`, import.meta.url), "utf8");
}

test("remaining satellite machine surfaces point to their canonical DCC truth record", async () => {
  for (const satellite of SATELLITES) {
    const expected = `/api/public/truth-feed?id=${satellite.id}`;
    const [agentSource, llmsSource] = await Promise.all([
      source(satellite.agent),
      source(satellite.llms),
    ]);

    assert.match(agentSource, new RegExp(expected.replace(/[?]/g, "\\?")), `${satellite.id} agent missing truth record`);
    assert.match(llmsSource, new RegExp(expected.replace(/[?]/g, "\\?")), `${satellite.id} llms missing truth record`);
    assert.match(agentSource, /dcc-site-contract/);
  }
});
