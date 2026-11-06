import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/wishr/AppShell";
import { EmptyState } from "@/components/wishr/EmptyState";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { notificationTarget } from "@/lib/notification-target";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity - Wishr" },
      { name: "description", content: "Updates on the wishes you've made and supported." },
      { property: "og:title", content: "Activity - Wishr" },
      { property: "og:description", content: "Updates on the wishes you've made and supported." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Activity,
});

function Activity() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? "";
  const { feed: notifications, unread, markRead } = useNotifications(userId);

  if (loading) {
    return (
      <AppShell>
        <div className="h-56 animate-pulse rounded-[20px] bg-warm/50" />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-md pt-12 text-center">
          <h1 className="font-display text-3xl">Sign in to see your activity</h1>
          <p className="mt-2 text-sm text-mute">
            We'll tell you when someone gives, or when a wish you backed comes true.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl">Activity</h1>
          <Button variant="outline" size="sm" disabled={!unread || markRead.isPending} onClick={() => markRead.mutate(undefined)}><CheckCheck />Mark all as read</Button>
        </div>
        {markRead.isError ? <p className="mt-3 text-sm text-destructive" role="status">Couldn't mark your alerts as read. Please try again.</p> : null}
        {notifications.isPending ? <p className="mt-5 text-sm text-mute">Loading your activity...</p> : notifications.isError ? <div className="mt-5"><p className="text-sm text-mute">Couldn't load your activity.</p><Button variant="ghost" onClick={() => { void notifications.refetch(); }}>Try again</Button></div> : null}
        {notifications.data?.length ? (
          <ul className="mt-5 space-y-3">
            {notifications.data.map((n) => {
              const target = notificationTarget(n.link);
              return (
              <li key={n.id} className="card-frame p-4 border border-line">
                <p className="flex items-center gap-2 text-sm font-semibold">{!n.is_read ? <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}{n.title}</p>
                {n.body ? <p className="mt-1 text-sm text-mute">{n.body}</p> : null}
                {target ? <Link to={target.to} params={target.params} onClick={() => { if (!n.is_read) markRead.mutate(n.id); }} className="mt-2 inline-block text-sm font-semibold text-primary">{target.kind === "message" ? "Open chat" : target.kind === "giveaway" ? "View giveaway" : "View wish"} →</Link> : null}
                <p className="mt-2 text-[11px] text-mute">{timeAgo(n.created_at)}</p>
              </li>
            ); })}
          </ul>
        ) : !notifications.isPending && !notifications.isError ? (
          <div className="mt-5">
            <EmptyState
              title="Nothing yet"
              description="Once you make or support a wish, updates will show up here."
              action={
                <Link
                  to="/explore"
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Explore wishes
                </Link>
              }
            />
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
