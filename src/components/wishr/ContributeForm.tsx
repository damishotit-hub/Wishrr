import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { naira } from "@/lib/format";
import type { Wish } from "@/lib/queries";

const PRESETS = [1000, 2500, 5000, 10000];
const amountSchema = z.number().int().min(500).max(100000000);
type BankDetails = { bank_name: string; account_name: string; account_number: string };

export function ContributeForm({ wish }: { wish: Wish }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const remaining = Math.max(0, Number(wish.goal_amount) - Number(wish.amount_raised));
  const [amount, setAmount] = useState("2500");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (user && wish.user_id === user.id) {
    return <div className="card-frame p-5"><h3 className="font-display text-lg">This is your wish</h3><p className="mt-2 text-sm text-mute">You can't contribute to your own wish. Share it so others can help.</p><Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-primary">Manage in profile</Link></div>;
  }
  if (!user) {
    return <div className="card-frame p-5"><h3 className="font-display text-lg">Make This Wish Happen</h3><p className="mt-2 text-sm text-mute">Sign in to see the transfer details and help fulfil this wish.</p><Link to="/auth" className="mt-4 inline-block press rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Sign in to give</Link></div>;
  }
  if (done) {
    return <div className="card-frame p-5" role="status"><h3 className="font-display text-lg">Payment reported</h3><p className="mt-2 text-sm text-mute">The wisher has been notified. Your {naira(Number(amount))} will count toward the wish only after they confirm it arrived.</p><Button onClick={() => { setDone(false); setBank(null); }} variant="outline" className="mt-4 border-2 border-ink">Done</Button></div>;
  }

  async function openTransfer(value: string) {
    const parsed = amountSchema.safeParse(Number(value));
    if (!parsed.success || !Number.isInteger(Number(value))) { setError("Enter an amount between ₦500 and ₦100,000,000."); return; }
    setBusy(true); setError(null);
    try {
      const { data, error: lookupError } = await supabase.rpc("get_wish_bank_details", { _wish_id: wish.id });
      if (lookupError) throw lookupError;
      const details = data?.[0];
      if (!details) throw new Error("Transfer details aren't available for this wish yet.");
      setAmount(value); setBank(details);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load transfer details."); }
    finally { setBusy(false); }
  }

  async function reportPayment() {
    if (!user || !bank) return;
    const parsed = amountSchema.safeParse(Number(amount));
    if (!parsed.success) { setError("Enter a valid transfer amount."); return; }
    setBusy(true); setError(null);
    try {
      const { error: insertError } = await supabase.from("contributions").insert({
        wish_id: wish.id, contributor_id: user.id, amount: parsed.data,
        is_anonymous: anonymous, contributor_display_name: anonymous ? null : String(user.user_metadata?.["display_name"] ?? user.email?.split("@")[0] ?? "A friend"),
        message: message.trim().slice(0, 200) || null, payment_status: "pending",
      });
      if (insertError) throw insertError;
      await queryClient.invalidateQueries({ queryKey: ["my-contributions"] });
      setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not report the transfer."); }
    finally { setBusy(false); }
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(null), 2000); }
    catch { setError("Copy failed. Please select the details manually."); }
  }

  return <>
    <div className="card-frame p-5">
      <h3 className="font-display text-lg">Make This Wish Happen</h3>
      <p className="mt-1 text-sm text-mute">{naira(remaining)} remaining of {naira(Number(wish.goal_amount))}</p>
      {remaining > 0 && (wish.status === "active" || wish.status === "partially_funded") ? <>
        <div className="mt-4 grid grid-cols-4 gap-2">{PRESETS.map((preset) => <Button key={preset} type="button" onClick={() => setAmount(String(preset))} variant={Number(amount) === preset ? "default" : "outline"} className="min-w-0 border-2 border-ink px-1 text-xs">{naira(preset)}</Button>)}</div>
        <label className="mt-4 block"><span className="mb-1 block text-xs font-semibold text-mute">Amount (₦)</span><input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className="w-full rounded-lg border-2 border-ink bg-canvas px-4 py-3 text-sm" /></label>
        <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold text-mute">Note (optional)</span><textarea rows={2} maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border-2 border-ink bg-canvas px-4 py-3 text-sm" /></label>
        <label className="mt-3 flex items-center gap-2 text-sm text-mute"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Give anonymously</label>
        <Button type="button" disabled={busy} onClick={() => void openTransfer(amount)} className="press mt-4 w-full">Contribute {naira(Number(amount) || 0)}</Button>
        <Button type="button" disabled={busy} onClick={() => void openTransfer(String(Math.round(remaining)))} variant="secondary" className="press mt-3 w-full border-2 border-ink">Fulfill Entire Wish ({naira(remaining)})</Button>
        <p className="mt-3 text-center text-xs text-mute">Transfers happen outside Wishr. Funding is counted only after the wisher confirms receipt.</p>
      </> : <p className="mt-3 text-sm text-mute">This wish is not accepting contributions.</p>}
      {error && !bank ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
    {bank ? <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/70 p-4" role="dialog" aria-modal="true" aria-label="Bank transfer details">
      <div className="card-frame w-full max-w-md max-h-[90vh] overflow-y-auto p-5 text-ink">
        <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Bank transfer</p><h3 className="mt-1 font-display text-xl">Send {naira(Number(amount))}</h3></div><Button size="icon" variant="ghost" aria-label="Close transfer details" onClick={() => { setBank(null); setError(null); }}><X /></Button></div>
        <p className="mt-2 text-sm text-mute">Transfer directly to the wisher, then report your payment below.</p>
        <div className="mt-5 space-y-3">{([ ["Bank", bank.bank_name], ["Account number", bank.account_number], ["Account name", bank.account_name], ["Exact amount", naira(Number(amount))] ] as const).map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line pb-3"><div className="min-w-0"><p className="text-xs text-mute">{label}</p><p className="break-words font-semibold">{value}</p></div><Button type="button" variant="outline" size="icon" className="shrink-0 border-2 border-ink" title={`Copy ${label}`} aria-label={`Copy ${label}`} onClick={() => void copy(value, label)}><Copy /></Button></div>)}</div>
        {copied ? <p className="text-xs text-success" role="status">{copied} copied</p> : null}
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
        <Button type="button" disabled={busy} onClick={() => void reportPayment()} className="press mt-5 w-full">{busy ? "Reporting…" : "I have sent payment"}</Button>
        <p className="mt-3 text-xs text-mute">Reporting is not proof of payment. The wisher must verify the deposit before this amount appears as funded.</p>
      </div>
    </div> : null}
  </>;
}
