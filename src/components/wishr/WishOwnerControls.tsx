import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABELS } from "@/lib/format";
import type { Wish, WishStatus } from "@/lib/queries";

type ActionKey = "hide" | "unhide" | "archive" | "reopen" | "delete";

const COPY: Record<ActionKey, { label: string; title: string; body: string; confirm: string }> = {
  hide: {
    label: "Hide wish",
    title: "Hide this wish?",
    body: "It stops showing publicly and nobody can give to it. You can bring it back any time.",
    confirm: "Hide it",
  },
  unhide: {
    label: "Make public again",
    title: "Make this wish public?",
    body: "It goes back into Explore so people can find it and give.",
    confirm: "Make it public",
  },
  archive: {
    label: "Archive wish",
    title: "Archive this wish?",
    body: "It closes to new giving and moves out of Explore. Past contributions stay on record.",
    confirm: "Archive it",
  },
  reopen: {
    label: "Reopen wish",
    title: "Reopen this wish?",
    body: "People will be able to find it and give again.",
    confirm: "Reopen it",
  },
  delete: {
    label: "Delete wish",
    title: "Delete this wish for good?",
    body: "This cannot be undone. The wish and its updates are removed permanently.",
    confirm: "Delete forever",
  },
};

export function WishOwnerControls({
  wish,
  onDeleted,
}: {
  wish: Wish;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pending, setPending] = useState<ActionKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHidden = wish.status === "draft";
  const isArchived = wish.status === "closed";

  const actions: ActionKey[] = [
    isHidden ? "unhide" : "hide",
    isArchived ? "reopen" : "archive",
    "delete",
  ];

  async function run(action: ActionKey) {
    setBusy(true);
    setError(null);
    try {
      if (action === "delete") {
        const { error: delError } = await supabase.from("wishes").delete().eq("id", wish.id);
        if (delError) throw delError;
      } else {
        const status: WishStatus =
          action === "hide" ? "draft" : action === "archive" ? "closed" : "active";
        const { error: upError } = await supabase
          .from("wishes")
          .update({ status })
          .eq("id", wish.id);
        if (upError) throw upError;
      }

      await queryClient.invalidateQueries({ queryKey: ["wish", wish.id] });
      await queryClient.invalidateQueries({ queryKey: ["wishes"] });
      await queryClient.invalidateQueries({ queryKey: ["my-wishes"] });
      setPending(null);

      if (action === "delete") {
        if (onDeleted) onDeleted();
        else await navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-flat p-5">
      <span className="eyebrow">Your controls</span>
      <p className="mt-2 text-sm text-mute">
        Status: <span className="font-semibold text-ink">{STATUS_LABELS[wish.status] ?? wish.status}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setError(null);
              setPending(key);
            }}
            className={[
              "press rounded-lg border-2 border-ink px-4 py-2.5 text-xs font-semibold",
              key === "delete" ? "bg-destructive text-destructive-foreground" : "bg-card text-ink",
            ].join(" ")}
          >
            {COPY[key].label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      {pending ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={COPY[pending].title}
        >
          <div className="card-frame w-full max-w-sm p-5">
            <h3 className="font-display text-lg">{COPY[pending].title}</h3>
            <p className="mt-2 text-sm text-mute">{COPY[pending].body}</p>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending(null)}
                className="rounded-lg border-2 border-ink px-4 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(pending)}
                className={[
                  "press rounded-lg border-2 border-ink px-4 py-2.5 text-xs font-semibold disabled:opacity-60",
                  pending === "delete"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground",
                ].join(" ")}
              >
                {busy ? "Working…" : COPY[pending].confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
