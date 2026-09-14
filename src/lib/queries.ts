import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Wish = Database["public"]["Tables"]["wishes"]["Row"];
export type Contribution = Database["public"]["Tables"]["contributions"]["Row"];
export type WishUpdate = Database["public"]["Tables"]["wish_updates"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type WishStatus = Database["public"]["Enums"]["wish_status"];
export type Giveaway = Database["public"]["Tables"]["giveaways"]["Row"];

export type GiveawayFilters = {
  search?: string;
  category?: string;
  limit?: number;
};

export function publicGiveawaysQuery(filters: GiveawayFilters = {}) {
  return queryOptions({
    queryKey: ["giveaways", "public", filters],
    queryFn: async () => {
      let query = supabase
        .from("giveaways")
        .select("*")
        .in("status", ["active", "closed", "recipient_selected", "fulfilled"]);

      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 60);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ExploreFilters = {
  search?: string;
  category?: string;
  sort?: "recent" | "almost" | "supported";
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("wish_categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data;
  },
  staleTime: 1000 * 60 * 30,
});

export function publicWishesQuery(filters: ExploreFilters = {}) {
  return queryOptions({
    queryKey: ["wishes", "public", filters],
    queryFn: async () => {
      let query = supabase
        .from("wishes")
        .select("*")
        .in("status", ["active", "partially_funded", "fulfilled"]);

      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${term},summary.ilike.${term},description.ilike.${term}`);
      }

      const { data, error } = await query.limit(60);
      if (error) throw error;

      const rows = data ?? [];
      const sorted = [...rows];
      if (filters.sort === "almost") {
        sorted.sort(
          (a, b) =>
            Number(b.amount_raised) / Number(b.goal_amount) -
            Number(a.amount_raised) / Number(a.goal_amount),
        );
      } else if (filters.sort === "supported") {
        sorted.sort((a, b) => Number(b.amount_raised) - Number(a.amount_raised));
      } else {
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
      return sorted;
    },
  });
}

export function wishQuery(id: string) {
  return queryOptions({
    queryKey: ["wish", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("wishes").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function wishContributionsQuery(id: string) {
  return queryOptions({
    queryKey: ["wish", id, "contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("id, amount, is_anonymous, contributor_display_name, message, created_at")
        .eq("wish_id", id)
        .eq("payment_status", "succeeded")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function wishUpdatesQuery(id: string) {
  return queryOptions({
    queryKey: ["wish", id, "updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wish_updates")
        .select("*")
        .eq("wish_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function myWishesQuery(userId: string) {
  return queryOptions({
    queryKey: ["my-wishes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function myContributionsQuery(userId: string) {
  return queryOptions({
    queryKey: ["my-contributions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*, wishes(id, title, goal_amount, amount_raised)")
        .eq("contributor_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function profileQuery(userId: string) {
  return queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function myRolesQuery(userId: string) {
  return queryOptions({
    queryKey: ["roles", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((row) => row.role);
    },
  });
}

export function notificationsQuery(userId: string) {
  return queryOptions({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
