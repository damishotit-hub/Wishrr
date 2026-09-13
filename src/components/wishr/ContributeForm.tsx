import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import type { Wish } from "@/lib/queries";

const PRESETS = [1000, 2500, 5000, 10000];

export function ContributeForm({ wish }: { wish: Wish }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const remaining = Math.max(0, Number(wish.goal_amount) - Number(wish.amount_raised));

  const [amount, setAmount] = useState<string>("2500");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = !!user && wish.user_id === user.id;

  if (isOwner) {
    return (
      <div className="card-frame p-5">
        <h3 className="font-display text-lg">This is your wish</h3>
        <p className="mt-2 text-sm text-mute">
          You can't give to your own wish. Share it so friends and strangers can help.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/wish/${wish.id}`;
              if (navigator.share) {
                void navigator.share({ title: wish.title, url });
              } else {
                void navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="press rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {copied ? "Link copied" : "Share this wish"}
          </button>
          <Link
            to="/dashboard"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink border-2 border-ink"
          >
            Manage in profile
          </Link>
        </div>
        <p className="mt-4 text-sm text-mute">
          {remaining > 0 ? `${naira(remaining)} still needed` : "Fully funded - well done."}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card-frame p-5">
        <h3 className="font-display text-lg">Help fulfil this wish</h3>
        <p className="mt-2 text-sm text-mute">
          Sign in to chip in. It takes a minute and you can stay anonymous.
        </p>
        <Link
          to="/auth"
          className="mt-4 inline-block press rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          Sign in to give
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card-frame p-5 border-2 border-ink">
        <h3 className="font-display text-lg">Thank you</h3>
        <p className="mt-2 text-sm text-mute">
          Your {naira(Number(amount))} is recorded on this wish. You'll see it in your activity.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink border-2 border-ink"
        >
          Give again
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value < 500) {
      setError("Please enter at least ₦500.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const displayName =
        (user!.user_metadata?.["display_name"] as string | undefined) ??
        user!.email?.split("@")[0] ??
        "A friend";

      const { error: insertError } = await supabase.from("contributions").insert({
        wish_id: wish.id,
        contributor_id: user!.id,
        amount: value,
        is_anonymous: anonymous,
        contributor_display_name: anonymous ? null : displayName,
        message: message.trim() || null,
        payment_status: "succeeded",
        transaction_reference: `demo_${Date.now()}`,
      });
      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["wish", wish.id] });
      await queryClient.invalidateQueries({ queryKey: ["wishes"] });
      await queryClient.invalidateQueries({ queryKey: ["my-contributions"] });
      setDone(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't record that contribution.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-frame p-5 border-2 border-ink">
      <h3 className="font-display text-lg">Make This Wish Happen</h3>
      <p className="mt-1 text-sm text-mute">{naira(remaining)} remaining of {naira(Number(wish.goal_amount))}</p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={[
              "rounded-xl py-2.5 text-xs font-semibold",
              Number(amount) === preset
                ? "bg-primary text-primary-foreground"
                : "bg-canvas text-ink border-2 border-ink",
            ].join(" ")}
          >
            {naira(preset)}
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-mute">Amount (₦)</span>
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          className="w-full rounded-xl bg-canvas px-4 py-3 text-sm border-2 border-ink outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-semibold text-mute">Note (optional)</span>
        <textarea
          rows={2}
          value={message}
          maxLength={200}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Wishing you well."
          className="w-full resize-none rounded-xl bg-canvas px-4 py-3 text-sm border-2 border-ink outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      <label className="mt-3 flex items-center gap-2.5 text-sm text-mute">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Give anonymously
      </label>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full press rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Sending…" : `Contribute ${naira(Number(amount) || 0)}`}
      </button>

      {remaining > 0 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setAmount(String(Math.round(remaining)))}
          className="mt-2 w-full press rounded-lg border-2 border-ink bg-accent px-4 py-3.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          Fulfill Entire Wish ({naira(remaining)})
        </button>
      ) : null}
      <p className="mt-2 text-center text-[11px] text-mute">
        Payments aren't live yet - this records your contribution without moving money.
      </p>
    </form>
  );
}
