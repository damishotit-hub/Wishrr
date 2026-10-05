import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const REPORT_REASONS = [
  { value: "scam", label: "Scam" },
  { value: "false_information", label: "Fake story / False information" },
  { value: "prohibited_item", label: "Prohibited item" },
  { value: "offensive", label: "Offensive content" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
] as const;

export const REASON_LABEL: Record<string, string> = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]));

export function ReportButton({ target, id }: { target: "wish" | "giveaway"; id: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("scam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;
  const label = target === "wish" ? "Report Wish" : "Report Giveaway";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error: err } = await supabase.from("content_reports").insert({
      target_type: target,
      wish_id: target === "wish" ? id : null,
      giveaway_id: target === "giveaway" ? id : null,
      reporter_id: user!.id,
      reason,
      details: details.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (err) return setError(err.message);
    setDone(true);
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setDone(false); }} className="text-xs font-semibold text-mute underline hover:text-destructive">
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label={label}>
          <div className="pop-in card-frame w-full max-w-md bg-card p-5">
            {done ? (
              <>
                <p className="font-display text-xl">Thanks for telling us.</p>
                <p className="mt-1 text-sm text-mute">Our team will review this report. Your name is never shown to the person you reported.</p>
                <button onClick={() => setOpen(false)} className="press mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Close</button>
              </>
            ) : (
              <form onSubmit={submit}>
                <p className="font-display text-xl">{label}</p>
                <p className="mt-1 text-sm text-mute">What's wrong with this {target}?</p>
                <div className="mt-4 grid gap-2">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink px-3 py-2 text-sm ${reason === r.value ? "bg-secondary font-semibold" : "bg-card"}`}>
                      <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                      {r.label}
                    </label>
                  ))}
                </div>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} placeholder="Anything else we should know? (optional)" className="mt-3 w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="press rounded-lg border-2 border-ink bg-card px-4 py-3 text-sm font-semibold">Cancel</button>
                  <button disabled={busy} className="press rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Sending..." : "Send report"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
