import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getDccAuthorityScorecard } from "../../lib/dcc/commerce/opaqueAttributionLedger";
import { getColoradoTransferRecommendationActions } from "../../lib/dcc/handoffAnalytics";

const ROOT = process.cwd();

describe("DCC Public Authority Release & 3-Stage Portfolio Scorecard", () => {
  it("New Orleans public DCC authority pages answer the decision directly, show verified evidence, and route travelers to WNO", () => {
    const nolaToursSrc = fs.readFileSync(
      path.join(ROOT, "app/new-orleans/tours/page.tsx"),
      "utf8",
    );
    assert.match(nolaToursSrc, /data-testid="dcc-nola-authority-brief"/);
    assert.match(nolaToursSrc, /15200P6/);
    assert.match(nolaToursSrc, /TG10/);
    assert.match(nolaToursSrc, /6953SWAMPTRANS/);
    assert.match(nolaToursSrc, /Feb 2, 2026/);
    assert.match(
      nolaToursSrc,
      /https:\/\/www\.welcometoneworleanstours\.com\/swamp-tours\?src=dcc-authority-nola-tours/,
    );

    const nolaSwampSrc = fs.readFileSync(
      path.join(ROOT, "app/new-orleans/swamp-tours/page.tsx"),
      "utf8",
    );
    assert.match(nolaSwampSrc, /data-testid="dcc-to-wno-swamp-cta"/);
    assert.match(nolaSwampSrc, /src=dcc-authority-swamp-tours&from=dcc-swamp-tours/);

    const bridgeSrc = fs.readFileSync(
      path.join(ROOT, "app/new-orleans/swamp-tours/BridgePageTemplate.tsx"),
      "utf8",
    );
    assert.match(bridgeSrc, /data-testid="dcc-bridge-to-wno-swamp"/);
    assert.match(bridgeSrc, /15200P6/);
    assert.match(bridgeSrc, /Feb 2, 2026/);

    const hubSrc = fs.readFileSync(
      path.join(ROOT, "app/new-orleans/page.tsx"),
      "utf8",
    );
    assert.match(hubSrc, /data-testid="dcc-new-orleans-hub-authority-card"/);
    assert.match(hubSrc, /data-testid="dcc-hub-to-wno-swamp"/);

    // AI-referred routes exist and do not 404
    assert.equal(
      fs.existsSync(
        path.join(ROOT, "app/new-orleans/swamp-tours/best-swamp-tours/page.tsx"),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(path.join(ROOT, "app/new-orleans-swamp-tours/page.tsx")),
      true,
    );
  });

  it("Colorado & Cruise public DCC pages answer the decision with verified evidence and route to GoSno and Cruise Promenade", () => {
    const coloradoSrc = fs.readFileSync(
      path.join(ROOT, "app/transportation/colorado/page.tsx"),
      "utf8",
    );
    assert.match(coloradoSrc, /data-testid="dcc-colorado-authority-brief"/);
    assert.match(coloradoSrc, /C\.R\.S\. § 42-4-106/);
    assert.match(coloradoSrc, /https:\/\/gosno\.co\/vail/);
    assert.match(coloradoSrc, /https:\/\/gosno\.co\/breckenridge/);

    const actions = getColoradoTransferRecommendationActions();
    const gosnoAction = actions.find((a) => a.id === "gosno-execution");
    assert.ok(gosnoAction);
    assert.match(gosnoAction.href, /^https:\/\/gosno\.co\/vail\?/);

    const cruiseSrc = fs.readFileSync(
      path.join(ROOT, "app/cruises/shore-excursions/page.tsx"),
      "utf8",
    );
    assert.match(cruiseSrc, /data-testid="dcc-cruise-authority-brief"/);
    assert.match(cruiseSrc, /2-hour/);
    assert.match(cruiseSrc, /120-minute/);
    assert.match(
      cruiseSrc,
      /https:\/\/cruisepromenade\.com\/p\/INDY-2027-01-24\?src=dcc-authority-cruise/,
    );
  });

  it("getDccAuthorityScorecard returns the 3-stage scorecard (foundDcc -> choseNextStep -> bookedWhereVerifiable) separated by production and test", () => {
    const scorecard = getDccAuthorityScorecard();
    assert.ok(scorecard.generatedAt);
    assert.ok(scorecard.production.foundDcc);
    assert.ok(scorecard.production.choseNextStep);
    assert.ok(scorecard.production.bookedWhereVerifiable);
    assert.ok(scorecard.test.foundDcc);
    assert.ok(scorecard.test.choseNextStep);
    assert.ok(scorecard.test.bookedWhereVerifiable);
    assert.equal(
      typeof scorecard.production.foundDcc.byMarket.newOrleans.visitors,
      "number",
    );
    assert.equal(
      typeof scorecard.production.choseNextStep.wnoStorefrontHandoffs,
      "number",
    );
    assert.equal(
      typeof scorecard.production.choseNextStep.gosnoHandoffs,
      "number",
    );
    assert.equal(
      typeof scorecard.production.choseNextStep.cruisePromenadeHandoffs,
      "number",
    );
    assert.equal(
      typeof scorecard.production.bookedWhereVerifiable.confirmedBookings,
      "number",
    );
  });
});
