import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Gift, HeartHandshake, LoaderCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { notificationTarget } from "@/lib/notification-target";
import { timeAgo } from "@/lib/format";

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { feed, unread, countError, markRead } = useNotifications(user?.id ?? "");
  if (!user) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative size-9 shrink-0 rounded-lg bg-card" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications">
          <Bell className="!size-4" />
          {unread > 0 ? <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground" aria-hidden="true">{unread > 99 ? "99+" : unread}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} collisionPadding={12} aria-label="Notifications" className="w-[calc(100vw-24px)] max-w-sm overflow-hidden rounded-2xl border-line bg-card p-0 shadow-xl motion-reduce:animate-none">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="font-display text-base">Notifications</h2>
          <Button variant="ghost" size="sm" disabled={!unread || markRead.isPending} onClick={() => markRead.mutate(undefined)} className="h-8 gap-1.5 px-2 text-xs">
            {markRead.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}Mark all as read
          </Button>
        </div>
        <div className="max-h-[min(60dvh,480px)] overflow-y-auto overscroll-contain">
          {feed.isPending ? <div className="flex justify-center p-8"><LoaderCircle className="size-5 animate-spin text-mute" aria-label="Loading notifications" /></div> : feed.isError ? <div className="p-5 text-center"><p className="text-sm text-mute">Couldn't load your notifications.</p><Button variant="ghost" size="sm" onClick={() => { void feed.refetch(); }}>Try again</Button></div> : feed.data?.length ? (
            <ul className="divide-y divide-line">
              {feed.data.map((item) => {
                const target = notificationTarget(item.link);
                const Icon = target?.kind === "message" ? MessageCircle : target?.kind === "giveaway" ? Gift : HeartHandshake;
                const content = <><span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-ink"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold leading-5">{item.title}</span>{item.body ? <span className="mt-1 block break-words text-xs leading-5 text-mute">{item.body}</span> : null}<span className="mt-2 block text-[10px] text-mute">{timeAgo(item.created_at)}</span></span>{!item.is_read ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}</>;
                const className = `flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-muted/70 ${item.is_read ? "bg-card" : "bg-secondary/40"}`;
                return <li key={item.id}>{target ? <Link to={target.to} params={target.params} className={className} onClick={() => { if (!item.is_read) markRead.mutate(item.id); setOpen(false); }}>{content}</Link> : <Button variant="ghost" className={`${className} h-auto whitespace-normal rounded-none`} onClick={() => markRead.mutate(item.id)}>{content}</Button>}</li>;
              })}
            </ul>
          ) : <div className="px-6 py-9 text-center"><Bell className="mx-auto size-6 text-mute" /><p className="mt-3 text-sm font-semibold">You're all caught up</p><p className="mt-1 text-xs text-mute">Your latest activity will appear here.</p></div>}
        </div>
        {markRead.isError || countError ? <p className="border-t border-line px-4 py-2 text-xs text-destructive" role="status">Couldn't update your alerts. Please try again.</p> : null}
        <div className="border-t border-line p-2"><Button asChild variant="ghost" className="h-9 w-full text-xs"><Link to="/activity" onClick={() => setOpen(false)}>View all activity</Link></Button></div>
      </PopoverContent>
    </Popover>
  );
}