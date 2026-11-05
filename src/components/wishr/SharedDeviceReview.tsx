import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function SharedDeviceReview() {
  const review = useQuery({
    queryKey: ["admin", "shared-devices"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_shared_devices");
      if (error) throw error;
      return data ?? [];
    },
  });
  const groups = new Map<string, NonNullable<typeof review.data>>();
  for (const account of review.data ?? []) {
    const rows = groups.get(account.device_hash) ?? [];
    rows.push(account);
    groups.set(account.device_hash, rows);
  }
  return <section>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-xl">Shared-device signup review</h2>
      <Button variant="outline" disabled={review.isFetching} onClick={() => void review.refetch()}>Refresh</Button>
    </div>
    <p className="mt-2 text-sm text-mute">These accounts share a browser fingerprint. Shared devices and similar browsers can match, so this is not proof of abuse. Registration remains open.</p>
    {review.isPending ? <p className="mt-4 text-sm text-mute">Checking accounts…</p> : review.isError ? <p role="alert" className="mt-4 text-sm text-destructive">Could not load shared-device accounts. Try refreshing.</p> : groups.size === 0 ? <p className="mt-4 text-sm text-mute">No shared-device accounts found.</p> : <ul className="mt-4 space-y-4">
      {Array.from(groups.entries()).map(([hash, accounts], index) => <li key={hash} className="card-frame p-4">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Shared browser {index + 1}</h3><span className="pill-outline">{accounts.length} accounts · Needs review</span></div>
        <ul className="mt-3 divide-y divide-line">
          {accounts.map((account) => <li key={account.user_id} className="min-w-0 py-3">
            <p className="break-words text-sm font-semibold">{account.display_name ?? "Unnamed"} {account.username ? <Link to="/u/$username" params={{ username: account.username }} className="text-primary underline">@{account.username}</Link> : null}</p>
            <p className="break-all text-xs text-mute">{account.email}</p>
            <p className="mt-1 text-xs text-mute">Joined {timeAgo(account.created_at)} · Browser recorded {timeAgo(account.first_seen_at)}</p>
          </li>)}
        </ul>
      </li>)}
    </ul>}
  </section>;
}