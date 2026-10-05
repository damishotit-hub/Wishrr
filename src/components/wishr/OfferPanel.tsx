import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import type { Wish } from "@/lib/queries";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["wish_offers"]["Row"];

const STATUS: Record<string, string> = { pending: "Waiting for reply", accepted: "Accepted", declined: "Declined", completed: "Received", withdrawn: "Withdrawn" };
const btn = "press rounded-lg px-3 py-2 text-xs font-semibold";

function useOffers(wishId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["wish", wishId, "offers"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("wish_offers").select("*").eq("wish_id", wishId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function OfferPanel({ wish }: { wish: Wish }) {
  const { user } = useAuth();
  const isOwner = !!user && wish.user_id === user.id;
  const offers = useOffers(wish.id, !!user);
  if (!user) return null;
  if (isOwner) return <OwnerOffers wish={wish} offers={offers.data ?? []} />;
  return <GiverOffer wish={wish} offer={offers.data?.find((o) => o.giver_id === user.id) ?? null} />;
}

function GiverOffer({ wish, offer }: { wish: Wish; offer: Offer | null }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openForOffers = ["active", "partially_funded"].includes(wish.status);

  if (offer) {
    return (
      <section className="card-frame p-5">
        <p className="eyebrow">Your offer</p>
        <p className="mt-1 text-sm">{offer.description}</p>
        <span className="mt-2 inline-block pill-outline">{STATUS[offer.status] ?? offer.status}</span>
        {offer.status !== "declined" && offer.status !== "withdrawn" ? <OfferChat offer={offer} title="Private chat with the wisher" /> : null}
      </section>
    );
  }
  if (!openForOffers) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 5) return setError("Describe what you can offer.");
    setBusy(true); setError(null);
    const { data: p } = await supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle();
    const { error: err } = await supabase.from("wish_offers").insert({ wish_id: wish.id, giver_id: user!.id, giver_display_name: p?.display_name ?? "Wishr member", description: text.trim().slice(0, 1000) });
    setBusy(false);
    if (err) return setError(err.message);
    await qc.invalidateQueries({ queryKey: ["wish", wish.id, "offers"] });
  }

  return (
    <section className="card-frame p-5">
      <p className="eyebrow">Give in kind</p>
      <h2 className="mt-1 font-display text-lg">Have the thing itself?</h2>
      <p className="mt-1 text-sm text-mute">Offer an item or service instead of money. You'll get a private chat with the wisher to arrange the handoff.</p>
      {open ? (
        <form onSubmit={submit} className="mt-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} placeholder="I have a sewing machine in good condition I can drop off in Ikeja." className="w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          <button disabled={busy} className="press mt-2 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Sending..." : "Send offer"}</button>
        </form>
      ) : (
        <button onClick={() => setOpen(true)} className="press mt-3 w-full rounded-lg border-2 border-ink bg-accent px-4 py-3 text-sm font-semibold text-ink">Offer Item or Service</button>
      )}
    </section>
  );
}

function OwnerOffers({ wish, offers }: { wish: Wish; offers: Offer[] }) {
  const qc = useQueryClient();
  const [chat, setChat] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!offers.length) return null;

  async function setStatus(id: string, status: string) {
    setBusy(true);
    await supabase.from("wish_offers").update({ status }).eq("id", id);
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ["wish", wish.id, "offers"] });
  }

  return (
    <section className="card-frame p-5">
      <p className="eyebrow">Item and service offers</p>
      <ul className="mt-3 space-y-3">
        {offers.map((o) => (
          <li key={o.id} className="rounded-lg border-2 border-ink p-3">
            <p className="text-sm font-semibold">{o.giver_display_name}</p>
            <p className="mt-1 text-sm">{o.description}</p>
            <p className="mt-1 text-[11px] text-mute">{timeAgo(o.created_at)} · {STATUS[o.status] ?? o.status}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {o.status === "pending" ? <>
                <button disabled={busy} onClick={() => setStatus(o.id, "accepted")} className={`${btn} bg-primary text-primary-foreground`}>Accept</button>
                <button disabled={busy} onClick={() => setStatus(o.id, "declined")} className={`${btn} border-2 border-ink bg-card`}>Decline</button>
              </> : null}
              {o.status === "accepted" ? <button disabled={busy} onClick={() => setStatus(o.id, "completed")} className={`${btn} border-2 border-ink bg-accent text-ink`}>I received it</button> : null}
              {o.status !== "declined" && o.status !== "withdrawn" ? <button onClick={() => setChat(chat === o.id ? null : o.id)} className="text-xs font-semibold text-primary underline">Private chat</button> : null}
            </div>
            {chat === o.id ? <OfferChat offer={o} title={`Private chat with ${o.giver_display_name}`} /> : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-mute">Once you have what you wished for, use "Mark as granted" on this page.</p>
    </section>
  );
}

function OfferChat({ offer, title }: { offer: Offer; title: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const msgs = useQuery({
    queryKey: ["offer-messages", offer.id],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("wish_offer_messages").select("*").eq("offer_id", offer.id).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [body, setBody] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    const { error } = await supabase.from("wish_offer_messages").insert({ offer_id: offer.id, sender_id: user.id, body: body.trim().slice(0, 1000) });
    if (!error) { setBody(""); await qc.invalidateQueries({ queryKey: ["offer-messages", offer.id] }); }
  }
  return (
    <div className="mt-3 rounded-lg border-2 border-ink bg-canvas p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-mute">Only you two can see this. Share addresses and numbers here, never publicly.</p>
      <ul className="mt-2 max-h-60 space-y-2 overflow-y-auto">
        {msgs.data?.length ? msgs.data.map((m) => (
          <li key={m.id} className={`max-w-[85%] rounded-lg border-2 border-ink px-3 py-2 text-sm ${m.sender_id === user?.id ? "ml-auto bg-secondary" : "bg-card"}`}>
            <p className="whitespace-pre-line">{m.body}</p>
            <p className="mt-1 text-[10px] text-mute">{timeAgo(m.created_at)}</p>
          </li>
        )) : <li className="text-sm text-mute">No messages yet.</li>}
      </ul>
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="Write a message" className="w-full rounded-lg border-2 border-ink bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
        <button className="press shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Send</button>
      </form>
    </div>
  );
}
