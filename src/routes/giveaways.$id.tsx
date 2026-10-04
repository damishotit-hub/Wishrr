import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { EmptyState, ErrorState } from "@/components/wishr/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { daysLeft, initials, timeAgo } from "@/lib/format";
import { profileQuery } from "@/lib/queries";
import {
  GIVEAWAY_CATEGORY_LABELS, GIVEAWAY_STATUS_LABELS, MODE_CTA, MODE_LABEL,
  giveawayEntriesQuery, giveawayQuery, giveawayRecipientsQuery, recipientMessagesQuery,
} from "@/lib/giveaways";
import type { Database } from "@/integrations/supabase/types";

type Giveaway = Database["public"]["Tables"]["giveaways"]["Row"];
type Recipient = Database["public"]["Tables"]["giveaway_recipients"]["Row"];

export const Route = createFileRoute("/giveaways/$id")({
  head: () => ({
    meta: [
      { title: "A giveaway on Wishr" },
      { name: "description", content: "Someone on Wishr is giving something away. See if it's for you." },
      { property: "og:title", content: "A giveaway on Wishr" },
      { property: "og:description", content: "Someone on Wishr is giving something away. See if it's for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiveawayDetail,
});

const btn = "press rounded-lg px-4 py-2.5 text-sm font-semibold";

function GiveawayDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const g = useQuery({ ...giveawayQuery(id), enabled: !!user });
  const recipients = useQuery({ ...giveawayRecipientsQuery(id), enabled: !!user });
  const [activeImg, setActiveImg] = useState<string | null>(null);

  if (!loading && !user) {
    return <AppShell><section className="mx-auto max-w-xl py-16 text-center"><p className="eyebrow">Giveaways</p><h1 className="mt-3 font-display text-3xl">Someone is giving.</h1><p className="mt-3 text-sm text-mute">Sign in or register to see this giveaway and enter.</p><Link to="/auth" className="press mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in or register</Link></section></AppShell>;
  }
  if (g.isPending) return <AppShell><div className="mt-8 h-64 shimmer rounded-lg" /></AppShell>;
  if (g.isError) return <AppShell><div className="pt-8"><ErrorState message="We couldn't load this giveaway." onRetry={() => void g.refetch()} /></div></AppShell>;
  if (!g.data) return <AppShell><div className="pt-8"><EmptyState title="This giveaway isn't available" description="It may have been removed." action={<Link to="/giveaways" className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Explore giveaways</Link>} /></div></AppShell>;

  const x = g.data;
  const isGiver = !!user && x.giver_id === user.id;
  const myRecipient = recipients.data?.find((r) => r.user_id === user?.id) ?? null;
  const images = [x.image_url, ...(x.extra_images ?? [])].filter(Boolean) as string[];
  const shown = activeImg ?? images[0] ?? null;
  const left = daysLeft(x.deadline);

  return (
    <AppShell>
      <article className="pt-6 md:grid md:grid-cols-[1fr_360px] md:gap-10">
        <div>
          <Link to="/giveaways" className="text-xs font-semibold text-mute">← Back to giveaways</Link>
          {myRecipient ? (
            <div className="mt-4 card-frame border-2 border-ink bg-accent p-4">
              <p className="font-display text-lg">Congratulations! You were selected for this giveaway.</p>
              <p className="mt-1 text-sm">Use the private chat below to arrange delivery or pickup with the giver.</p>
            </div>
          ) : null}

          {shown ? (
            <figure className="mt-4 overflow-hidden rounded-[14px] border-2 border-ink hard-shadow">
              <img src={shown} alt={x.image_caption ?? x.title} className="aspect-[16/10] w-full object-cover" />
              {x.image_caption && shown === x.image_url ? <figcaption className="border-t-2 border-ink bg-accent px-4 py-3 text-sm font-semibold">{x.image_caption}</figcaption> : null}
            </figure>
          ) : null}
          {images.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src) => (
                <button key={src} onClick={() => setActiveImg(src)} className={`shrink-0 overflow-hidden rounded-lg border-2 ${src === shown ? "border-primary" : "border-ink"}`}>
                  <img src={src} alt="" className="size-16 object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="pill">{GIVEAWAY_CATEGORY_LABELS[x.category] ?? x.category}</span>
            <span className="pill-accent">{MODE_LABEL[x.selection_mode] ?? x.selection_mode}</span>
            <span className="pill-outline">{GIVEAWAY_STATUS_LABELS[x.status] ?? x.status}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight md:text-4xl">{x.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-mute">
            <span className="grid size-7 place-items-center rounded-full bg-warm text-[11px] font-semibold text-ink">{initials(x.giver_display_name)}</span>
            <span>{x.giver_display_name}</span><span aria-hidden>·</span><span>{timeAgo(x.created_at)}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="card-flat p-3"><dt className="text-xs text-mute">Location</dt><dd className="font-semibold">{x.location ?? "Not specified"}</dd></div>
            <div className="card-flat p-3"><dt className="text-xs text-mute">Deadline</dt><dd className="font-semibold">{left ?? "No deadline"}</dd></div>
            <div className="card-flat p-3"><dt className="text-xs text-mute">Recipients</dt><dd className="font-semibold">{x.recipient_count}</dd></div>
            <div className="card-flat p-3"><dt className="text-xs text-mute">Entries</dt><dd className="font-semibold">{x.entry_count}</dd></div>
          </dl>
          <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-ink/90">{x.description}</p>
          {x.eligibility ? <div className="mt-5 card-flat p-4 text-sm"><p className="eyebrow">Eligibility / pickup</p><p className="mt-1 whitespace-pre-line">{x.eligibility}</p></div> : null}

          {isGiver ? <GiverPanel giveaway={x} recipients={recipients.data ?? []} /> : null}
          {myRecipient ? <PrivateChat recipient={myRecipient} title="Private chat with the giver" /> : null}
        </div>

        <aside className="mt-8 md:sticky md:top-8 md:mt-14 md:self-start">
          {isGiver ? (
            <div className="card-frame p-5 text-sm"><p className="font-display text-lg">This is your giveaway</p><p className="mt-1 text-mute">Manage entries and recipients on this page.</p></div>
          ) : (
            <EntryPanel giveaway={x} />
          )}
        </aside>
      </article>
    </AppShell>
  );
}

function EntryPanel({ giveaway }: { giveaway: Giveaway }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const mine = useQuery({
    queryKey: ["giveaway", giveaway.id, "my-entry", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("giveaway_entries").select("*").eq("giveaway_id", giveaway.id).eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = giveaway.status === "active";
  const cta = MODE_CTA[giveaway.selection_mode] ?? "Enter Giveaway";

  if (mine.data) {
    return (
      <div className="pop-in card-frame p-5">
        <p className="font-display text-xl">You're in.</p>
        <p className="mt-1 text-sm text-mute">You've successfully entered this giveaway.</p>
        <span className="mt-3 inline-block pill-outline">{mine.data.status}</span>
      </div>
    );
  }
  if (!open) return <div className="card-frame p-5 text-sm"><p className="font-display text-lg">Entries are closed</p><p className="mt-1 text-mute">This giveaway is no longer taking entries.</p></div>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = (name || profile.data?.display_name || "").trim();
    if (n.length < 2) return setError("Enter your name.");
    setBusy(true); setError(null);
    const { error: ie } = await supabase.from("giveaway_entries").insert({
      giveaway_id: giveaway.id, user_id: user!.id, entrant_display_name: n.slice(0, 80), message: message.trim().slice(0, 500) || null,
    });
    setBusy(false);
    if (ie) return setError(ie.message.includes("duplicate") ? "You've already entered." : ie.message);
    await qc.invalidateQueries({ queryKey: ["giveaway", giveaway.id] });
    await qc.invalidateQueries({ queryKey: ["giveaways"] });
  }

  return (
    <form onSubmit={submit} className="card-frame p-5">
      <p className="font-display text-xl">{cta}</p>
      <label className="mt-4 block text-xs font-semibold text-mute">Your name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={profile.data?.display_name ?? "Your name"} maxLength={80} className="mt-1.5 w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary" />
      </label>
      <label className="mt-3 block text-xs font-semibold text-mute">Short reason (optional)
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary" />
      </label>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <button disabled={busy} className={`${btn} mt-4 w-full bg-primary text-primary-foreground disabled:opacity-60`}>{busy ? "Sending..." : cta}</button>
      <p className="mt-2 text-[11px] text-mute">Contact details are only shared privately if you're selected.</p>
    </form>
  );
}

function GiverPanel({ giveaway, recipients }: { giveaway: Giveaway; recipients: Recipient[] }) {
  const qc = useQueryClient();
  const entries = useQuery(giveawayEntriesQuery(giveaway.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const full = recipients.length >= giveaway.recipient_count;

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["giveaway", giveaway.id] });
    await qc.invalidateQueries({ queryKey: ["my-giveaways"] });
  }
  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true); setError(null);
    const { error: e } = await fn();
    setBusy(false);
    if (e) setError(e.message); else await refresh();
  }
  const select = (userId: string) => run(async () => {
    const r = await supabase.from("giveaway_recipients").insert({ giveaway_id: giveaway.id, user_id: userId });
    if (!r.error && recipients.length + 1 >= giveaway.recipient_count) {
      return supabase.from("giveaways").update({ status: "recipient_selected" }).eq("id", giveaway.id);
    }
    return r;
  });
  const setStatus = (status: Giveaway["status"]) => run(() => supabase.from("giveaways").update({ status }).eq("id", giveaway.id));
  const fulfil = () => run(async () => {
    const r = await supabase.from("giveaway_recipients").update({ status: "delivered" }).eq("giveaway_id", giveaway.id).neq("status", "cancelled");
    if (r.error) return r;
    return supabase.from("giveaways").update({ status: "fulfilled" }).eq("id", giveaway.id);
  });

  return (
    <section className="mt-10 card-frame p-5">
      <p className="eyebrow">Giver tools</p>
      <h2 className="mt-1 font-display text-xl">Entries ({entries.data?.length ?? 0})</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {giveaway.status === "draft" ? <button disabled={busy} onClick={() => setStatus("active")} className={`${btn} bg-primary text-primary-foreground`}>Publish</button> : null}
        {giveaway.status === "active" ? <button disabled={busy} onClick={() => setStatus("closed")} className={`${btn} border-2 border-ink bg-card`}>Close entries</button> : null}
        {recipients.length && giveaway.status !== "fulfilled" ? <button disabled={busy} onClick={fulfil} className={`${btn} border-2 border-ink bg-accent text-ink`}>Mark as delivered</button> : null}
        {giveaway.status === "fulfilled" ? <span className="pill-accent">Giveaway Fulfilled</span> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      {entries.data?.length ? (
        <ul className="mt-4 divide-y-2 divide-ink rounded-lg border-2 border-ink">
          {entries.data.map((en) => {
            const rec = recipients.find((r) => r.user_id === en.user_id);
            return (
              <li key={en.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{en.entrant_display_name}</p>
                    {en.message ? <p className="mt-1 text-sm text-mute">{en.message}</p> : null}
                    <p className="mt-1 text-[11px] text-mute">{timeAgo(en.created_at)}</p>
                  </div>
                  {rec ? (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="pill-accent">{rec.status === "delivered" ? "Delivered" : "Selected"}</span>
                      <button onClick={() => setOpenChat(openChat === rec.id ? null : rec.id)} className="text-xs font-semibold text-primary underline">Private chat</button>
                    </div>
                  ) : giveaway.selection_mode === "giver_selects" && !full && giveaway.status !== "fulfilled" ? (
                    <button disabled={busy} onClick={() => select(en.user_id)} className={`${btn} shrink-0 bg-primary text-primary-foreground`}>Select</button>
                  ) : null}
                </div>
                {rec && openChat === rec.id ? <PrivateChat recipient={rec} title={`Private chat with ${en.entrant_display_name}`} /> : null}
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-3 text-sm text-mute">No entries yet.</p>}
    </section>
  );
}

function PrivateChat({ recipient, title }: { recipient: Recipient; title: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const msgs = useQuery(recipientMessagesQuery(recipient.id));
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setBusy(true);
    const { error } = await supabase.from("giveaway_messages").insert({ recipient_id: recipient.id, sender_id: user.id, body: body.trim().slice(0, 1000) });
    setBusy(false);
    if (!error) { setBody(""); await qc.invalidateQueries({ queryKey: ["giveaway-messages", recipient.id] }); }
  }

  return (
    <section className="mt-6 card-frame p-4">
      <p className="font-display text-base">{title}</p>
      <p className="text-[11px] text-mute">Only you and the other person can see these messages. Share addresses and phone numbers here, never publicly.</p>
      <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {msgs.data?.length ? msgs.data.map((m) => (
          <li key={m.id} className={`max-w-[85%] rounded-lg border-2 border-ink px-3 py-2 text-sm ${m.sender_id === user?.id ? "ml-auto bg-secondary" : "bg-card"}`}>
            <p className="whitespace-pre-line">{m.body}</p>
            <p className="mt-1 text-[10px] text-mute">{timeAgo(m.created_at)}</p>
          </li>
        )) : <li className="text-sm text-mute">No messages yet. Say hello and agree on delivery or pickup.</li>}
      </ul>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="Write a message" className="w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
        <button disabled={busy} className={`${btn} shrink-0 bg-primary text-primary-foreground`}>Send</button>
      </form>
    </section>
  );
}
