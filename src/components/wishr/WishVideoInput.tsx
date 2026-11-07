import { useEffect, useRef, useState } from "react";
import { Camera, Square, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectVideo, MAX_VIDEO_SECONDS, type WishVideo } from "@/lib/wish-video";

export function WishVideoInput({ value, onChange, disabled = false, onBusyChange }: { value: WishVideo | null; onChange: (video: WishVideo | null) => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [recording, setRecording] = useState(false);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const limit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const cameraInput = useRef<HTMLInputElement | null>(null);
  const cameraPreview = useRef<HTMLVideoElement | null>(null);
  const mounted = useRef(true);
  useEffect(() => { onBusyChange?.(recording || checking || starting); }, [recording, checking, starting, onBusyChange]);
  useEffect(() => {
    if (!value) { setPreview(null); return; }
    const url = URL.createObjectURL(value.file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);
  useEffect(() => {
    if (recording && cameraPreview.current) {
      cameraPreview.current.srcObject = stream.current;
      void cameraPreview.current.play().catch(() => {});
    }
  }, [recording]);
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
    try { const video = await inspectVideo(file); if (mounted.current) onChange(video); }
    catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "Could not read the video."); }
    finally { if (mounted.current) setChecking(false); }
  }
  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { cameraInput.current?.click(); return; }
    setStarting(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      if (!mounted.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const mimeType = ["video/webm;codecs=vp8,opus", "video/mp4", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const active = new MediaRecorder(media, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 2_000_000, audioBitsPerSecond: 128_000 });
      recorder.current = active;
      const chunks: Blob[] = [];
      active.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      active.onerror = () => { media.getTracks().forEach((track) => track.stop()); if (active.state === "recording") active.stop(); };
      active.onstop = () => {
        if (timer.current) clearInterval(timer.current);
        if (limit.current) clearTimeout(limit.current);
        media.getTracks().forEach((track) => track.stop()); stream.current = null;
        if (!mounted.current) return;
        setRecording(false);
        void select(new File(chunks, "wish-video", { type: active.mimeType || "video/webm" }));
      };
      active.start(); setRecording(true); setSeconds(0);
      const started = Date.now();
      timer.current = setInterval(() => setSeconds(Math.min(MAX_VIDEO_SECONDS, Math.floor((Date.now() - started) / 1000))), 200);
      limit.current = setTimeout(() => { if (active.state === "recording") active.stop(); }, 59_500);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (mounted.current) setError("Camera or microphone access was not available. Allow access or upload a video.");
    } finally { if (mounted.current) setStarting(false); }
  }
  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (file) void select(file); event.target.value = "";
  }
  return <fieldset className="min-w-0 space-y-3 border-t border-line pt-4" disabled={disabled}>
    <legend className="font-display text-lg font-bold">Video message (optional)</legend>
    <p className="text-xs text-mute">Your story, in your own words. Up to 60 seconds, under 50MB. Avoid sharing bank details, phone numbers or addresses.</p>
    {recording ? <video ref={cameraPreview} autoPlay muted playsInline className="aspect-video w-full rounded-lg bg-ink object-contain" aria-label="Live camera preview" /> : null}
    <div className="flex flex-wrap items-center gap-2">
      {recording ? <Button type="button" variant="destructive" onClick={() => recorder.current?.stop()}><Square className="size-4" />Stop recording · {seconds}s / 60s</Button> : <Button type="button" variant="secondary" disabled={checking || starting} onClick={() => void start()}><Camera className="size-4" />{starting ? "Opening camera…" : value ? "Record again" : "Record video"}</Button>}
      <Button type="button" variant="outline" disabled={recording || checking || starting} onClick={() => input.current?.click()}><Upload className="size-4" />Upload video</Button>
      {value && !recording ? <Button type="button" variant="ghost" size="icon" disabled={checking || starting} onClick={() => onChange(null)} aria-label="Remove video message"><X className="size-4" /></Button> : null}
      <input ref={input} type="file" accept="video/*,.mp4,.mov,.webm" aria-label="Upload video message" className="hidden" onChange={pick} />
      <input ref={cameraInput} type="file" accept="video/*" capture="user" aria-label="Record video with camera" className="hidden" onChange={pick} />
    </div>
    {checking ? <p role="status" className="text-xs text-mute">Checking video…</p> : null}
    {preview && !recording ? <div><video controls playsInline preload="metadata" src={preview} className="aspect-video w-full rounded-lg bg-ink object-contain" aria-label="Preview video message" /><p className="mt-1 text-xs text-mute">{Math.ceil(value?.duration ?? 0)} seconds</p></div> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </fieldset>;
}