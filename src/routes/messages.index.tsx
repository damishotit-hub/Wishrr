import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wishr/AppShell";
import { MemberAvatar } from "@/components/wishr/MemberAvatar";
import { EmptyState } from "@/components/wishr/EmptyState";
import { MemberSearch } from "@/components/wishr/MemberSearch";
import { useAuth } from "@/lib/auth";
import { conversationsQuery } from "@/lib/messages";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Messages - Wishr" },
      { name: "description", content: "Private conversations with wishers and givers on Wishr." },
      { property: "og:title", content: "Messages - Wishr" },
      { property: "og:description", content: "Private conversations with wishers and givers on Wishr." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  const { user, loading } = useAuth();
  const convos = useQuery({ ...conversationsQuery(user?.id ?? ""), enabled: !!user, refetchInterval: 15_000 });

  if (!loading && !user) return <AppShell><section className="mx-auto max-w-md pt-12 text-center"><h1 className="font-display text-3xl">Sign in to see your messages</h1><Link to="/auth" className="press mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in</Link></section></AppShell>;

  return (
    <AppShell>
      <section className="pt-8">
        <p className="eyebrow">Inbox</p>
        <h1 className="mt-1 font-display text-3xl">Messages</h1>
        <p className="mt-2 text-sm text-mute">Private 1-on-1 chats to coordinate gifts, transfers and thank-yous. Only you and the other member can read them.</p>
        <div className="mt-5"><MemberSearch variant="hero" /></div>
        <div className="mt-6">
          {loading || convos.isPending ? <div className="h-40 shimmer rounded-lg" /> : convos.data?.length ? (
            <ul className="card-frame divide-y-2 divide-ink">
              {convos.data.map((c) => (
                <li key={c.id}>
                  <Link to="/messages/$id" params={{ id: c.id }} className="flex items-center gap-3 p-4 hover:bg-muted">
                    <MemberAvatar path={c.other_avatar_url} name={c.other_display_name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{c.other_display_name}</strong><span className="shrink-0 text-[11px] text-mute">{timeAgo(c.last_message_at)}</span></span>
                      <span className="block truncate text-xs text-mute">{c.last_body ?? `Say hello to @${c.other_username}`}</span>
                    </span>
                    {Number(c.unread) ? <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{c.unread}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No conversations yet" description="Open a member's profile or a wish and tap Message to start a private chat." />}
        </div>
      </section>
    </AppShell>
  );
}
