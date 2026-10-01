import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { bankDetailsSchema } from "@/lib/bank-details";
import { naira } from "@/lib/format";
import type { Wish } from "@/lib/queries";

export function WishBankSettings({ wish }: { wish: Wish }) {
  const queryClient = useQueryClient();
  const bank = useQuery({ queryKey: ["wish-bank-owner", wish.id], queryFn: async () => {
    const { data, error } = await supabase.from("wish_bank_details").select("bank_name,account_number,account_name").eq("wish_id", wish.id).maybeSingle();
    if (error) throw error;
    return data;
  }});
  const reports = useQuery({ queryKey: ["wish-transfer-reports", wish.id], queryFn: async () => {
    const { data, error } = await supabase.from("contributions").select("id,amount,contributor_display_name,is_anonymous,created_at").eq("wish_id", wish.id).eq("payment_status", "pending").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }});
  const [editing, setEditing] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = bankDetailsSchema.safeParse({ bank_name: bankName, account_number: accountNumber, account_name: accountName });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the account details."); return; }
    setBusy(true); setError(null);
    const { error: saveError } = await supabase.from("wish_bank_details").upsert({ wish_id: wish.id, owner_id: wish.user_id ?? "", ...parsed.data }, { onConflict: "wish_id" });
    setBusy(false);
    if (saveError) { setError(saveError.message); return; }
    await queryClient.invalidateQueries({ queryKey: ["wish-bank-owner", wish.id] });
    setEditing(false);
    if (wish.status === "draft") setNotice("Bank details saved. Make your wish public using the controls below when ready.");
  }

  async function confirm(id: string) {
    setBusy(true); setError(null);
    const { data, error: confirmError } = await supabase.rpc("confirm_wish_transfer", { _contribution_id: id });
    setBusy(false);
    if (confirmError || !data) { setError(confirmError?.message ?? "Could not confirm this transfer."); return; }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wish-transfer-reports", wish.id] }),
      queryClient.invalidateQueries({ queryKey: ["wish", wish.id] }),
      queryClient.invalidateQueries({ queryKey: ["wishes"] }),
      queryClient.invalidateQueries({ queryKey: ["my-wishes"] }),
    ]);
    setNotice("Payment confirmed and added to the wish total.");
  }

  return <div className="card-flat p-5">
    <h3 className="font-display text-lg">Your transfer account</h3>
    <p className="mt-1 text-xs text-mute">These details appear only when a signed-in giver chooses to contribute.</p>
    {bank.data && !editing ? <div className="mt-3 text-sm"><p>{bank.data.bank_name}</p><p className="font-semibold">{bank.data.account_number}</p><p>{bank.data.account_name}</p></div> : null}
    {!editing ? <Button type="button" variant="outline" className="mt-3 border-2 border-ink" onClick={() => { setBankName(bank.data?.bank_name ?? ""); setAccountNumber(bank.data?.account_number ?? ""); setAccountName(bank.data?.account_name ?? ""); setEditing(true); }}>{bank.data ? "Edit account" : "Add account"}</Button> : <form onSubmit={save} className="mt-4 space-y-3">
      <label className="block text-xs font-semibold">Bank name<input required maxLength={100} value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm" /></label>
      <label className="block text-xs font-semibold">Account number<input required maxLength={10} inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm" /></label>
      <label className="block text-xs font-semibold">Account name<input required maxLength={120} value={accountName} onChange={(e) => setAccountName(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-ink bg-canvas px-3 py-2 text-sm" /></label>
      <div className="flex gap-2"><Button disabled={busy} type="submit">Save</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
    </form>}
    {reports.data?.length ? <div className="mt-6 border-t-2 border-ink pt-4"><h4 className="font-display font-bold">Reported transfers</h4><p className="mt-1 text-xs text-mute">Check your bank account before confirming. Reports do not count toward your goal until confirmed.</p><ul className="mt-3 space-y-3">{reports.data.map((r) => <li key={r.id} className="border-b border-line pb-3 text-sm"><p className="font-semibold">{naira(Number(r.amount))} from {r.is_anonymous ? "Anonymous" : r.contributor_display_name ?? "A giver"}</p><Button type="button" disabled={busy} onClick={() => void confirm(r.id)} className="mt-2">Confirm received</Button></li>)}</ul></div> : null}
    {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
    {notice ? <p className="mt-3 text-sm text-success" role="status">{notice}</p> : null}
  </div>;
}
