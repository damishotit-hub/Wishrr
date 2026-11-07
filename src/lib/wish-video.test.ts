import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { videoDurationSchema } from "./wish-video";

describe("wish video duration", () => {
  test("accepts video exactly 60 seconds long", () => {
    assert.equal(videoDurationSchema.safeParse(60).success, true);
  });
  test("rejects video longer than 60 seconds", () => {
    assert.equal(videoDurationSchema.safeParse(60.01).success, false);
  });
  test("rejects missing or unreadable duration", () => {
    for (const duration of [0, -1, Infinity, NaN]) assert.equal(videoDurationSchema.safeParse(duration).success, false);
  });
});