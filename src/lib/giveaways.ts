import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const GIVEAWAY_CATEGORIES = [
  { slug: "phones_tech", name: "Phones & Technology" },
  { slug: "education", name: "Education" },
  { slug: "fashion", name: "Fashion" },
  { slug: "home", name: "Home" },
  { slug: "money", name: "Money" },
  { slug: "food", name: "Food" },
  { slug: "services", name: "Services" },
  { slug: "creative", name: "Creative" },
  { slug: "other", name: "Other" },
] as const;

export const GIVEAWAY_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  GIVEAWAY_CATEGORIES.map((c) => [c.slug, c.name]),
);

export type SelectionMode = "giver_selects" | "first_come" | "free_claim";

export const SELECTION_MODES: { value: SelectionMode; label: string; help: string; cta: string }[] = [
  { value: "giver_selects", label: "Giver Selects", help: "You read entries and choose the recipient.", cta: "Enter Giveaway" },
  { value: "first_come", label: "First Come", help: "The first eligible people to claim get it.", cta: "Claim Giveaway" },
  { value: "free_claim", label: "Free Claim", help: "An open item anyone can request.", cta: "Request This" },
];

export const MODE_LABEL: Record<string, string> = Object.fromEntries(SELECTION_MODES.map((m) => [m.value, m.label]));
export const MODE_CTA: Record<string, string> = Object.fromEntries(SELECTION_MODES.map((m) => [m.value, m.cta]));

export const GIVEAWAY_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "In review",
  active: "Open",
  closed: "Closed",
  recipient_selected: "Recipient chosen",
  fulfilled: "Giveaway Fulfilled",
  cancelled: "Cancelled",
};

export function giveawayQuery(id: string) {
  return queryOptions({
    queryKey: ["giveaway", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("giveaways").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function giveawayEntriesQuery(id: string) {
  return queryOptions({
    queryKey: ["giveaway", id, "entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaway_entries")
        .select("*")
        .eq("giveaway_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function giveawayRecipientsQuery(id: string) {
  return queryOptions({
    queryKey: ["giveaway", id, "recipients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaway_recipients")
        .select("*")
        .eq("giveaway_id", id)
        .neq("status", "cancelled");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function recipientMessagesQuery(recipientId: string) {
  return queryOptions({
    queryKey: ["giveaway-messages", recipientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaway_messages")
        .select("*")
        .eq("recipient_id", recipientId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15000,
  });
}

export function myGiveawaysQuery(userId: string) {
  return queryOptions({
    queryKey: ["my-giveaways", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaways")
        .select("*")
        .eq("giver_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function myWinsQuery(userId: string) {
  return queryOptions({
    queryKey: ["my-giveaway-wins", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giveaway_recipients")
        .select("id, status, giveaway_id, giveaways(id, title)")
        .eq("user_id", userId)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
