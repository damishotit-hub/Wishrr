import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { WishCard, WishCardSkeleton } from "@/components/wishr/WishCard";
import { EmptyState, ErrorState } from "@/components/wishr/EmptyState";
import { categoriesQuery, publicWishesQuery, type ExploreFilters } from "@/lib/queries";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore wishes - Wishr" },
      {
        name: "description",
        content: "Browse real wishes from real people and help fulfil the one that speaks to you.",
      },
      { property: "og:title", content: "Explore wishes - Wishr" },
      {
        property: "og:description",
        content: "Browse real wishes from real people and help fulfil the one that speaks to you.",
      },
    ],
  }),
  component: Explore,
});

const SORTS: { value: NonNullable<ExploreFilters["sort"]>; label: string }[] = [
  { value: "recent", label: "Newest" },
  { value: "almost", label: "Almost there" },
  { value: "supported", label: "Most supported" },
];

function Explore() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<NonNullable<ExploreFilters["sort"]>>("recent");

  const categories = useQuery(categoriesQuery);
  const wishes = useQuery({ ...publicWishesQuery({ search, category, sort }), enabled: !!user });

  if (loading) return <AppShell><div className="mt-8 h-40 animate-pulse bg-warm" /></AppShell>;
  if (!user) return <AppShell><section className="mx-auto max-w-xl py-16 text-center"><span className="eyebrow">Explore wishes</span><h1 className="mt-3 font-display text-3xl">Real wishes. Real ways to help.</h1><p className="mx-auto mt-3 max-w-md text-sm text-mute">Sign in to discover the wishes people have shared and help make one happen.</p><div className="mt-6 flex justify-center gap-3"><Link to="/auth" className="press rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in or register</Link></div></section></AppShell>;

  return (
    <AppShell>
      <section className="reveal pt-8">
        <h1 className="font-display text-3xl">Explore wishes</h1>
        <p className="mt-2 text-sm text-mute">
          Every wish here belongs to someone real. Give what you can.
        </p>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wishes"
            aria-label="Search wishes"
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-ink border-2 border-ink outline-none placeholder:text-mute focus:ring-2 focus:ring-primary"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as NonNullable<ExploreFilters["sort"]>)}
            aria-label="Sort wishes"
            className="rounded-xl bg-card px-4 py-3 text-sm font-medium text-ink border-2 border-ink outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {[{ slug: "all", name: "All" }, ...(categories.data ?? [])].map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={[
                "press shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                category === c.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-mute border-2 border-ink",
              ].join(" ")}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wishes.isPending ? (
          <>
            <WishCardSkeleton />
            <WishCardSkeleton />
            <WishCardSkeleton />
          </>
        ) : wishes.isError ? (
          <div className="md:col-span-2 lg:col-span-3">
            <ErrorState
              message="We couldn't load wishes right now."
              onRetry={() => void wishes.refetch()}
            />
          </div>
        ) : wishes.data?.length ? (
          wishes.data.map((wish, i) => <WishCard key={wish.id} wish={wish} index={i} />)
        ) : (
          <div className="md:col-span-2 lg:col-span-3">
            <EmptyState
              title="Nothing matches yet"
              description="Try a different search or category - or add a wish of your own."
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
      </section>
    </AppShell>
  );
}
