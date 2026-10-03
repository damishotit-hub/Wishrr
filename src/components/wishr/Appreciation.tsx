import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { appreciationQuery, type Wish } from "@/lib/queries";

export function Appreciation({ wish }: { wish: Wish }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isOwner = !!user && wish.user_id === user.id;
  const note = useQuery({ ...appreciationQuery(wish.id), enabled: !!user });
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmGrant, setConfirmGrant] = useState(false);

  const granted = wish.status === "fulfilled";

  async function markGranted() {
    setBusy(true); setError(null);
    const { error: e } = await supabase.from("wishes").update({ status: "fulfilled" }).eq("id", wish.id);
    setBusy(false); setConfirmGrant(false);
    if (e) return setError(e.message);
    await qc.invalidateQueries({ queryKey: ["wish", wish.id] });
    await qc.invalidateQueries({ queryKey: ["impact"] });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (body.trim().length < 5) return setError("Write at least a few words of thanks.");
    setBusy(true); setError(null);
    try {
      let image_url: string | null = null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Photo must be under 10MB.");
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: up } = await supabase.storage.from("wish-images").upload(path, file);
        if (up) throw up;
        const { data: signed, error: se } = await supabase.storage.from("wish-images").createSignedUrl(path, 60 * 60 * 24 * 3650);
        if (se) throw se;
        image_url = signed.signedUrl;
      }
      const { error: ie } = await supabase.from("wish_appreciations").insert({ wish_id: wish.id, author_id: user.id, body: body.trim(), image_url });
      if (ie) throw ie;
      await qc.invalidateQueries({ queryKey: ["wish", wish.id, "appreciation"] });
      await qc.invalidateQueries({ queryKey: ["impact"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  if (note.data) {
    return (
      <section className="mt-10">
        <span className="pill-accent">Wish granted</span>
        <h2 className="mt-3 font-display text-xl">A thank-you from the wisher</h2>
        <figure className="mt-4 card-frame overflow-hidden">
          {note.data.image_url ? <img src={note.data.image_url} alt="Thank-you photo" loading="lazy" className="aspect-[16/10] w-full border-b-2 border-ink object-cover" /> : null}
          <blockquote className="p-5 text-[15px] leading-relaxed whitespace-pre-line">{note.data.body}</blockquote>
          <figcaption className="px-5 pb-4 text-[11px] text-mute">{timeAgo(note.data.created_at)}</figcaption>
        </figure>
      </section>
    );
  }

  if (!isOwner) return null;

  if (!granted) {
    if (!["active", "partially_funded"].includes(wish.status)) return null;
    return (
      <section className="mt-10 card-frame p-5">
        <h2 className="font-display text-xl">Did your wish come true?</h2>
        <p className="mt-1 text-sm text-mute">Mark it as granted to close giving and share a thank-you on the Impact Wall.</p>
        {confirmGrant ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={markGranted} disabled={busy} className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Yes, it's granted</button>
            <button onClick={() => setConfirmGrant(false)} className="press rounded-lg border-2 border-ink bg-card px-4 py-2.5 text-sm font-semibold">Not yet</button>
          </div>
        ) : (
          <button onClick={() => setConfirmGrant(true)} className="press mt-4 rounded-lg border-2 border-ink bg-accent px-4 py-2.5 text-sm font-semibold text-ink">Mark as granted</button>
        )}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 card-frame p-5">
      <span className="pill-accent">Wish granted</span>
      <h2 className="mt-3 font-display text-xl">Say thank you</h2>
      <p className="mt-1 text-sm text-mute">Your note appears on the Impact Wall so givers can see their help landed.</p>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={4} placeholder="Tell your givers what their help made possible." className="mt-4 w-full rounded-xl border-2 border-ink bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
      <label className="mt-3 block text-sm font-semibold">Photo (optional)
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm" />
      </label>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <button disabled={busy} className="press mt-4 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Posting..." : "Post thank-you"}</button>
    </form>
  );
}
