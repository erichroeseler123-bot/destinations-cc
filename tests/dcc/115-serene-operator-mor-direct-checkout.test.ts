import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDirectJuneauRezgoHostedCheckoutUrl,
  getSereneRezgoReadinessStatus,
} from "@/lib/dcc/liveSlots/rezgoReadOnly";

const AUTHORIZED_HOSTED_CHECKOUT_ENV = {
  REZGO_SERENE_CID: "CID_TEST_01",
  REZGO_SERENE_API_KEY: "SERENE_API_KEY_TEST_12345",
  REZGO_SERENE_READONLY_INSPECTED: "true",
  REZGO_SERENE_PRODUCT_MAPPING_VERIFIED: "true",
  REZGO_SERENE_WRITTEN_COMMISSION_CONFIRMED: "true",
  REZGO_SERENE_REFID: "dccjuneau10",
  REZGO_SERENE_DIRECT_HOSTED_CHECKOUT_ENABLED: "true",
};

test("Serene hosted checkout keeps Juneau Tours as merchant of record and does not require DCC API booking mutations", () => {
  const readiness = getSereneRezgoReadinessStatus(AUTHORIZED_HOSTED_CHECKOUT_ENV);

  assert.equal(readiness.stage, "direct_hosted_checkout_live_operator_mor");
  assert.equal(readiness.directHostedCheckoutAllowed, true);
  assert.equal(readiness.liveBookingAllowed, false);
  assert.equal(readiness.directHostedCommercialModel.merchantOfRecord, "operator");
  assert.equal(readiness.directHostedCommercialModel.customerFundsCapturedByDccOrCp, false);
  assert.equal(readiness.directHostedCommercialModel.commissionPercent, 10);
  assert.equal(
    readiness.directHostedCommercialModel.commissionEarnedOn,
    "completed_non_refunded_bookings",
  );
  assert.deepEqual(readiness.directHostedCommercialModel.noCommissionEvents, [
    "cancelled",
    "refunded",
    "disputed",
    "chargeback",
    "not_successfully_fulfilled",
  ]);
});

test("direct checkout uses exact Rezgo option/date/party and an alphanumeric Ref ID", () => {
  assert.equal(
    buildDirectJuneauRezgoHostedCheckoutUrl({
      domain: "juneauwhalewatch.rezgo.com",
      rezgoCom: "31703",
      optionUid: "325257",
      serviceDate: "2027-07-15",
      partySize: 4,
      refId: "dccjuneau10",
    }),
    "https://juneauwhalewatch.rezgo.com/details/31703/juneau-whale-watch-tour/325257/2027-07-15?refid=dccjuneau10&adult_num=4",
  );

  assert.equal(
    buildDirectJuneauRezgoHostedCheckoutUrl({
      domain: "juneauwhalewatch.rezgo.com",
      rezgoCom: "31703",
      optionUid: "325257",
      serviceDate: "2027-07-15",
      partySize: 4,
      refId: "invalid_ref_id",
    }),
    null,
  );

  assert.equal(
    buildDirectJuneauRezgoHostedCheckoutUrl({
      domain: "phishing.example.com",
      rezgoCom: "31703",
      optionUid: "325257",
      serviceDate: "2027-07-15",
      partySize: 4,
      refId: "dccjuneau10",
    }),
    null,
  );
});
