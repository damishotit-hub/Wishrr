import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContributeForm } from "./ContributeForm";
import { MemberAvatar } from "./MemberAvatar";
import { ProgressMeter } from "./ProgressMeter";
import type { ActiveWisher, Wish } from "@/lib/queries";

export function ActiveWisherCard({ item }: { item: ActiveWisher }) {
  const [open, setOpen] = useState(false);
  const wish = {
    id: item.wish_id,
    user_id: item.profile_id,
    title: item.wish_title,
    summary: item.wish_summary,
    goal_amount: item.goal_amount,
    amount_raised: item.amount_raised,
    status: "active",
  } as Wish;

  return <>
    <article className="rounded-lg border border-line bg-card p-5 soft-shadow">
      <div className="flex items-center gap-3">
        <MemberAvatar path={item.avatar_url} name={item.display_name} className="size-12" />
        <div className="min-w-0"><Link to="/u/$username" params={{ username: item.username }} className="block truncate font-display font-bold hover:text-primary">{item.display_name}</Link><p className="truncate text-xs text-mute">@{item.username}</p></div>
      </div>
      <Link to="/wish/$id" params={{ id: item.wish_id }} className="mt-4 block line-clamp-2 text-sm font-semibold hover:text-primary">{item.wish_title}</Link>
      <div className="mt-3"><ProgressMeter raised={Number(item.amount_raised)} goal={Number(item.goal_amount)} animate={false} /></div>
      <Button type="button" onClick={() => setOpen(true)} className="mt-4 w-full">Drop a Blessing</Button>
    </article>
    {open ? <div className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-ink/55 p-4" role="dialog" aria-modal="true" aria-label={`Drop a blessing for ${item.display_name}`}>
      <div className="relative w-full max-w-md py-8"><Button type="button" size="icon" variant="secondary" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-11 z-10 border border-line"><X /></Button><ContributeForm wish={wish} /><Link to="/wish/$id" params={{ id: item.wish_id }} className="mt-4 block text-center text-sm font-semibold text-primary">View full wish</Link></div>
    </div> : null}
  </>;
}