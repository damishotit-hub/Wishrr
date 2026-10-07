import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function conversationsQuery(userId: string) {
  return queryOptions({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_conversations");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function threadQuery(conversationId: string) {
  return queryOptions({
    queryKey: ["dm", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("id, sender_id, body, created_at, read_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function startConversation(otherId: string) {
  const { data, error } = await supabase.rpc("start_conversation", { _other: otherId });
  if (error) throw error;
  return data as string;
}
