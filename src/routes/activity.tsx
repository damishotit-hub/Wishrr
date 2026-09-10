import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wishr/AppShell";
import { EmptyState } from "@/components/wishr/EmptyState";
import { useAuth } from "@/lib/auth";
import { notificationsQuery } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Wishr" },
      { name: "description", content: "Updates on the wishes you've made and supported." },
      { property: "og:title", content: "Activity — Wishr" },
      { property: "og:description", content: "Updates on the wishes you've made and supported." },
    ],
  }),
  component: Activity,
});

function Activity() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? "";
  const notifications = useQuery({ ...notificationsQuery(userId), enabled: !!userId });

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
        <h1 className="font-display text-3xl">Activity</h1>
        {notifications.data?.length ? (
          <ul className="mt-5 space-y-3">
            {notifications.data.map((n) => (
              <li key={n.id} className="rounded-[20px] bg-card p-4 ring-1 ring-line">
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body ? <p className="mt-1 text-sm text-mute">{n.body}</p> : null}
                <p className="mt-2 text-[11px] text-mute">{timeAgo(n.created_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
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
        )}
      </section>
    </AppShell>
  );
}
