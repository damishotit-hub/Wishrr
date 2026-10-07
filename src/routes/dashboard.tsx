import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/wishr/AppShell";
import { EmptyState } from "@/components/wishr/EmptyState";
import { ProgressMeter } from "@/components/wishr/ProgressMeter";
import { useAuth } from "@/lib/auth";
import { myContributionsQuery, myWishesQuery, profileQuery } from "@/lib/queries";
import { initials, naira, STATUS_LABELS, timeAgo } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MyGiveaways } from "@/components/wishr/MyGiveaways";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const userId = user?.id ?? "";
  const profile = useQuery({ ...profileQuery(userId), enabled: !!userId });
  const wishes = useQuery({ ...myWishesQuery(userId), enabled: !!userId });
  const contributions = useQuery({ ...myContributionsQuery(userId), enabled: !!userId });

  useEffect(() => {
    const path = profile.data?.avatar_url;
    if (!path) { setPhotoUrl(null); return; }
    let active = true;
    void supabase.storage.from("profile-avatars").createSignedUrl(path, 3600).then(({ data }) => {
      if (active) setPhotoUrl(data?.signedUrl ?? null);
    });
    return () => { active = false; };
  }, [profile.data?.avatar_url]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const cleanName = displayName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    if (cleanName.length < 2 || cleanName.length > 80) { setProfileError("Enter a name between 2 and 80 characters."); return; }
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) { setProfileError("Username must be 3 to 24 characters using letters, numbers, or underscores."); return; }
    const cleanLocation = location.trim();
    if (cleanLocation && (cleanLocation.length < 2 || cleanLocation.length > 80)) { setProfileError("Location should be 2 to 80 characters."); return; }
    setSaving(true); setProfileError(null); setProfileNotice(null);
    try {
      let avatar = profile.data?.avatar_url ?? null;
      if (photo) {
        if (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024) throw new Error("Choose an image under 5MB.");
        const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, photo, { contentType: photo.type });
        if (uploadError) throw uploadError;
        avatar = path;
      }
      const { error: updateError } = await supabase.from("profiles").update({ display_name: cleanName, username: cleanUsername, username_confirmed: true, location: cleanLocation || null, avatar_url: avatar }).eq("id", user.id);
      if (updateError) throw updateError;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      setPhoto(null); setEditing(false); setProfileNotice("Profile updated.");
    } catch (err) { setProfileError(err instanceof Error ? err.message : "Could not save your profile."); }
    finally { setSaving(false); }
  }

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
            className="mt-6 inline-block press rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </section>
      </AppShell>
    );
  }

  const name = profile.data?.display_name ?? user.email ?? "You";
  const given = (contributions.data ?? []).filter((c) => c.payment_status === "succeeded").reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <AppShell>
      <section className="pt-8">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-warm font-display text-lg">
            {photoUrl ? <img src={photoUrl} alt="Your profile" className="size-full object-cover" /> : initials(name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl">{name}</h1>
            {profile.data?.username ? <Link to="/u/$username" params={{ username: profile.data.username }} className="block truncate text-sm font-semibold text-primary">@{profile.data.username}</Link> : null}
            <p className="truncate text-sm text-mute">{user.email}{profile.data?.location ? ` · ${profile.data.location}` : ""}</p>
          </div>
        </div>
        <Button type="button" variant="outline" className="mt-4 border border-line" onClick={() => { setDisplayName(profile.data?.display_name ?? ""); setUsername(profile.data?.username ?? ""); setLocation(profile.data?.location ?? ""); setEditing(!editing); setProfileError(null); }}>Edit profile</Button>
        {editing ? <form onSubmit={saveProfile} className="mt-4 max-w-md space-y-3 border-t-2 border-ink pt-4">
          <label className="block text-sm font-semibold">Display name<input required minLength={2} maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-ink bg-card px-4 py-3" /></label>
          <label className="block text-sm font-semibold">Username<div className="mt-1 flex rounded-lg border border-line bg-card focus-within:ring-2 focus-within:ring-primary"><span className="px-3 py-3 text-mute">@</span><input required minLength={3} maxLength={24} pattern="[a-z0-9_]+" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className="min-w-0 flex-1 bg-transparent py-3 pr-4 outline-none" /></div></label>
          <label className="block text-sm font-semibold">City / State (optional)<input maxLength={80} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ikeja, Lagos" className="mt-1 w-full rounded-lg border-2 border-ink bg-card px-4 py-3" /></label>
          <label className="block text-sm font-semibold">Profile picture (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" /></label>
          <p className="text-xs text-mute">JPEG, PNG or WebP, up to 5MB.</p>
          <div className="flex gap-2"><Button type="submit" disabled={saving}>Save profile</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
        </form> : null}
        {profileError ? <p role="alert" className="mt-3 text-sm text-destructive">{profileError}</p> : null}
        {profileNotice ? <p role="status" className="mt-3 text-sm text-success">{profileNotice}</p> : null}

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
                  className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Make a wish
                </Link>
              }
            />
          </div>
        )}
      </section>

      <MyGiveaways userId={user.id} />

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
                     <p className="mt-1 text-[11px] text-mute">{timeAgo(c.created_at)} · {c.payment_status === "pending" ? "Awaiting wisher confirmation" : c.payment_status === "succeeded" ? "Confirmed" : c.payment_status}</p>
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
                  className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
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
