import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wishr/AppShell";
import { ProgressMeter } from "@/components/wishr/ProgressMeter";
import { EmptyState, ErrorState } from "@/components/wishr/EmptyState";
import { ContributeForm } from "@/components/wishr/ContributeForm";
import { FundingBreakdown } from "@/components/wishr/FundingBreakdown";
import { WishOwnerControls } from "@/components/wishr/WishOwnerControls";
import { WishBankSettings } from "@/components/wishr/WishBankSettings";
import { ShareSection } from "@/components/wishr/ShareSection";
import { Appreciation } from "@/components/wishr/Appreciation";
import { useAuth } from "@/lib/auth";
import { wishQuery, wishContributionsQuery, wishUpdatesQuery } from "@/lib/queries";
import { CATEGORY_LABELS, daysLeft, initials, naira, STATUS_LABELS, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/wish/$id")({
  head: () => ({
    meta: [
      { title: "A wish on Wishr" },
      { name: "description", content: "Read this wish and help make it happen." },
      { property: "og:title", content: "A wish on Wishr" },
      { property: "og:description", content: "Read this wish and help make it happen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishDetail,
});

function WishDetail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const wish = useQuery({ ...wishQuery(id), enabled: !!user });
  const contributions = useQuery({ ...wishContributionsQuery(id), enabled: !!user });
  const updates = useQuery({ ...wishUpdatesQuery(id), enabled: !!user });

  if (!loading && !user) return <AppShell><section className="mx-auto max-w-xl py-16 text-center"><p className="eyebrow">Wishr</p><h1 className="mt-3 font-display text-3xl">Make a wish happen.</h1><p className="mt-3 text-sm text-mute">Sign in or register to see this wish and the ways you can help.</p><Link to="/auth" className="press mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in or register</Link></section></AppShell>;

  if (wish.isPending) {
    return (
      <AppShell>
        <div className="space-y-4 pt-8">
          <div className="h-8 w-2/3 animate-pulse rounded bg-warm" />
          <div className="h-40 w-full animate-pulse rounded-[20px] bg-warm/60" />
        </div>
      </AppShell>
    );
  }

  if (wish.isError) {
    return (
      <AppShell>
        <div className="pt-8">
          <ErrorState
            message="We couldn't load this wish."
            onRetry={() => void wish.refetch()}
          />
        </div>
      </AppShell>
    );
  }

  if (!wish.data) {
    return (
      <AppShell>
        <div className="pt-8">
          <EmptyState
            title="This wish isn't available"
            description="It may have been closed or removed."
            action={
              <Link
                to="/explore"
                className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Explore wishes
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const w = wish.data;
  const left = daysLeft(w.deadline);
  const isOwner = !!user && w.user_id === user.id;

  return (
    <AppShell>
      <article className="pt-6 md:grid md:grid-cols-[1fr_360px] md:gap-10">
        <div>
          <Link to="/explore" className="text-xs font-semibold text-mute">
            ← Back to wishes
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="pill">{CATEGORY_LABELS[w.category] ?? w.category}</span>
            <span className="pill-outline">{STATUS_LABELS[w.status] ?? w.status}</span>
            {left ? <span className="text-[11px] font-medium text-mute">{left}</span> : null}
          </div>

          <h1 className="mt-3 font-display text-3xl leading-tight md:text-4xl">{w.title}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-mute">
            <span className="grid size-7 place-items-center rounded-full bg-warm text-[11px] font-semibold text-ink">
              {w.is_anonymous ? "?" : initials(w.creator_display_name)}
            </span>
            <span>{w.is_anonymous ? "Anonymous wisher" : w.creator_display_name}</span>
            <span aria-hidden>·</span>
            <span>{timeAgo(w.created_at)}</span>
          </div>

          {w.image_url ? (
            <figure className="mt-5 overflow-hidden rounded-[14px] border-2 border-ink hard-shadow">
              <img
                src={w.image_url}
                alt={w.image_caption ?? w.title}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
              {w.image_caption ? (
                <figcaption className="border-t-2 border-ink bg-accent px-4 py-3 text-sm font-semibold text-ink">
                  {w.image_caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <div className="mt-6 card-frame p-5 md:hidden">
            <ProgressMeter raised={Number(w.amount_raised)} goal={Number(w.goal_amount)} />
            <div className="mt-4">
              <FundingBreakdown raised={Number(w.amount_raised)} goal={Number(w.goal_amount)} />
            </div>
          </div>


          <p className="mt-6 text-[15px] leading-relaxed whitespace-pre-line text-ink/90">
            {w.description}
          </p>

          <Appreciation wish={w} />

          <section className="mt-10">
            <h2 className="font-display text-xl">Updates</h2>
            {updates.data?.length ? (
              <ul className="mt-4 space-y-3">
                {updates.data.map((u) => (
                  <li key={u.id} className="card-frame p-4 border-2 border-ink">
                    <p className="text-sm leading-relaxed whitespace-pre-line">{u.body}</p>
                    <p className="mt-2 text-[11px] text-mute">{timeAgo(u.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-mute">No updates yet.</p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl">
              Supporters {contributions.data?.length ? `(${contributions.data.length})` : ""}
            </h2>
            {contributions.data?.length ? (
              <ul className="mt-4 divide-y-2 divide-ink card-frame">

                {contributions.data.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {c.is_anonymous ? "Anonymous" : (c.contributor_display_name ?? "A friend")}
                      </p>
                      {c.message ? (
                        <p className="mt-1 text-sm text-mute">{c.message}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-mute">{timeAgo(c.created_at)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {naira(c.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-mute">Be the first to give.</p>
            )}
          </section>
        </div>

        <aside className="mt-8 space-y-4 md:sticky md:top-8 md:mt-14 md:self-start">
          <div className="hidden card-frame p-5 border-2 border-ink md:block">
            <ProgressMeter raised={Number(w.amount_raised)} goal={Number(w.goal_amount)} />
            <div className="mt-4">
              <FundingBreakdown raised={Number(w.amount_raised)} goal={Number(w.goal_amount)} />
            </div>
          </div>
          <ContributeForm wish={w} />
          <ShareSection wish={w} />
          {isOwner ? <><WishBankSettings wish={w} /><WishOwnerControls wish={w} /></> : null}
        </aside>
      </article>
    </AppShell>
  );
}
