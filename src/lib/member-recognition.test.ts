import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { memberRecognitions } from "./member-recognition";

describe("member recognition", () => {
  it("recognizes wishers as receivers", () => {
    assert.deepEqual(memberRecognitions(true, false), ["receiver"]);
  });
  it("recognizes giveaway hosts as givers", () => {
    assert.deepEqual(memberRecognitions(false, true), ["giver"]);
  });
  it("allows the same member to give and receive", () => {
    assert.deepEqual(memberRecognitions(true, true), ["giver", "receiver"]);
  });
  it("does not invent activity for new members", () => {
    assert.deepEqual(memberRecognitions(false, false), []);
  });
});