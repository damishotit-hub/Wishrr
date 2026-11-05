import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { bestEffortFingerprint, hashBrowserSignals, type BrowserSignals } from "./device-fingerprint";

const device: BrowserSignals = {
  userAgent: "Test browser", language: "en-NG", screenWidth: 390, screenHeight: 844,
  colorDepth: 24, timezone: "Africa/Lagos", hardwareConcurrency: 8, maxTouchPoints: 5,
};

describe("signup browser fingerprint", () => {
  it("matches shared browser signals across duplicate registrations", async () => {
    const first = await hashBrowserSignals(device);
    assert.match(first, /^[a-f0-9]{64}$/);
    assert.equal(await hashBrowserSignals({ ...device }), first);
  });
  it("keeps the same hash when a shared phone rotates", async () => {
    assert.equal(await hashBrowserSignals(device), await hashBrowserSignals({ ...device, screenWidth: 844, screenHeight: 390 }));
  });
  it("distinguishes different browser signals", async () => {
    assert.notEqual(await hashBrowserSignals(device), await hashBrowserSignals({ ...device, userAgent: "Other browser" }));
  });
  it("does not stop signup when fingerprint generation fails", async () => {
    assert.equal(await bestEffortFingerprint(async () => { throw new Error("Unavailable"); }), null);
  });
});