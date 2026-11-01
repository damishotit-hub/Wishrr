import { describe, expect, test } from "bun:test";
import { voiceDurationSchema } from "./wish-audio";

describe("wish voice duration", () => {
  test("accepts a voice message exactly 60 seconds long", () => {
    expect(voiceDurationSchema.safeParse(60).success).toBe(true);
  });
  test("rejects audio longer than 60 seconds", () => {
    expect(voiceDurationSchema.safeParse(60.01).success).toBe(false);
  });
  test("rejects missing or unreadable audio duration", () => {
    for (const duration of [0, -1, Infinity, NaN]) expect(voiceDurationSchema.safeParse(duration).success).toBe(false);
  });
});