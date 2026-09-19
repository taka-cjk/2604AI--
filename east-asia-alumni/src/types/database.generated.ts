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
      articles: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          banner_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          banner_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          banner_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_coauthors: {
        Row: {
          article_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          article_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          article_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_coauthors_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_coauthors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          event_id: string | null
          id: string
          post_id: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          event_id?: string | null
          id?: string
          post_id?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cohosts: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cohosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cohosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          max_participants: number | null
          organizer_id: string
          price_other: string | null
          price_students: string | null
          registration_link: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          location?: string | null
          max_participants?: number | null
          organizer_id: string
          price_other?: string | null
          price_students?: string | null
          registration_link?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          organizer_id?: string
          price_other?: string | null
          price_students?: string | null
          registration_link?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          id: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_affiliations: {
        Row: {
          affiliation_name: string | null
          affiliation_type: string
          created_at: string
          id: string
          position: number
          profile_id: string
        }
        Insert: {
          affiliation_name?: string | null
          affiliation_type: string
          created_at?: string
          id?: string
          position?: number
          profile_id: string
        }
        Update: {
          affiliation_name?: string | null
          affiliation_type?: string
          created_at?: string
          id?: string
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_affiliations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_group: string | null
          area: string[] | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_location: string | null
          full_name: string
          home_country: string | null
          id: string
          onboarding_completed_at: string | null
          onboarding_current_step: number
          privacy_policy_accepted_at: string | null
          privacy_policy_version: string | null
          sns_links: Record<string, string> | null
          tags: string[] | null
          updated_at: string
          username: string
          show_on_map: boolean | null
          wants: string[] | null
          work_location: string | null
        }
        Insert: {
          age_group?: string | null
          area?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_location?: string | null
          full_name: string
          home_country?: string | null
          id: string
          onboarding_completed_at?: string | null
          onboarding_current_step?: number
          privacy_policy_accepted_at?: string | null
          privacy_policy_version?: string | null
          show_on_map?: boolean | null
          sns_links?: Record<string, string> | null
          tags?: string[] | null
          updated_at?: string
          username: string
          wants?: string[] | null
          work_location?: string | null
        }
        Update: {
          age_group?: string | null
          area?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_location?: string | null
          full_name?: string
          home_country?: string | null
          id?: string
          onboarding_completed_at?: string | null
          onboarding_current_step?: number
          privacy_policy_accepted_at?: string | null
          privacy_policy_version?: string | null
          show_on_map?: boolean | null
          sns_links?: Record<string, string> | null
          tags?: string[] | null
          updated_at?: string
          username?: string
          wants?: string[] | null
          work_location?: string | null
        }
        Relationships: []
      }
      study_abroad_histories: {
        Row: {
          country: string
          created_at: string
          end_date: string | null
          id: string
          profile_id: string
          program: string | null
          start_date: string | null
          university_name: string
        }
        Insert: {
          country: string
          created_at?: string
          end_date?: string | null
          id?: string
          profile_id: string
          program?: string | null
          start_date?: string | null
          university_name: string
        }
        Update: {
          country?: string
          created_at?: string
          end_date?: string | null
          id?: string
          profile_id?: string
          program?: string | null
          start_date?: string | null
          university_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_abroad_histories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_histories: {
        Row: {
          company_name: string
          company_name_local: string | null
          created_at: string
          end_date: string | null
          id: string
          location: string | null
          profile_id: string
          role: string | null
          start_date: string | null
        }
        Insert: {
          company_name: string
          company_name_local?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          profile_id: string
          role?: string | null
          start_date?: string | null
        }
        Update: {
          company_name?: string
          company_name_local?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          profile_id?: string
          role?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_histories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      replace_my_onboarding_affiliations: {
        Args: { p_affiliations: Json }
        Returns: undefined
      }
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
