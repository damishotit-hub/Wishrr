import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wishr/AppShell";
import { EmptyState } from "@/components/wishr/EmptyState";
import { ProgressMeter } from "@/components/wishr/ProgressMeter";
import { useAuth } from "@/lib/auth";
import { myContributionsQuery, myWishesQuery, profileQuery } from "@/lib/queries";
import { initials, naira, STATUS_LABELS, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your profile - Wishr" },
      { name: "description", content: "Track the wishes you've made and the ones you've supported." },
      { property: "og:title", content: "Your profile - Wishr" },
      {
        property: "og:description",
        content: "Track the wishes you've made and the ones you've supported.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const userId = user?.id ?? "";
  const profile = useQuery({ ...profileQuery(userId), enabled: !!userId });
  const wishes = useQuery({ ...myWishesQuery(userId), enabled: !!userId });
  const contributions = useQuery({ ...myContributionsQuery(userId), enabled: !!userId });

  if (loading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-[20px] bg-warm/50" />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-md pt-12 text-center">
          <h1 className="font-display text-3xl">Sign in to see your profile</h1>
          <p className="mt-2 text-sm text-mute">
            Your wishes, your giving history, and your updates live here.
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

  const name = profile.data?.display_name ?? user.email ?? "You";
  const given = (contributions.data ?? []).reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <AppShell>
      <section className="pt-8">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-warm font-display text-lg">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl">{name}</h1>
            <p className="truncate text-sm text-mute">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3">
          <div className="card-frame p-4 border-2 border-ink">
            <dt className="text-xs font-medium text-mute">You've given</dt>
            <dd className="mt-1 font-display text-2xl">{naira(given)}</dd>
          </div>
          <div className="card-frame p-4 border-2 border-ink">
            <dt className="text-xs font-medium text-mute">Your wishes</dt>
            <dd className="mt-1 font-display text-2xl">{wishes.data?.length ?? 0}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl">Your wishes</h2>
          <Link to="/new" className="text-sm font-semibold text-primary">
            New wish
          </Link>
        </div>

        {wishes.data?.length ? (
          <ul className="mt-4 space-y-3">
            {wishes.data.map((w) => (
              <li key={w.id} className="card-frame p-5 border-2 border-ink">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/wish/$id"
                    params={{ id: w.id }}
                    className="font-display text-lg hover:text-primary"
                  >
                    {w.title}
                  </Link>
                  <span className="shrink-0 rounded-full bg-warm px-2.5 py-1 text-[11px] font-semibold">
                    {STATUS_LABELS[w.status] ?? w.status}
                  </span>
                </div>
                <div className="mt-4">
                  <ProgressMeter
                    raised={Number(w.amount_raised)}
                    goal={Number(w.goal_amount)}
                    animate={false}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No wishes yet"
              description="When you're ready, tell people what you need."
              action={
                <Link
                  to="/new"
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Make a wish
                </Link>
              }
            />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Wishes you've supported</h2>
        {contributions.data?.length ? (
          <ul className="mt-4 divide-y-2 divide-ink card-frame border-2 border-ink">
            {contributions.data.map((c) => {
              const wish = (c as { wishes?: { id: string; title: string } | null }).wishes;
              return (
                <li key={c.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    {wish ? (
                      <Link
                        to="/wish/$id"
                        params={{ id: wish.id }}
                        className="truncate text-sm font-semibold hover:text-primary"
                      >
                        {wish.title}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold">A wish</span>
                    )}
                    <p className="mt-1 text-[11px] text-mute">{timeAgo(c.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary">
                    {naira(c.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="You haven't given yet"
              description="Find a wish that moves you and chip in what you can."
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

      <div className="mt-10">
        <button
          onClick={() => void signOut()}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink border-2 border-ink"
        >
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
