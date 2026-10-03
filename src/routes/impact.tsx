import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wishr/AppShell";
import { ImpactCard } from "@/components/wishr/ImpactCard";
import { WishCardSkeleton } from "@/components/wishr/WishCard";
import { EmptyState, ErrorState } from "@/components/wishr/EmptyState";
import { impactQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Impact Wall - Granted wishes on Wishr" },
      { name: "description", content: "Wishes that came true, with thank-you notes from the people who made them." },
      { property: "og:title", content: "Impact Wall - Granted wishes on Wishr" },
      { property: "og:description", content: "Wishes that came true, with thank-you notes from the people who made them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Impact,
});

function Impact() {
  const { user, loading } = useAuth();
  const q = useQuery({ ...impactQuery(), enabled: !!user });

  if (loading) return <AppShell><div className="mt-8 h-40 animate-pulse bg-warm" /></AppShell>;
  if (!user) return <AppShell><section className="mx-auto max-w-xl py-16 text-center"><span className="eyebrow">Impact Wall</span><h1 className="mt-3 font-display text-3xl">Proof that kindness lands.</h1><p className="mt-3 text-sm text-mute">Sign in to see wishes that came true and the thank-you notes behind them.</p><Link to="/auth" className="press mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in or register</Link></section></AppShell>;

  return (
    <AppShell>
      <section className="reveal pt-8">
        <p className="eyebrow">Impact Wall</p>
        <h1 className="mt-2 font-display text-3xl">Granted wishes</h1>
        <p className="mt-2 text-sm text-mute">Real wishes that came true, and the thank-yous that followed.</p>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {q.isPending ? <><WishCardSkeleton /><WishCardSkeleton /><WishCardSkeleton /></> : q.isError ? (
          <div className="md:col-span-2 lg:col-span-3"><ErrorState message="We couldn't load granted wishes." onRetry={() => void q.refetch()} /></div>
        ) : q.data?.length ? q.data.map((w) => <ImpactCard key={w.id} wish={w} />) : (
          <div className="md:col-span-2 lg:col-span-3"><EmptyState title="No granted wishes yet" description="When a wish comes true, its story shows up here." action={<Link to="/explore" className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Help grant one</Link>} /></div>
        )}
      </section>
    </AppShell>
  );
}
