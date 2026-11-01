import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { voiceDurationSchema } from "./wish-audio";

describe("wish voice duration", () => {
  test("accepts a voice message exactly 60 seconds long", () => {
    assert.equal(voiceDurationSchema.safeParse(60).success, true);
  });
  test("rejects audio longer than 60 seconds", () => {
    assert.equal(voiceDurationSchema.safeParse(60.01).success, false);
  });
  test("rejects missing or unreadable audio duration", () => {
    for (const duration of [0, -1, Infinity, NaN]) assert.equal(voiceDurationSchema.safeParse(duration).success, false);
  });
});