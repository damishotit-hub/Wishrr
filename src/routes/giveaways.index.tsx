import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { GiveawayCard, GiveawayCardSkeleton } from "@/components/wishr/GiveawayCard";
import { EmptyState, ErrorState } from "@/components/wishr/EmptyState";
import { categoriesQuery, publicGiveawaysQuery } from "@/lib/queries";

export const Route = createFileRoute("/giveaways/")({
  head: () => ({
    meta: [
      { title: "Giveaways - Wishr" },
      {
        name: "description",
        content:
          "Sometimes you have something someone else needs. Browse open giveaways from people ready to give.",
      },
      { property: "og:title", content: "Giveaways - Wishr" },
      {
        property: "og:description",
        content: "Sometimes you have something someone else needs. Browse open giveaways on Wishr.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Giveaways,
});

function Giveaways() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useQuery(categoriesQuery);
  const giveaways = useQuery(publicGiveawaysQuery({ search, category }));

  return (
    <AppShell>
      <section className="reveal pt-8">
        <h1 className="font-display text-3xl">Giveaways</h1>
        <p className="mt-2 text-sm text-mute">
          Sometimes you have something someone else needs.
        </p>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search giveaways"
            aria-label="Search giveaways"
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-ink border-2 border-ink outline-none placeholder:text-mute focus:ring-2 focus:ring-primary"
          />
          <Link
            to="/giveaways/new"
            className="press shrink-0 rounded-lg bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Create a Giveaway
          </Link>
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
        {giveaways.isPending ? (
          <>
            <GiveawayCardSkeleton />
            <GiveawayCardSkeleton />
            <GiveawayCardSkeleton />
          </>
        ) : giveaways.isError ? (
          <div className="md:col-span-2 lg:col-span-3">
            <ErrorState
              message="We couldn't load giveaways right now."
              onRetry={() => void giveaways.refetch()}
            />
          </div>
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
      </section>
    </AppShell>
  );
}
