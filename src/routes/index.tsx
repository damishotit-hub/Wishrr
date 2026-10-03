import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wishr/AppShell";
import { WishCard, WishCardSkeleton } from "@/components/wishr/WishCard";
import { EmptyState } from "@/components/wishr/EmptyState";
import { GiveawayCard, GiveawayCardSkeleton } from "@/components/wishr/GiveawayCard";
import { impactQuery, publicGiveawaysQuery, publicWishesQuery } from "@/lib/queries";
import { ImpactCard } from "@/components/wishr/ImpactCard";
import { naira } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wishr - Make a wish, someone might make it happen" },
      {
        name: "description",
        content:
          "Share a real wish with a clear goal in Naira. Kind strangers chip in until it comes true.",
      },
      { property: "og:title", content: "Wishr - Make a wish, someone might make it happen" },
      {
        property: "og:description",
        content: "Share a real wish with a clear goal. Kind strangers chip in until it comes true.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, loading } = useAuth();
  const { data, isPending } = useQuery({ ...publicWishesQuery({ sort: "almost" }), enabled: !!user });
  const impact = useQuery({ ...impactQuery(3), enabled: !!user });
  const giveaways = useQuery(publicGiveawaysQuery({ limit: 3 }));
  const wishes = (data ?? []).slice(0, 6);
  const totalRaised = (data ?? []).reduce((sum, w) => sum + Number(w.amount_raised), 0);

  return (
    <AppShell>
      <section className="pt-8 md:pt-16">
        <p className="reveal text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Wishes, not campaigns
        </p>
        <h1 style={{ animationDelay: "80ms" }} className="reveal mt-3 font-display text-[34px] leading-[1.1] text-ink md:text-[56px]">
          Make a wish.
          <br />
          Someone might make it happen.
        </h1>
        <p style={{ animationDelay: "160ms" }} className="reveal mt-4 max-w-[52ch] text-[15px] leading-relaxed text-mute md:text-lg">
          Wishr is a quiet, dignified place to say what you need - school fees, a sewing machine, a
          bus ticket home - and let people who care help you get there.
        </p>

        <div style={{ animationDelay: "240ms" }} className="reveal mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/new"
            className="press rounded-lg bg-primary px-5 py-3.5 text-center text-sm font-semibold text-primary-foreground"
          >
            Make a wish
          </Link>
          <Link
            to="/explore"
            className="press rounded-xl bg-card px-5 py-3.5 text-center text-sm font-semibold text-ink border-2 border-ink"
          >
            Grant someone's wish
          </Link>
        </div>

        {user ? <dl style={{ animationDelay: "320ms" }} className="reveal mt-8 grid grid-cols-2 gap-3 md:max-w-lg">
          <div className="card-frame lift p-4">
            <dt className="text-xs font-medium text-mute">Raised so far</dt>
            <dd className="mt-1 font-display text-2xl">{naira(totalRaised)}</dd>
          </div>
          <div className="card-frame lift p-4">
            <dt className="text-xs font-medium text-mute">Open wishes</dt>
            <dd className="mt-1 font-display text-2xl">{data?.length ?? 0}</dd>
          </div>
        </dl> : null}
      </section>

       {!loading && !user ? <section className="mt-12 border-t-2 border-ink pt-8"><p className="eyebrow">Wishes</p><h2 className="mt-2 font-display text-2xl">A little help can change everything.</h2><p className="mt-2 max-w-lg text-sm text-mute">Sign in to browse active wishes and see how you can help.</p><Link to="/auth" className="press mt-5 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in or register</Link></section> : null}
       {user ? <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Almost there</h2>
          <Link to="/explore" className="text-sm font-semibold text-primary">
            See all
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isPending ? (
            <>
              <WishCardSkeleton />
              <WishCardSkeleton />
              <WishCardSkeleton />
            </>
          ) : wishes.length ? (
            wishes.map((wish, i) => <WishCard key={wish.id} wish={wish} index={i} />)
          ) : (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState
                title="No wishes yet"
                description="Be the first to share something you need."
                action={
                  <Link
                    to="/new"
                    className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Make a wish
                  </Link>
                }
              />
            </div>
          )}
        </div>
       </section> : null}

      {user ? <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Impact Wall</p>
            <h2 className="mt-2 font-display text-2xl">Wishes granted</h2>
            <p className="mt-1.5 text-sm text-mute">Proof that kindness lands.</p>
          </div>
          <Link to="/impact" className="text-sm font-semibold text-primary">See all</Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {impact.isPending ? <><WishCardSkeleton /><WishCardSkeleton /><WishCardSkeleton /></> : impact.data?.length ? impact.data.map((w) => <ImpactCard key={w.id} wish={w} />) : (
            <div className="md:col-span-2 lg:col-span-3"><EmptyState title="No granted wishes yet" description="When a wish comes true, its thank-you story appears here." /></div>
          )}
        </div>
      </section> : null}

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Giveaways</p>
            <h2 className="mt-2 font-display text-2xl">People are giving too</h2>
            <p className="mt-1.5 text-sm text-mute">
              Sometimes you have something someone else needs.
            </p>
          </div>
          <Link to="/giveaways" className="hidden text-sm font-semibold text-primary md:block">
            See all
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {giveaways.isPending ? (
            <>
              <GiveawayCardSkeleton />
              <GiveawayCardSkeleton />
              <GiveawayCardSkeleton />
            </>
          ) : giveaways.data?.length ? (
            giveaways.data.map((g, i) => <GiveawayCard key={g.id} giveaway={g} index={i} />)
          ) : (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState
                title="No giveaways yet"
                description="Have something you no longer need? Offer it to someone who does."
                action={
                  <Link
                    to="/giveaways/new"
                    className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Create a Giveaway
                  </Link>
                }
              />
            </div>
          )}
        </div>

        <div className="card-frame mt-6 flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <Link
            to="/giveaways"
            className="press rounded-lg bg-card px-5 py-3 text-center text-sm font-semibold text-ink border-2 border-ink"
          >
            Explore Giveaways
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-sm text-mute">Have something you want to give?</span>
            <Link
              to="/giveaways/new"
              className="press rounded-lg bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              Create a Giveaway
            </Link>
          </div>
        </div>
      </section>

      <section className="reveal card-frame mt-14 p-6 md:p-10">
        <h2 className="font-display text-2xl">How Wishr works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            ["Say the wish", "Write it plainly, set a goal in Naira, add a deadline if it matters."],
            ["People chip in", "Givers transfer directly, then wishers confirm the money arrived."],
            ["Share the ending", "Post an update so the people who helped can see it landed."],
          ].map(([title, body], i) => (
            <li key={title}>
              <span
                className="pop-in grid size-8 place-items-center rounded-full bg-warm font-display text-sm"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">{body}</p>
            </li>
          ))}
        </ol>
        <Link to="/how-it-works" className="mt-6 inline-block text-sm font-semibold text-primary">
          Read more about safety and fees
        </Link>
      </section>
    </AppShell>
  );
}
