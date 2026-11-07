import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const MAX_VIDEO_SECONDS = 60;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const videoDurationSchema = z.number().finite().positive().max(MAX_VIDEO_SECONDS, "Keep your video to 60 seconds or less.");
export type WishVideo = { file: File; duration: number };

export async function inspectVideo(file: File): Promise<WishVideo> {
  if (!file.type.startsWith("video/")) throw new Error("Choose a video file, such as MP4, MOV or WebM.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Choose a video under 50MB.");
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("This video could not be read. Try an MP4 or a new recording.")), 20_000);
      const finish = (error?: Error) => {
        window.clearTimeout(timeout);
        if (error) reject(error); else resolve(video.duration);
      };
      video.onerror = () => finish(new Error("This video could not be read. Try an MP4 or a new recording."));
      video.onloadeddata = () => {
        if (!video.videoWidth || !video.videoHeight) { finish(new Error("Choose a video with a picture, not an audio-only file.")); return; }
        // MediaRecorder WebM files can omit duration. Seek to discover the final timestamp.
        if (!Number.isFinite(video.duration)) video.currentTime = 1e10;
        else finish();
      };
      video.ontimeupdate = () => { if (Number.isFinite(video.duration)) finish(); };
      video.src = url;
    });
    const result = videoDurationSchema.safeParse(duration);
    if (!result.success) throw new Error("Keep your video to 60 seconds or less.");
    return { file, duration };
  } finally {
    video.onloadeddata = null; video.onerror = null; video.ontimeupdate = null;
    video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url);
  }
}

export async function uploadWishVideo(userId: string, video: WishVideo) {
  const checked = await inspectVideo(video.file);
  const mime = checked.file.type.split(";")[0];
  const ext = mime === "video/mp4" ? "mp4" : mime === "video/quicktime" ? "mov" : mime === "video/ogg" ? "ogv" : "webm";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("wish-video").upload(path, checked.file, { contentType: checked.file.type, upsert: false });
  if (error) throw error;
  return { video_path: path, video_duration_seconds: checked.duration };
}