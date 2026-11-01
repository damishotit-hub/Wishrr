import { useEffect, useRef, useState } from "react";
import { Mic, Square, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectVoice, MAX_VOICE_SECONDS, type WishVoice } from "@/lib/wish-audio";

export function WishVoiceInput({ value, onChange, disabled = false }: { value: WishVoice | null; onChange: (voice: WishVoice | null) => void; disabled?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [checking, setChecking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const limit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    if (!value) { setPreview(null); return; }
    const url = URL.createObjectURL(value.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearInterval(timer.current);
      if (limit.current) clearTimeout(limit.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function select(file: File) {
    setChecking(true); setError(null);
    try {
      const voice = await inspectVoice(file);
      if (mounted.current) onChange(voice);
    } catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "Could not read the audio."); }
    finally { if (mounted.current) setChecking(false); }
  }

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording isn't supported here. You can upload an audio file instead."); return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
      const active = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = active;
      const chunks: Blob[] = [];
      active.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      active.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        if (limit.current) clearTimeout(limit.current);
        media.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        setRecording(false);
        void select(new File(chunks, "wish-voice", { type: active.mimeType || "audio/webm" }));
      };
      active.start();
      setRecording(true); setSeconds(0);
      const started = Date.now();
      timer.current = setInterval(() => setSeconds(Math.min(MAX_VOICE_SECONDS, Math.floor((Date.now() - started) / 1000))), 200);
      // Leave room for the audio encoder's final frame within the 60-second limit.
      limit.current = setTimeout(() => { if (active.state === "recording") active.stop(); }, 59_500);
    } catch { stream.current?.getTracks().forEach((track) => track.stop()); setError("Microphone access was not available. Allow access or upload an audio file."); }
  }

  return <fieldset className="min-w-0 space-y-3 border-t border-line pt-4" disabled={disabled}>
    <legend className="font-display text-lg font-bold">Voice message (optional)</legend>
    <p className="text-xs text-mute">Your story, in your own voice. Up to 60 seconds. Avoid sharing bank details, phone numbers or addresses.</p>
    <div className="flex flex-wrap items-center gap-2">
      {recording ? <Button type="button" variant="destructive" onClick={() => recorder.current?.stop()}><Square className="size-4" />Stop recording · {seconds}s / 60s</Button> : <Button type="button" variant="secondary" disabled={checking} onClick={() => void start()}><Mic className="size-4" />{value ? "Record again" : "Record voice"}</Button>}
      <Button type="button" variant="outline" disabled={recording || checking} onClick={() => input.current?.click()}><Upload className="size-4" />Upload audio</Button>
      {value && !recording ? <Button type="button" variant="ghost" size="icon" disabled={checking} onClick={() => onChange(null)} aria-label="Remove voice message"><X className="size-4" /></Button> : null}
      <input ref={input} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm" aria-label="Upload voice message" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void select(file);
        event.target.value = "";
      }} />
    </div>
    {checking ? <p role="status" className="text-xs text-mute">Checking audio…</p> : null}
    {preview && !recording ? <div><audio controls src={preview} className="h-10 w-full" aria-label="Preview voice message" /><p className="mt-1 text-xs text-mute">{Math.ceil(value?.duration ?? 0)} seconds</p></div> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </fieldset>;
}