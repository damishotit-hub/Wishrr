import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

const OPTIONS = [
  { value: "wisher", label: "I have a wish", hint: "Share something you're hoping for" },
  { value: "giver", label: "I want to give", hint: "Help make wishes come true" },
  { value: "both", label: "Both", hint: "A bit of each, depending on the day" },
] as const;

export const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export function OnboardingPrompt() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const [dismissed, setDismissed] = useState(false);
  const [handle, setHandle] = useState("");
  const [location, setLocation] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data?.username && !handle) setHandle(profile.data.username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data?.username]);

  const refresh = () => user && queryClient.invalidateQueries({ queryKey: ["profile", user.id] });

  const claim = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const clean = handle.trim().toLowerCase().replace(/^@/, "");
      if (!USERNAME_RE.test(clean)) throw new Error("Use 3 to 24 letters, numbers, or underscores.");
      const { error: err } = await supabase.from("profiles").update({ username: clean, username_confirmed: true }).eq("id", user.id);
      if (err) throw new Error(err.code === "23505" ? "That username is taken. Try another." : err.message);
    },
    onSuccess: () => { setError(null); void refresh(); },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save."),
  });

  const finish = useMutation({
    mutationFn: async () => {
      if (!user || !intent) return;
      const loc = location.trim();
      if (loc && (loc.length < 2 || loc.length > 80)) throw new Error("Location should be 2 to 80 characters.");
      const { error: err } = await supabase.from("profiles").update({ intent, location: loc || null }).eq("id", user.id);
      if (err) throw err;
    },
    onSuccess: () => { setError(null); void refresh(); },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save."),
  });

  if (loading || !user || !profile.data) return null;
  const needsHandle = !profile.data.username_confirmed;
  if (!needsHandle && (profile.data.intent || dismissed)) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 px-5">
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="pop-in card-frame w-full max-w-sm border-2 border-ink bg-card p-6">
        <p className="eyebrow">Welcome to Wishr · Step {needsHandle ? 1 : 2} of 2</p>
        {needsHandle ? (
          <form onSubmit={(e) => { e.preventDefault(); claim.mutate(); }}>
            <h2 id="onboarding-title" className="mt-2 font-display text-2xl">Claim your username</h2>
            <p className="mt-2 text-sm text-mute">This is how people find you and share your profile. You can change it later.</p>
            <div className="mt-4 flex rounded-lg border-2 border-ink bg-canvas focus-within:ring-2 focus-within:ring-primary">
              <span className="px-3 py-3 font-bold text-mute">@</span>
              <input autoFocus required minLength={3} maxLength={24} value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} aria-label="Username" className="min-w-0 flex-1 bg-transparent py-3 pr-3 font-semibold outline-none" />
            </div>
            <p className="mt-1 text-xs text-mute">wishrr.lovable.app/u/{handle || "yourname"}</p>
            {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
            <button type="submit" disabled={claim.isPending} className="press mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{claim.isPending ? "Saving..." : "Claim and continue"}</button>
          </form>
        ) : (
          <>
            <h2 id="onboarding-title" className="mt-2 font-display text-2xl">What brings you here?</h2>
            <p className="mt-2 text-sm text-mute">This just personalizes your welcome. Every feature stays open to you either way.</p>
            <div className="mt-5 space-y-3">
              {OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setIntent(opt.value)} aria-pressed={intent === opt.value}
                  className={`press w-full rounded-lg border-2 border-ink px-4 py-3 text-left ${intent === opt.value ? "bg-secondary" : "bg-canvas"}`}>
                  <span className="block text-sm font-bold text-ink">{opt.label}</span>
                  <span className="block text-xs text-mute">{opt.hint}</span>
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-semibold">City / State <span className="font-normal text-mute">(optional)</span>
              <input value={location} maxLength={80} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ikeja, Lagos" className="mt-1 w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2.5 text-sm" />
            </label>
            {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
            <button type="button" disabled={!intent || finish.isPending} onClick={() => finish.mutate()} className="press mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">Enter Wishr</button>
            <button type="button" onClick={() => setDismissed(true)} className="mt-3 w-full text-center text-xs font-semibold text-mute hover:text-ink">Skip for now</button>
          </>
        )}
      </div>
    </div>
  );
}
