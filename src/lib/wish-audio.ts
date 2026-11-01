import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const MAX_VOICE_SECONDS = 60;
export const voiceDurationSchema = z.number().finite().positive().max(MAX_VOICE_SECONDS, "Keep your voice message to 60 seconds or less.");
export type WishVoice = { file: File; duration: number };

export async function inspectVoice(file: File): Promise<WishVoice> {
  if (!file.type.startsWith("audio/")) throw new Error("Choose an audio file, such as MP3, M4A, WAV or WebM.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose an audio file under 10MB.");
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const result = voiceDurationSchema.safeParse(decoded.duration);
    if (!result.success) throw new Error("Keep your voice message to 60 seconds or less.");
    return { file, duration: decoded.duration };
  } catch (error) {
    if (error instanceof Error && error.message.includes("60 seconds")) throw error;
    throw new Error("This audio could not be read. Try an MP3, M4A, WAV or a new recording.");
  } finally {
    await context.close();
  }
}

export async function uploadWishVoice(userId: string, voice: WishVoice) {
  // Re-read the actual file before upload rather than trusting a supplied duration.
  const checked = await inspectVoice(voice.file);
  const mime = checked.file.type.split(";")[0];
  const ext = mime === "audio/mpeg" ? "mp3" : mime === "audio/mp4" ? "m4a" : mime === "audio/wav" ? "wav" : mime === "audio/ogg" ? "ogg" : "webm";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("wish-audio").upload(path, checked.file, { contentType: checked.file.type, upsert: false });
  if (error) throw error;
  return { audio_path: path, audio_duration_seconds: checked.duration };
}