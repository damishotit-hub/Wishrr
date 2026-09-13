import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

const OPTIONS = [
  { value: "wisher", label: "I have a wish", hint: "Share something you're hoping for" },
  { value: "giver", label: "I want to give", hint: "Help make wishes come true" },
  { value: "both", label: "Both", hint: "A bit of each, depending on the day" },
] as const;

export function OnboardingPrompt() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({
    ...profileQuery(user?.id ?? ""),
    enabled: !!user,
  });
  const [dismissed, setDismissed] = useState(false);

  const save = useMutation({
    mutationFn: async (intent: string) => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ intent }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    },
  });

  if (loading || !user || dismissed) return null;
  if (!profile.data || profile.data.intent) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 px-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="pop-in card-frame w-full max-w-sm border-2 border-ink bg-card p-6"
      >
        <p className="eyebrow">Welcome to Wishr</p>
        <h2 id="onboarding-title" className="mt-2 font-display text-2xl">
          What brings you here?
        </h2>
        <p className="mt-2 text-sm text-mute">
          This just personalizes your welcome. Every feature stays open to you either way.
        </p>

        <div className="mt-5 space-y-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate(opt.value)}
              className="press w-full rounded-lg border-2 border-ink bg-canvas px-4 py-3 text-left disabled:opacity-60"
            >
              <span className="block text-sm font-bold text-ink">{opt.label}</span>
              <span className="block text-xs text-mute">{opt.hint}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-4 w-full text-center text-xs font-semibold text-mute hover:text-ink"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
