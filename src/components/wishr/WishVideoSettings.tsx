import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { WishVideoInput } from "./WishVideoInput";
import { uploadWishVideo, type WishVideo } from "@/lib/wish-video";
import { supabase } from "@/integrations/supabase/client";
import type { Wish } from "@/lib/queries";

export function WishVideoSettings({ wish }: { wish: Wish }) {
  const [video, setVideo] = useState<WishVideo | null>(null);
  const [busy, setBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const client = useQueryClient();
  async function save(remove = false) {
    const ownerId = wish.user_id;
    if (!ownerId) return;
    setBusy(true); setNotice(null);
    let uploaded: string | null = null;
    let saved = false;
    try {
      const fields = !remove && video ? await uploadWishVideo(ownerId, video) : { video_path: null, video_duration_seconds: null };
      uploaded = fields.video_path;
      const { data, error } = await supabase.from("wishes").update(fields).eq("id", wish.id).eq("user_id", ownerId).select("id").single();
      if (error || !data) throw error ?? new Error("Your video could not be saved.");
      saved = true;
      if (wish.video_path) await supabase.storage.from("wish-video").remove([wish.video_path]);
      await Promise.all([client.invalidateQueries({ queryKey: ["wish", wish.id] }), client.invalidateQueries({ queryKey: ["wishes"] }), client.invalidateQueries({ queryKey: ["my-wishes"] }), client.invalidateQueries({ queryKey: ["public-profile"] })]);
      setVideo(null); setNotice(remove ? "Video removed." : "Video saved.");
    } catch (error) {
      if (uploaded && !saved) await supabase.storage.from("wish-video").remove([uploaded]);
      setNotice(error instanceof Error ? error.message : "Could not save the video.");
    } finally { setBusy(false); }
  }
  return <section className="mt-6 min-w-0" aria-label="Manage wish video message">
    <WishVideoInput value={video} onChange={setVideo} disabled={busy} onBusyChange={setVideoBusy} />
    <div className="mt-3 flex flex-wrap gap-2">
      {video ? <Button disabled={busy || videoBusy} onClick={() => void save()}>{busy ? "Saving…" : "Save video message"}</Button> : null}
      {wish.video_path ? <Button variant="outline" disabled={busy || videoBusy} onClick={() => void save(true)}>Remove saved video</Button> : null}
    </div>
    {notice ? <p role="status" className="mt-2 text-sm text-mute">{notice}</p> : null}
  </section>;
}