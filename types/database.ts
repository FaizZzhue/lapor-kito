export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'petugas'

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'verifying'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'duplicate'

export type ReportPriority = 'low' | 'medium' | 'high' | 'critical'

export type ResponseType = 'official' | 'update' | 'clarification'

export interface Database {
  public: {
    Tables: {
      internal_users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: UserRole
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: UserRole
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          id: string
          code: string
          name: string
          short_name: string | null
          category: string | null
          address: string | null
          email: string | null
          phone: string | null
          mandate: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          short_name?: string | null
          category?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          mandate?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          short_name?: string | null
          category?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          mandate?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      institution_units: {
        Row: {
          id: string
          institution_id: string
          code: string
          name: string
          work_area: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          code: string
          name: string
          work_area?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          code?: string
          name?: string
          work_area?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_units_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          }
        ]
      }
      reporters: {
        Row: {
          id: string
          phone: string | null
          email: string | null
          full_name: string | null
          verification_count: number
          last_reported_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone?: string | null
          email?: string | null
          full_name?: string | null
          verification_count?: number
          last_reported_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          email?: string | null
          full_name?: string | null
          verification_count?: number
          last_reported_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          slug: string
          name_id: string
          name_en: string | null
          description: string | null
          icon: string | null
          is_active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name_id: string
          name_en?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name_id?: string
          name_en?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      kecamatan: {
        Row: {
          id: string
          code: string
          name: string
          postal_codes: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          postal_codes?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          postal_codes?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      kelurahan: {
        Row: {
          id: string
          kecamatan_id: string
          code: string
          name: string
          postal_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          kecamatan_id: string
          code: string
          name: string
          postal_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          kecamatan_id?: string
          code?: string
          name?: string
          postal_code?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          tracking_code: string
          reporter_id: string | null
          category_id: string | null
          kelurahan_id: string | null
          title: string
          description: string
          address_detail: string
          latitude: number | null
          longitude: number | null
          status: ReportStatus
          priority: ReportPriority
          ai_confidence: number | null
          ai_summary: string | null
          authority_target: string | null
          duplicate_of_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tracking_code: string
          reporter_id?: string | null
          category_id?: string | null
          kelurahan_id?: string | null
          title: string
          description: string
          address_detail: string
          latitude?: number | null
          longitude?: number | null
          status?: ReportStatus
          priority?: ReportPriority
          ai_confidence?: number | null
          ai_summary?: string | null
          authority_target?: string | null
          duplicate_of_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tracking_code?: string
          reporter_id?: string | null
          category_id?: string | null
          kelurahan_id?: string | null
          title?: string
          description?: string
          address_detail?: string
          latitude?: number | null
          longitude?: number | null
          status?: ReportStatus
          priority?: ReportPriority
          ai_confidence?: number | null
          ai_summary?: string | null
          authority_target?: string | null
          duplicate_of_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_evidence: {
        Row: {
          id: string
          report_id: string
          file_url: string
          file_type: string
          file_size: number
          storage_path: string
          caption: string | null
          ai_is_valid: boolean | null
          ai_analysis: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          file_url: string
          file_type: string
          file_size: number
          storage_path: string
          caption?: string | null
          ai_is_valid?: boolean | null
          ai_analysis?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          file_url?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          caption?: string | null
          ai_is_valid?: boolean | null
          ai_analysis?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      report_timeline: {
        Row: {
          id: string
          report_id: string
          actor_id: string | null
          actor_role: string
          action: string
          notes: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          actor_id?: string | null
          actor_role?: string
          action: string
          notes?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          actor_id?: string | null
          actor_role?: string
          action?: string
          notes?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      report_responses: {
        Row: {
          id: string
          report_id: string
          responder_id: string | null
          response_type: ResponseType
          message: string
          attachments: Json | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          responder_id?: string | null
          response_type?: ResponseType
          message: string
          attachments?: Json | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          responder_id?: string | null
          response_type?: ResponseType
          message?: string
          attachments?: Json | null
          is_public?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ai_triage_logs: {
        Row: {
          id: string
          report_id: string | null
          prompt_version: string
          model: string
          raw_request: Json
          raw_response: Json
          tokens_used: number | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id?: string | null
          prompt_version: string
          model: string
          raw_request: Json
          raw_response: Json
          tokens_used?: number | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string | null
          prompt_version?: string
          model?: string
          raw_request?: Json
          raw_response?: Json
          tokens_used?: number | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_tracking_code: {
        Args: Record<string, never>
        Returns: string
      }
      get_public_report_by_tracking_code: {
        Args: {
          target_tracking_code: string
        }
        Returns: {
          id: string
          tracking_code: string
          category_id: string | null
          kelurahan_id: string | null
          title: string
          description: string
          address_detail: string
          latitude: number | null
          longitude: number | null
          status: ReportStatus
          priority: ReportPriority
          authority_target: string | null
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      report_status: ReportStatus
      report_priority: ReportPriority
      response_type: ResponseType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type InstitutionRow = Database['public']['Tables']['institutions']['Row']
export type InstitutionInsert = Database['public']['Tables']['institutions']['Insert']
export type InstitutionUpdate = Database['public']['Tables']['institutions']['Update']

export type InstitutionUnitRow = Database['public']['Tables']['institution_units']['Row']
export type InstitutionUnitInsert = Database['public']['Tables']['institution_units']['Insert']
export type InstitutionUnitUpdate = Database['public']['Tables']['institution_units']['Update']

export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type InternalUserRow = Database['public']['Tables']['internal_users']['Row']
export type InternalUserInsert = Database['public']['Tables']['internal_users']['Insert']
export type InternalUserUpdate = Database['public']['Tables']['internal_users']['Update']



