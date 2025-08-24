export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string
          name: string
          description: string | null
          college: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          college: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          college?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      officials: {
        Row: {
          id: string
          clerk_id: string | null
          display_name: string
          email: string
          official_role: string
          role: string
          status: string
          created_at: string
          updated_at: string
          college: string
          invitation_sent_at: string | null
          invitation_accepted_at: string | null
        }
        Insert: {
          id?: string
          clerk_id?: string | null
          display_name: string
          email: string
          official_role: string
          role: string
          status?: string
          created_at?: string
          updated_at?: string
          college: string
          invitation_sent_at?: string | null
          invitation_accepted_at?: string | null
        }
        Update: {
          id?: string
          clerk_id?: string | null
          display_name?: string
          email?: string
          official_role?: string
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
          college?: string
          invitation_sent_at?: string | null
          invitation_accepted_at?: string | null
        }
        Relationships: []
      }
      mentors: {
        Row: {
          id: string
          clerk_id: string | null
          display_name: string
          email: string
          dept: string
          role: string
          college: string
          year: number | null
          status: string
          invitation_sent_at: string | null
          invitation_accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id?: string | null
          display_name: string
          email: string
          dept: string
          role: string
          college: string
          year?: number | null
          status?: string
          invitation_sent_at?: string | null
          invitation_accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string | null
          display_name?: string
          email?: string
          dept?: string
          role?: string
          college?: string
          year?: number | null
          status?: string
          invitation_sent_at?: string | null
          invitation_accepted_at?: string | null
          created_at?: string
          updated_at?: string
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