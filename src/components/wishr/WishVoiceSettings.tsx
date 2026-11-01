import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { WishVoiceInput } from "./WishVoiceInput";
import { uploadWishVoice, type WishVoice } from "@/lib/wish-audio";
import { supabase } from "@/integrations/supabase/client";
import type { Wish } from "@/lib/queries";

export function WishVoiceSettings({ wish }: { wish: Wish }) {
  const [voice, setVoice] = useState<WishVoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const client = useQueryClient();
  async function save(remove = false) {
    const ownerId = wish.user_id;
    if (!ownerId) return;
    setBusy(true); setNotice(null);
    let uploaded: string | null = null;
    try {
      const fields = !remove && voice ? await uploadWishVoice(ownerId, voice) : { audio_path: null, audio_duration_seconds: null };
      uploaded = fields.audio_path;
      const { data, error } = await supabase.from("wishes").update(fields).eq("id", wish.id).eq("user_id", ownerId).select("id").single();
      if (error || !data) throw error ?? new Error("Your voice message could not be saved.");
      if (wish.audio_path) await supabase.storage.from("wish-audio").remove([wish.audio_path]);
      await Promise.all([client.invalidateQueries({ queryKey: ["wish", wish.id] }), client.invalidateQueries({ queryKey: ["wishes"] }), client.invalidateQueries({ queryKey: ["my-wishes"] }), client.invalidateQueries({ queryKey: ["public-profile"] })]);
      setVoice(null); setNotice(remove ? "Voice message removed." : "Voice message saved.");
    } catch (error) {
      if (uploaded) await supabase.storage.from("wish-audio").remove([uploaded]);
      setNotice(error instanceof Error ? error.message : "Could not save the voice message.");
    } finally { setBusy(false); }
  }
  return <section className="mt-6 min-w-0" aria-label="Manage wish voice message">
    <WishVoiceInput value={voice} onChange={setVoice} disabled={busy} />
    <div className="mt-3 flex flex-wrap gap-2">
      {voice ? <Button disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save voice message"}</Button> : null}
      {wish.audio_path ? <Button variant="outline" disabled={busy} onClick={() => void save(true)}>Remove saved audio</Button> : null}
    </div>
    {notice ? <p role="status" className="mt-2 text-sm text-mute">{notice}</p> : null}
  </section>;
}