import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { inspectVideo, MAX_VIDEO_BYTES, videoDurationSchema } from "./wish-video";

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
  test("rejects audio uploads instead of accepting them as video", async () => {
    await assert.rejects(inspectVideo(new File(["audio"], "note.mp3", { type: "audio/mpeg" })), /Choose a video file/);
  });
  test("rejects video files over the storage limit", async () => {
    const file = new File([], "large.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: MAX_VIDEO_BYTES + 1 });
    await assert.rejects(inspectVideo(file), /under 50MB/);
  });
});