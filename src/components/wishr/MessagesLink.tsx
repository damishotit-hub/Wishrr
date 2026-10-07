import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { conversationsQuery } from "@/lib/messages";

export function MessagesLink() {
  const { user } = useAuth();
  const convos = useQuery({ ...conversationsQuery(user?.id ?? ""), enabled: !!user, refetchInterval: 30_000 });
  const unread = (convos.data ?? []).reduce((s, c) => s + Number(c.unread), 0);
  return (
    <Link to="/messages" aria-label={unread ? `Messages, ${unread} unread` : "Messages"} className="relative grid size-8 place-items-center rounded-lg text-mute hover:text-ink">
      <MessageCircle className="size-5" />
      {unread ? <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{unread > 9 ? "9+" : unread}</span> : null}
    </Link>
  );
}
