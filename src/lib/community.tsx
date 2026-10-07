import { useEffect, useState } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const memberCountQuery = queryOptions({
  queryKey: ["community", "member-count"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("get_member_count");
    if (error) throw error;
    return Number(data ?? 0);
  },
  staleTime: 60_000,
});

// One shared presence channel per browser tab; every visitor (signed in or not) is counted once.
let channel: ReturnType<typeof supabase.channel> | null = null;
let online = 0;
const listeners = new Set<(n: number) => void>();

function ensureChannel() {
  if (channel || typeof window === "undefined") return;
  const key = crypto.randomUUID();
  channel = supabase.channel("wishr-online", { config: { presence: { key } } });
  channel
    .on("presence", { event: "sync" }, () => {
      online = Object.keys(channel?.presenceState() ?? {}).length;
      listeners.forEach((fn) => fn(online));
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void channel?.track({ at: Date.now() });
    });
}

export function useOnlineCount() {
  const [count, setCount] = useState(online);
  useEffect(() => {
    ensureChannel();
    listeners.add(setCount);
    setCount(online);
    return () => { listeners.delete(setCount); };
  }, []);
  return count;
}

export function CommunityPulse({ size = "sm" }: { size?: "sm" | "lg" }) {
  const members = useQuery(memberCountQuery);
  const onlineNow = Math.max(useOnlineCount(), 1);
  const big = size === "lg";
  return (
    <div className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-ink ${big ? "text-sm" : "text-xs"}`} aria-live="polite">
      <span className="inline-flex items-center gap-1.5"><Users className={big ? "size-4" : "size-3.5"} />{members.data != null ? members.data.toLocaleString() : "..."} members</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex size-2.5 rounded-full bg-success" /></span>
        {onlineNow.toLocaleString()} online now
      </span>
    </div>
  );
}
