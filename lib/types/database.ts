export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      stations: {
        Row: {
          id: string
          name: string
          short_name: string
          frequency: string | null
          area: string
          stream_url: string | null
          playback_type: 'internal' | 'external'
          external_app_url: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          frequency?: string | null
          area: string
          stream_url?: string | null
          playback_type: 'internal' | 'external'
          external_app_url?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['stations']['Insert']>
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          station_id: string
          name: string
          description: string | null
          personality: string | null
          thumbnail_url: string | null
          podcast_feed_url: string | null
          message_url: string | null
          hashtag: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          station_id: string
          name: string
          description?: string | null
          personality?: string | null
          thumbnail_url?: string | null
          podcast_feed_url?: string | null
          message_url?: string | null
          hashtag?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['programs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'programs_station_id_fkey'
            columns: ['station_id']
            isOneToOne: false
            referencedRelation: 'stations'
            referencedColumns: ['id']
          }
        ]
      }
      schedules: {
        Row: {
          id: string
          program_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
          week_of_month: number | null
        }
        Insert: {
          id?: string
          program_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
          week_of_month?: number | null
        }
        Update: Partial<Database['public']['Tables']['schedules']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'schedules_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          area: string | null
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          area?: string | null
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>>
        Relationships: []
      }
      follows: {
        Row: {
          id: string
          user_id: string
          program_id: string
          notify_before: boolean
          notify_start: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          notify_before?: boolean
          notify_start?: boolean
          created_at?: string
        }
        Update: {
          notify_before?: boolean
          notify_start?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'follows_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follows_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          device_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          device_name?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// 便利型エイリアス
export type Station = Database['public']['Tables']['stations']['Row']
export type Program = Database['public']['Tables']['programs']['Row']
export type Schedule = Database['public']['Tables']['schedules']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']

// 関連データを含む拡張型
export type ProgramWithStation = Program & { station: Station }
export type ProgramWithSchedules = Program & { schedules: Schedule[] }
export type OnAirProgram = Program & {
  station: Station
  schedule: Schedule
}
