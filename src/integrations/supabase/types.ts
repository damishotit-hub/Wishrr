export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          giveaway_id: string | null
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_type: string
          wish_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          giveaway_id?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_type: string
          wish_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          giveaway_id?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_type?: string
          wish_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          contributor_display_name: string | null
          contributor_id: string | null
          created_at: string
          id: string
          is_anonymous: boolean
          message: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          transaction_reference: string | null
          wish_id: string
        }
        Insert: {
          amount: number
          contributor_display_name?: string | null
          contributor_id?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          message?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          wish_id: string
        }
        Update: {
          amount?: number
          contributor_display_name?: string | null
          contributor_id?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          message?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_entries: {
        Row: {
          created_at: string
          entrant_display_name: string
          giveaway_id: string
          id: string
          message: string | null
          status: Database["public"]["Enums"]["giveaway_entry_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entrant_display_name?: string
          giveaway_id: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["giveaway_entry_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          entrant_display_name?: string
          giveaway_id?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["giveaway_entry_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "giveaway_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_recipients: {
        Row: {
          created_at: string
          giveaway_id: string
          id: string
          status: Database["public"]["Enums"]["giveaway_recipient_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          giveaway_id: string
          id?: string
          status?: Database["public"]["Enums"]["giveaway_recipient_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          giveaway_id?: string
          id?: string
          status?: Database["public"]["Enums"]["giveaway_recipient_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_recipients_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          category: string
          created_at: string
          deadline: string | null
          description: string
          eligibility: string | null
          entry_count: number
          extra_images: string[]
          giveaway_type: Database["public"]["Enums"]["giveaway_type"]
          giver_display_name: string
          giver_id: string | null
          id: string
          image_caption: string | null
          image_url: string | null
          location: string | null
          recipient_count: number
          selection_mode: string
          status: Database["public"]["Enums"]["giveaway_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          deadline?: string | null
          description: string
          eligibility?: string | null
          entry_count?: number
          extra_images?: string[]
          giveaway_type?: Database["public"]["Enums"]["giveaway_type"]
          giver_display_name?: string
          giver_id?: string | null
          id?: string
          image_caption?: string | null
          image_url?: string | null
          location?: string | null
          recipient_count?: number
          selection_mode?: string
          status?: Database["public"]["Enums"]["giveaway_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          deadline?: string | null
          description?: string
          eligibility?: string | null
          entry_count?: number
          extra_images?: string[]
          giveaway_type?: Database["public"]["Enums"]["giveaway_type"]
          giver_display_name?: string
          giver_id?: string | null
          id?: string
          image_caption?: string | null
          image_url?: string | null
          location?: string | null
          recipient_count?: number
          selection_mode?: string
          status?: Database["public"]["Enums"]["giveaway_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          intent: string | null
          is_verified: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          intent?: string | null
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          intent?: string | null
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          wish_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          wish_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wish_appreciations: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          wish_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          wish_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_appreciations_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: true
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_bank_details: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          owner_id: string
          updated_at: string
          wish_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          owner_id: string
          updated_at?: string
          wish_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          owner_id?: string
          updated_at?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_bank_details_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: true
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_categories: {
        Row: {
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      wish_offer_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          offer_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          offer_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          offer_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_offer_messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "wish_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_offers: {
        Row: {
          created_at: string
          description: string
          giver_display_name: string
          giver_id: string
          id: string
          status: string
          wish_id: string
        }
        Insert: {
          created_at?: string
          description: string
          giver_display_name?: string
          giver_id: string
          id?: string
          status?: string
          wish_id: string
        }
        Update: {
          created_at?: string
          description?: string
          giver_display_name?: string
          giver_id?: string
          id?: string
          status?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_offers_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_updates: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          wish_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          wish_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_updates_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wishes: {
        Row: {
          amount_raised: number
          category: string
          created_at: string
          creator_display_name: string
          deadline: string | null
          description: string
          goal_amount: number
          id: string
          image_caption: string | null
          image_url: string | null
          is_anonymous: boolean
          status: Database["public"]["Enums"]["wish_status"]
          summary: string | null
          title: string
          updated_at: string
          user_id: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          amount_raised?: number
          category: string
          created_at?: string
          creator_display_name?: string
          deadline?: string | null
          description: string
          goal_amount: number
          id?: string
          image_caption?: string | null
          image_url?: string | null
          is_anonymous?: boolean
          status?: Database["public"]["Enums"]["wish_status"]
          summary?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          amount_raised?: number
          category?: string
          created_at?: string
          creator_display_name?: string
          deadline?: string | null
          description?: string
          goal_amount?: number
          id?: string
          image_caption?: string | null
          image_url?: string | null
          is_anonymous?: boolean
          status?: Database["public"]["Enums"]["wish_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "wishes_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "wish_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_recent_users: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      confirm_wish_transfer: {
        Args: { _contribution_id: string }
        Returns: boolean
      }
      get_wish_bank_details: {
        Args: { _wish_id: string }
        Returns: {
          account_name: string
          account_number: string
          bank_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_giveaway_party: {
        Args: { _recipient_id: string; _uid: string }
        Returns: boolean
      }
      is_offer_party: {
        Args: { _offer_id: string; _uid: string }
        Returns: boolean
      }
      is_wish_owner: {
        Args: { _uid: string; _wish_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      giveaway_entry_status:
        | "pending"
        | "shortlisted"
        | "selected"
        | "declined"
        | "withdrawn"
      giveaway_recipient_status:
        | "selected"
        | "confirmed"
        | "delivered"
        | "cancelled"
      giveaway_status:
        | "draft"
        | "pending_review"
        | "active"
        | "closed"
        | "recipient_selected"
        | "fulfilled"
        | "cancelled"
      giveaway_type: "item" | "service" | "space" | "skill" | "other"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      report_reason:
        | "fraud"
        | "misleading"
        | "offensive"
        | "duplicate"
        | "other"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
      wish_status:
        | "draft"
        | "pending_verification"
        | "active"
        | "partially_funded"
        | "fulfilled"
        | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      giveaway_entry_status: [
        "pending",
        "shortlisted",
        "selected",
        "declined",
        "withdrawn",
      ],
      giveaway_recipient_status: [
        "selected",
        "confirmed",
        "delivered",
        "cancelled",
      ],
      giveaway_status: [
        "draft",
        "pending_review",
        "active",
        "closed",
        "recipient_selected",
        "fulfilled",
        "cancelled",
      ],
      giveaway_type: ["item", "service", "space", "skill", "other"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      report_reason: ["fraud", "misleading", "offensive", "duplicate", "other"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
      wish_status: [
        "draft",
        "pending_verification",
        "active",
        "partially_funded",
        "fulfilled",
        "closed",
      ],
    },
  },
} as const
