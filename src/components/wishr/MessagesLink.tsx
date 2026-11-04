import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { conversationsQuery } from "@/lib/messages";
import { Button } from "@/components/ui/button";

export function MessagesLink({ variant = "header" }: { variant?: "header" | "dock" }) {
  const { user } = useAuth();
  const active = useRouterState({ select: (state) => state.location.pathname.startsWith("/messages") });
  const convos = useQuery({ ...conversationsQuery(user?.id ?? ""), enabled: !!user, refetchInterval: 30_000 });
  const unread = (convos.data ?? []).reduce((s, c) => s + Number(c.unread), 0);
  return (
    <Button asChild variant={variant === "dock" ? "ghost" : "default"} className={variant === "dock" ? "dock-item h-auto min-w-0 flex-col gap-1 rounded-full px-0 py-2 hover:bg-transparent" : "relative h-9 shrink-0 gap-2 rounded-lg px-2.5 text-xs sm:px-3"}>
      <Link to="/messages" aria-label={unread ? `Messages, ${unread} unread` : "Messages"} aria-current={active ? "page" : undefined}>
        <span className={variant === "dock" ? "dock-icon relative" : "relative"}>
          <MessageCircle aria-hidden="true" className="!size-5" strokeWidth={active ? 2.4 : 1.8} />
          {unread && variant === "dock" ? <span className="absolute -right-0.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span> : null}
        </span>
        <span className={variant === "dock" ? "text-[9px] font-semibold leading-3" : "hidden font-semibold sm:inline"}>Messages</span>
        {unread && variant === "header" ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary-foreground px-1 text-[10px] font-bold text-primary">{unread > 9 ? "9+" : unread}</span> : null}
      </Link>
    </Button>
  );
}
