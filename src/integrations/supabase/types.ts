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
      chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_summary_at: string | null
          model: string | null
          repo_selection_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_summary_at?: string | null
          model?: string | null
          repo_selection_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_summary_at?: string | null
          model?: string | null
          repo_selection_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_repo_selection_id_fkey"
            columns: ["repo_selection_id"]
            isOneToOne: false
            referencedRelation: "repo_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_jobs: {
        Row: {
          checkpoint: Json
          commit_sha: string | null
          continue_of: string | null
          created_at: string
          current_step: number
          diff: Json
          error: string | null
          finished_at: string | null
          hmac_secret: string | null
          id: string
          job_type: string
          logs: string | null
          model: string | null
          progress: Json
          progress_current: number | null
          progress_total: number | null
          prompt: string
          repo_selection_id: string
          status: string
          thread_id: string | null
          updated_at: string
          user_id: string
          workflow_run_id: string | null
          working_branch: string | null
        }
        Insert: {
          checkpoint?: Json
          commit_sha?: string | null
          continue_of?: string | null
          created_at?: string
          current_step?: number
          diff?: Json
          error?: string | null
          finished_at?: string | null
          hmac_secret?: string | null
          id?: string
          job_type?: string
          logs?: string | null
          model?: string | null
          progress?: Json
          progress_current?: number | null
          progress_total?: number | null
          prompt: string
          repo_selection_id: string
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id: string
          workflow_run_id?: string | null
          working_branch?: string | null
        }
        Update: {
          checkpoint?: Json
          commit_sha?: string | null
          continue_of?: string | null
          created_at?: string
          current_step?: number
          diff?: Json
          error?: string | null
          finished_at?: string | null
          hmac_secret?: string | null
          id?: string
          job_type?: string
          logs?: string | null
          model?: string | null
          progress?: Json
          progress_current?: number | null
          progress_total?: number | null
          prompt?: string
          repo_selection_id?: string
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id?: string
          workflow_run_id?: string | null
          working_branch?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coding_jobs_continue_of_fkey"
            columns: ["continue_of"]
            isOneToOne: false
            referencedRelation: "coding_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_jobs_repo_selection_id_fkey"
            columns: ["repo_selection_id"]
            isOneToOne: false
            referencedRelation: "repo_selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_jobs_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      github_connections: {
        Row: {
          access_token: string
          avatar_url: string | null
          created_at: string
          github_login: string
          github_user_id: number
          id: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          avatar_url?: string | null
          created_at?: string
          github_login: string
          github_user_id: number
          id?: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          avatar_url?: string | null
          created_at?: string
          github_login?: string
          github_user_id?: number
          id?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      openrouter_settings: {
        Row: {
          api_key: string
          embedding_model: string
          embedding_provider: string
          groq_api_key: string | null
          mistral_api_key: string | null
          model: string
          nvidia_api_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          embedding_model?: string
          embedding_provider?: string
          groq_api_key?: string | null
          mistral_api_key?: string | null
          model?: string
          nvidia_api_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          embedding_model?: string
          embedding_provider?: string
          groq_api_key?: string | null
          mistral_api_key?: string | null
          model?: string
          nvidia_api_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repo_file_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          repo_file_id: string
          repo_selection_id: string
          token_count: number | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          repo_file_id: string
          repo_selection_id: string
          token_count?: number | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          repo_file_id?: string
          repo_selection_id?: string
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_file_chunks_repo_file_id_fkey"
            columns: ["repo_file_id"]
            isOneToOne: false
            referencedRelation: "repo_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repo_file_chunks_repo_selection_id_fkey"
            columns: ["repo_selection_id"]
            isOneToOne: false
            referencedRelation: "repo_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      repo_files: {
        Row: {
          id: string
          language: string | null
          path: string
          repo_selection_id: string
          sha: string | null
          size: number | null
          summary: string | null
          symbol_outline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          language?: string | null
          path: string
          repo_selection_id: string
          sha?: string | null
          size?: number | null
          summary?: string | null
          symbol_outline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          language?: string | null
          path?: string
          repo_selection_id?: string
          sha?: string | null
          size?: number | null
          summary?: string | null
          symbol_outline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_files_repo_selection_id_fkey"
            columns: ["repo_selection_id"]
            isOneToOne: false
            referencedRelation: "repo_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      repo_selections: {
        Row: {
          created_at: string
          default_branch: string
          github_repo_id: number
          id: string
          indexed_at: string | null
          last_synced_at: string | null
          name: string
          owner: string
          user_id: string
          workflow_installed_at: string | null
          working_branch: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          github_repo_id: number
          id?: string
          indexed_at?: string | null
          last_synced_at?: string | null
          name: string
          owner: string
          user_id: string
          workflow_installed_at?: string | null
          working_branch?: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          github_repo_id?: number
          id?: string
          indexed_at?: string | null
          last_synced_at?: string | null
          name?: string
          owner?: string
          user_id?: string
          workflow_installed_at?: string | null
          working_branch?: string
        }
        Relationships: []
      }
      repo_symbols: {
        Row: {
          id: string
          kind: string | null
          line: number | null
          name: string
          repo_file_id: string
          repo_selection_id: string
          user_id: string
        }
        Insert: {
          id?: string
          kind?: string | null
          line?: number | null
          name: string
          repo_file_id: string
          repo_selection_id: string
          user_id: string
        }
        Update: {
          id?: string
          kind?: string | null
          line?: number | null
          name?: string
          repo_file_id?: string
          repo_selection_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_symbols_repo_file_id_fkey"
            columns: ["repo_file_id"]
            isOneToOne: false
            referencedRelation: "repo_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repo_symbols_repo_selection_id_fkey"
            columns: ["repo_selection_id"]
            isOneToOne: false
            referencedRelation: "repo_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_summaries: {
        Row: {
          covers_up_to: string
          created_at: string
          id: string
          summary: string
          thread_id: string
          user_id: string
        }
        Insert: {
          covers_up_to: string
          created_at?: string
          id?: string
          summary: string
          thread_id: string
          user_id: string
        }
        Update: {
          covers_up_to?: string
          created_at?: string
          id?: string
          summary?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_summaries_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      working_files: {
        Row: {
          content: string | null
          id: string
          original_content: string | null
          original_sha: string | null
          path: string
          repo_selection_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          id?: string
          original_content?: string | null
          original_sha?: string | null
          path: string
          repo_selection_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          id?: string
          original_content?: string | null
          original_sha?: string | null
          path?: string
          repo_selection_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_files_repo_selection_id_fkey"
            columns: ["repo_selection_id"]
            isOneToOne: false
            referencedRelation: "repo_selections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_repo_chunks: {
        Args: {
          p_match_count?: number
          p_query: string
          p_repo_selection_id: string
        }
        Returns: {
          chunk_id: string
          content: string
          path: string
          repo_file_id: string
          similarity: number
        }[]
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
