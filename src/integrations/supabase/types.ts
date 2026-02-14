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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      click_logs: {
        Row: {
          clicked_at: string
          id: string
          ip_address: string | null
          referer: string | null
          short_link_id: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referer?: string | null
          short_link_id: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          referer?: string | null
          short_link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "click_logs_short_link_id_fkey"
            columns: ["short_link_id"]
            isOneToOne: false
            referencedRelation: "short_links"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_config: {
        Row: {
          api_key: string
          api_url: string
          created_at: string
          id: string
          is_active: boolean | null
          last_test_at: string | null
          last_test_status: string | null
          session_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          session_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_status?: string | null
          session_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          ai_message: string | null
          created_at: string
          id: string
          original_price: number | null
          product_image_url: string | null
          product_name: string
          product_url: string | null
          promo_price: number | null
          raw_scrape_id: string | null
          sent_at: string | null
          short_link_code: string | null
          status: string
          system_prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_message?: string | null
          created_at?: string
          id?: string
          original_price?: number | null
          product_image_url?: string | null
          product_name: string
          product_url?: string | null
          promo_price?: number | null
          raw_scrape_id?: string | null
          sent_at?: string | null
          short_link_code?: string | null
          status?: string
          system_prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_message?: string | null
          created_at?: string
          id?: string
          original_price?: number | null
          product_image_url?: string | null
          product_name?: string
          product_url?: string | null
          promo_price?: number | null
          raw_scrape_id?: string | null
          sent_at?: string | null
          short_link_code?: string | null
          status?: string
          system_prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      raw_scrapes: {
        Row: {
          created_at: string
          discount_percentage: string | null
          id: number
          image_url: string | null
          installments: string | null
          metadata: Json | null
          old_price: number | null
          original_url: string | null
          price: number | null
          price_type: string | null
          product_title: string | null
          rating: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: string | null
          id?: never
          image_url?: string | null
          installments?: string | null
          metadata?: Json | null
          old_price?: number | null
          original_url?: string | null
          price?: number | null
          price_type?: string | null
          product_title?: string | null
          rating?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: string | null
          id?: never
          image_url?: string | null
          installments?: string | null
          metadata?: Json | null
          old_price?: number | null
          original_url?: string | null
          price?: number | null
          price_type?: string | null
          product_title?: string | null
          rating?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      scraper_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          scrape_interval_minutes: number
          status: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          scrape_interval_minutes?: number
          status?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          scrape_interval_minutes?: number
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          affiliate_tags: Json | null
          created_at: string
          default_system_prompt: string | null
          gemini_api_key: string | null
          id: string
          updated_at: string
          user_id: string
          whatsapp_groups: Json | null
        }
        Insert: {
          affiliate_tags?: Json | null
          created_at?: string
          default_system_prompt?: string | null
          gemini_api_key?: string | null
          id?: string
          updated_at?: string
          user_id: string
          whatsapp_groups?: Json | null
        }
        Update: {
          affiliate_tags?: Json | null
          created_at?: string
          default_system_prompt?: string | null
          gemini_api_key?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          whatsapp_groups?: Json | null
        }
        Relationships: []
      }
      short_links: {
        Row: {
          click_count: number
          created_at: string
          id: string
          is_active: boolean
          last_clicked_at: string | null
          original_url: string
          product_title: string | null
          promotion_id: string | null
          short_code: string
          source: string | null
          user_id: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_clicked_at?: string | null
          original_url: string
          product_title?: string | null
          promotion_id?: string | null
          short_code: string
          source?: string | null
          user_id: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_clicked_at?: string | null
          original_url?: string
          product_title?: string | null
          promotion_id?: string | null
          short_code?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_links_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          created_at: string
          group_description: string | null
          group_id: string
          group_name: string
          id: string
          is_active: boolean | null
          last_message_at: string | null
          messages_sent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_description?: string | null
          group_id: string
          group_name: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages_sent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_description?: string | null
          group_id?: string
          group_name?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          messages_sent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages_log: {
        Row: {
          api_response: Json | null
          created_at: string
          error_message: string | null
          group_id: string | null
          id: string
          message_text: string
          promotion_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          api_response?: Json | null
          created_at?: string
          error_message?: string | null
          group_id?: string | null
          id?: string
          message_text: string
          promotion_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          api_response?: Json | null
          created_at?: string
          error_message?: string | null
          group_id?: string | null
          id?: string
          message_text?: string
          promotion_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_log_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_log_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_raw_scrapes_detailed: {
        Row: {
          created_at: string | null
          current_price: number | null
          discount_category: string | null
          discount_percentage: string | null
          has_discount: boolean | null
          id: number | null
          image_url: string | null
          installments: string | null
          metadata: Json | null
          old_price: number | null
          original_url: string | null
          price_type: string | null
          product_title: string | null
          rating: string | null
          savings_amount: number | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_price?: number | null
          discount_category?: never
          discount_percentage?: string | null
          has_discount?: never
          id?: number | null
          image_url?: string | null
          installments?: string | null
          metadata?: Json | null
          old_price?: number | null
          original_url?: string | null
          price_type?: string | null
          product_title?: string | null
          rating?: string | null
          savings_amount?: never
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_price?: number | null
          discount_category?: never
          discount_percentage?: string | null
          has_discount?: never
          id?: number | null
          image_url?: string | null
          installments?: string | null
          metadata?: Json | null
          old_price?: number | null
          original_url?: string | null
          price_type?: string | null
          product_title?: string | null
          rating?: string | null
          savings_amount?: never
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_group_messages: {
        Args: { group_id_param: string }
        Returns: undefined
      }
      owns_short_link: { Args: { link_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
