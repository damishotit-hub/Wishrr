import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notificationsQuery } from "@/lib/queries";

export function useNotifications(userId: string) {
  const client = useQueryClient();
  const feed = useQuery({ ...notificationsQuery(userId), enabled: !!userId, refetchInterval: 60_000 });
  const count = useQuery({
    queryKey: ["notifications", userId, "unread"],
    enabled: !!userId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`alerts-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => {
        void client.invalidateQueries({ queryKey: ["notifications", userId] });
        void client.invalidateQueries({ queryKey: ["conversations", userId] });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, client]);
  const markRead = useMutation({
    mutationFn: async (id?: string) => {
      if (!userId) throw new Error("Please sign in again.");
      let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
      if (id) query = query.eq("id", id);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
  return { feed, unread: count.data ?? 0, countError: count.isError, markRead };
}