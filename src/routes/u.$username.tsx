import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { MemberAvatar } from "@/components/wishr/MemberAvatar";
import { WishCard, WishCardSkeleton } from "@/components/wishr/WishCard";
import { GiveawayCard, GiveawayCardSkeleton } from "@/components/wishr/GiveawayCard";
import { EmptyState } from "@/components/wishr/EmptyState";
import { Button } from "@/components/ui/button";
import { MessageButton } from "@/components/wishr/MessageButton";
import { MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { profileGiveawaysQuery, profileWishesQuery, publicProfileQuery } from "@/lib/queries";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({ meta: [
    { title: `@${params.username} on Wishr` },
    { name: "description", content: `See @${params.username}'s wishes, granted wishes, and giveaways on Wishr.` },
    { property: "og:title", content: `@${params.username} on Wishr` },
    { property: "og:description", content: "See this member's wishes and giving activity on Wishr." },
    { property: "og:type", content: "profile" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const profile = useQuery({ ...publicProfileQuery(username), enabled: !!user });
  const userId = profile.data?.id ?? "";
  const wishes = useQuery({ ...profileWishesQuery(userId), enabled: !!userId });
  const giveaways = useQuery({ ...profileGiveawaysQuery(userId), enabled: !!userId });

  if (!loading && !user) return <AppShell><section className="mx-auto max-w-xl py-16 text-center"><p className="eyebrow">Member profile</p><h1 className="mt-3 font-display text-3xl">Meet the people on Wishr.</h1><p className="mt-3 text-sm text-mute">Sign in to view member profiles and their active wishes.</p><Link to="/auth" className="press mt-6 inline-block rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Sign in or register</Link></section></AppShell>;
  if (loading || profile.isPending) return <AppShell><div className="mx-auto mt-10 h-48 max-w-3xl shimmer rounded-lg" /></AppShell>;
  if (!profile.data) return <AppShell><div className="pt-10"><EmptyState title="Profile not found" description="This username may have changed or is not available." /></div></AppShell>;

  const active = (wishes.data ?? []).filter((wish) => wish.status !== "fulfilled");
  const granted = (wishes.data ?? []).filter((wish) => wish.status === "fulfilled");
  async function share() {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title: `${profile.data?.display_name} on Wishr`, url }); return; }
    await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  return <AppShell>
    <section className="mx-auto pt-8">
      <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-center">
        <MemberAvatar path={profile.data.avatar_url} name={profile.data.display_name} className="size-24 text-2xl" />
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate font-display text-3xl">{profile.data.display_name}</h1>{profile.data.is_verified ? <Check className="size-5 rounded-full bg-primary p-1 text-primary-foreground" aria-label="Verified member" /> : null}</div><p className="mt-1 text-sm font-semibold text-primary">@{profile.data.username}</p>{profile.data.location ? <p className="mt-1 inline-flex items-center gap-1 text-sm text-mute"><MapPin className="size-3.5" />{profile.data.location}</p> : null}{profile.data.bio ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">{profile.data.bio}</p> : null}</div>
        <MessageButton otherId={profile.data.id} />
        <Button type="button" variant="outline" onClick={() => void share()} className="border border-line">{copied ? <Copy /> : <Share2 />}{copied ? "Copied" : "Share"}</Button>
      </div>

      <ProfileSection title="Active wishes" count={active.length}>{wishes.isPending ? <CardLoading /> : active.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{active.map((wish, index) => <WishCard key={wish.id} wish={wish} index={index} />)}</div> : <p className="text-sm text-mute">No active wishes right now.</p>}</ProfileSection>
      <ProfileSection title="Granted wishes" count={granted.length}>{wishes.isPending ? <CardLoading /> : granted.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{granted.map((wish, index) => <WishCard key={wish.id} wish={wish} index={index} />)}</div> : <p className="text-sm text-mute">No granted wishes yet.</p>}</ProfileSection>
      <ProfileSection title="Hosted giveaways" count={giveaways.data?.length ?? 0}>{giveaways.isPending ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"><GiveawayCardSkeleton /></div> : giveaways.data?.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{giveaways.data.map((giveaway, index) => <GiveawayCard key={giveaway.id} giveaway={giveaway} index={index} />)}</div> : <p className="text-sm text-mute">No hosted giveaways yet.</p>}</ProfileSection>
    </section>
  </AppShell>;
}

function ProfileSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) { return <section className="mt-10"><div className="mb-5 flex items-baseline gap-2"><h2 className="font-display text-2xl">{title}</h2><span className="text-sm text-mute">{count}</span></div>{children}</section>; }
function CardLoading() { return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"><WishCardSkeleton /><WishCardSkeleton /></div>; }