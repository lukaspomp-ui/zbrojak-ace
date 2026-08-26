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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      apps: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string
        }
        Insert: {
          created_at?: string
          id: string
          logo_url?: string | null
          name: string
          primary_color?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          app_id: string
          created_at: string
          description: string
          file_url: string
          id: string
          sort_order: number
          subject_key: string | null
          title: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          description?: string
          file_url: string
          id?: string
          sort_order?: number
          subject_key?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          description?: string
          file_url?: string
          id?: string
          sort_order?: number
          subject_key?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary: {
        Row: {
          app_id: string
          created_at: string
          definition: string
          id: string
          sort_order: number
          term: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          definition?: string
          id?: string
          sort_order?: number
          term: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          definition?: string
          id?: string
          sort_order?: number
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          app_id: string
          content: string
          created_at: string
          id: string
          sort_order: number
          subject_key: string | null
          title: string
          updated_at: string
        }
        Insert: {
          app_id: string
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          subject_key?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          subject_key?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          exam_attempts_used: number
          id: string
          is_premium: boolean
        }
        Insert: {
          created_at?: string
          exam_attempts_used?: number
          id: string
          is_premium?: boolean
        }
        Update: {
          created_at?: string
          exam_attempts_used?: number
          id?: string
          is_premium?: boolean
        }
        Relationships: []
      }
      question_reports: {
        Row: {
          created_at: string
          id: string
          message: string
          question_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          question_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          question_id?: number
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          app_id: string
          content: string
          created_at: string
          id: string
          sort_order: number
          subject_key: string | null
          updated_at: string
        }
        Insert: {
          app_id: string
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          subject_key?: string | null
          updated_at?: string
        }
        Update: {
          app_id?: string
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          subject_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          correct_streak: number
          id: string
          last_answered_at: string
          mastered: boolean
          question_id: number
          times_wrong: number
          user_id: string
        }
        Insert: {
          correct_streak?: number
          id?: string
          last_answered_at?: string
          mastered?: boolean
          question_id: number
          times_wrong?: number
          user_id: string
        }
        Update: {
          correct_streak?: number
          id?: string
          last_answered_at?: string
          mastered?: boolean
          question_id?: number
          times_wrong?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
