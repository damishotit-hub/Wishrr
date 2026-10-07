import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { MemberAvatar } from "@/components/wishr/MemberAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { conversationsQuery, threadQuery } from "@/lib/messages";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/messages/$id")({
  head: () => ({
    meta: [
      { title: "Conversation - Wishr" },
      { name: "description", content: "A private conversation on Wishr." },
      { property: "og:title", content: "Conversation - Wishr" },
      { property: "og:description", content: "A private conversation on Wishr." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Thread,
});

function Thread() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id ?? "";
  const convos = useQuery({ ...conversationsQuery(uid), enabled: !!user });
  const thread = useQuery({ ...threadQuery(id), enabled: !!user, refetchInterval: 20_000 });
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const other = convos.data?.find((c) => c.id === id);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`dm-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${id}` }, () => {
        void qc.invalidateQueries({ queryKey: ["dm", id] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [id, user, qc]);

  const unreadIds = (thread.data ?? []).filter((m) => m.sender_id !== uid && !m.read_at).map((m) => m.id);
  useEffect(() => {
    if (!unreadIds.length) return;
    void supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds)
      .then(() => qc.invalidateQueries({ queryKey: ["conversations", uid] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadIds.join(",")]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [thread.data?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !user) return;
    if (text.length > 2000) { setError("Keep messages under 2000 characters."); return; }
    setSending(true); setError(null);
    const { error: err } = await supabase.from("direct_messages").insert({ conversation_id: id, sender_id: user.id, body: text });
    setSending(false);
    if (err) { setError("Message not sent. Try again."); return; }
    setBody("");
    await qc.invalidateQueries({ queryKey: ["dm", id] });
    await qc.invalidateQueries({ queryKey: ["conversations", uid] });
  }

  if (!loading && !user) return <AppShell><section className="mx-auto max-w-md pt-12 text-center"><h1 className="font-display text-3xl">Sign in to see this conversation</h1><Link to="/auth" className="press mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in</Link></section></AppShell>;

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl pt-6">
        <Link to="/messages" className="text-sm font-semibold text-primary">← All messages</Link>
        <div className="mt-3 flex items-center gap-3 border-b-2 border-ink pb-3">
          {other ? <MemberAvatar path={other.other_avatar_url} name={other.other_display_name} /> : null}
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl">{other?.other_display_name ?? "Conversation"}</h1>
            {other?.other_username ? <Link to="/u/$username" params={{ username: other.other_username }} className="text-xs font-semibold text-primary">@{other.other_username}</Link> : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-mute">Keep it kind. Never share card PINs or passwords. Report anything that feels off.</p>
        <div className="mt-4 min-h-[40vh] space-y-2">
          {thread.isPending ? <div className="h-32 shimmer rounded-lg" /> : thread.data?.length ? thread.data.map((m) => {
            const mine = m.sender_id === uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl border-2 border-ink px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "opacity-80" : "text-mute"}`}>{timeAgo(m.created_at)}{mine && m.read_at ? " · Seen" : ""}</p>
                </div>
              </div>
            );
          }) : thread.isError ? <p className="text-sm text-mute">This conversation isn't available.</p> : <p className="py-10 text-center text-sm text-mute">No messages yet. Say hello.</p>}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="sticky bottom-24 mt-4 flex gap-2 bg-canvas py-2 md:bottom-4">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(e); } }} rows={1} maxLength={2000} placeholder="Write a message" aria-label="Message" className="min-h-12 flex-1 resize-none rounded-lg border-2 border-ink bg-card px-3 py-3 text-sm" />
          <button type="submit" disabled={sending || !body.trim()} className="press rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">Send</button>
        </form>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </section>
    </AppShell>
  );
}
