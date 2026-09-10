import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wishr/AppShell";
import { WishCard, WishCardSkeleton } from "@/components/wishr/WishCard";
import { EmptyState } from "@/components/wishr/EmptyState";
import { publicWishesQuery } from "@/lib/queries";
import { naira } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wishr — Make a wish, someone might make it happen" },
      {
        name: "description",
        content:
          "Share a real wish with a clear goal in Naira. Kind strangers chip in until it comes true.",
      },
      { property: "og:title", content: "Wishr — Make a wish, someone might make it happen" },
      {
        property: "og:description",
        content: "Share a real wish with a clear goal. Kind strangers chip in until it comes true.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isPending } = useQuery(publicWishesQuery({ sort: "almost" }));
  const wishes = (data ?? []).slice(0, 6);
  const totalRaised = (data ?? []).reduce((sum, w) => sum + Number(w.amount_raised), 0);

  return (
    <AppShell>
      <section className="pt-8 md:pt-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Wishes, not campaigns
        </p>
        <h1 className="mt-3 font-display text-[34px] leading-[1.1] text-ink md:text-[56px]">
          Make a wish.
          <br />
          Someone might make it happen.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-mute md:text-lg">
          Wishr is a quiet, dignified place to say what you need — school fees, a sewing machine, a
          bus ticket home — and let people who care help you get there.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/new"
            className="rounded-xl bg-primary px-5 py-3.5 text-center text-sm font-semibold text-primary-foreground"
          >
            Make a wish
          </Link>
          <Link
            to="/explore"
            className="rounded-xl bg-card px-5 py-3.5 text-center text-sm font-semibold text-ink ring-1 ring-line"
          >
            Grant someone's wish
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-3 md:max-w-lg">
          <div className="rounded-[20px] bg-card p-4 ring-1 ring-line">
            <dt className="text-xs font-medium text-mute">Raised so far</dt>
            <dd className="mt-1 font-display text-2xl">{naira(totalRaised)}</dd>
          </div>
          <div className="rounded-[20px] bg-card p-4 ring-1 ring-line">
            <dt className="text-xs font-medium text-mute">Open wishes</dt>
            <dd className="mt-1 font-display text-2xl">{data?.length ?? 0}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-12">
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
            wishes.map((wish) => <WishCard key={wish.id} wish={wish} />)
          ) : (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState
                title="No wishes yet"
                description="Be the first to share something you need."
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
        </div>
      </section>

      <section className="mt-14 rounded-[24px] bg-card p-6 ring-1 ring-line md:p-10">
        <h2 className="font-display text-2xl">How Wishr works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            ["Say the wish", "Write it plainly, set a goal in Naira, add a deadline if it matters."],
            ["People chip in", "Anyone can give any amount — publicly or anonymously."],
            ["Share the ending", "Post an update so the people who helped can see it landed."],
          ].map(([title, body], i) => (
            <li key={title}>
              <span className="grid size-8 place-items-center rounded-full bg-warm font-display text-sm">
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
