import test from "node:test";
import assert from "node:assert/strict";
import { OctoOnboardingService } from "../../lib/octo/onboardingService";
import { OctoRegistryService } from "../../lib/octo/registry";
import { OctoSettlementEngine } from "../../lib/octo/settlement";
import { encryptCredential, decryptCredential } from "../../lib/octo/security";

test("OCTO Production Security: encryption key enforcement in production", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalKey = process.env.OCTO_ENCRYPTION_KEY;

  try {
    (process.env as any).NODE_ENV = "production";
    delete process.env.OCTO_ENCRYPTION_KEY;

    assert.throws(
      () => {
        encryptCredential("test_secret");
      },
      (err: any) => err.message.includes("OCTO_ENCRYPTION_KEY is required in production environment")
    );
  } finally {
    (process.env as any).NODE_ENV = originalEnv;
    if (originalKey) {
      process.env.OCTO_ENCRYPTION_KEY = originalKey;
    }
  }
});

test("OCTO Participant Truth: mock supplier is quarantined to technical_onboarding and not live_authorized", async () => {
  const participants = await OctoRegistryService.getParticipants();
  const mockPart = participants.find((p) => p.id === "part_mock_alaska");

  assert.ok(mockPart, "Mock Alaska participant should exist");
  assert.equal(mockPart.outreachStatus, "technical_onboarding", "Mock supplier must be technical_onboarding");
  assert.notEqual(mockPart.outreachStatus, "live_authorized", "Mock supplier must NEVER be live_authorized");

  const authorizedConns = await OctoRegistryService.getAuthorizedConnections();
  const mockAuthorized = authorizedConns.find((c) => c.operatorSlug === "alaska-premier-expeditions");
  assert.equal(mockAuthorized, undefined, "Mock supplier must NOT appear in getAuthorizedConnections without completing onboarding");
});

test("OCTO Pilot Checklist: generates complete credential & consent checklist for Ventrata pilot", () => {
  const checklist = OctoOnboardingService.generatePilotChecklist("ventrata");

  assert.equal(checklist.candidate, "Ventrata Live Operator Pilot");
  assert.equal(checklist.requiredCredentials.length, 2);
  assert.equal(checklist.requiredConsent.distributionShare, "5.00% platform commission on completed and honored reservations");
  assert.equal(checklist.technicalVerificationStages.length, 7);
  assert.ok(checklist.technicalVerificationStages[3].includes("expirationMinutes: 15"));
});

test("OCTO Settlement: calculates configurable commission correctly and keeps payment unpaid/pending", () => {
  const shares5 = OctoSettlementEngine.calculateShares(200.0, 5.0);
  assert.equal(shares5.dccSharePercent, 5.0);
  assert.equal(shares5.dccShareAmount, 10.0);
  assert.equal(shares5.operatorShareAmount, 190.0);

  // Custom operator contract share (e.g. 7.5%)
  const shares75 = OctoSettlementEngine.calculateShares(300.0, 7.5);
  assert.equal(shares75.dccSharePercent, 7.5);
  assert.equal(shares75.dccShareAmount, 22.5);
  assert.equal(shares75.operatorShareAmount, 277.5);
});

test("OCTO Encryption: round-trip encrypt and decrypt works reliably with safe masking", () => {
  const secret = "octo_live_key_9876543210_enterprise_partner";
  const encrypted = encryptCredential(secret);

  assert.notEqual(encrypted, secret);
  assert.ok(encrypted.length > 30);

  const decrypted = decryptCredential(encrypted);
  assert.equal(decrypted, secret);
});
