export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          address: string | null
          industry: string | null
          website: string | null
          logo_url: string | null
          google_place_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          address?: string | null
          industry?: string | null
          website?: string | null
          logo_url?: string | null
          google_place_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          address?: string | null
          industry?: string | null
          website?: string | null
          logo_url?: string | null
          google_place_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      review_platforms: {
        Row: {
          id: string
          name: string
          slug: string
          icon_url: string | null
          api_endpoint: string | null
          requires_auth: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon_url?: string | null
          api_endpoint?: string | null
          requires_auth?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon_url?: string | null
          api_endpoint?: string | null
          requires_auth?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      business_platforms: {
        Row: {
          id: string
          business_id: string
          platform_id: string
          platform_business_id: string | null
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          is_connected: boolean
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          platform_id: string
          platform_business_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          is_connected?: boolean
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          platform_id?: string
          platform_business_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          is_connected?: boolean
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          business_id: string
          platform_id: string
          platform_review_id: string
          reviewer_name: string | null
          reviewer_avatar_url: string | null
          rating: number
          review_text: string | null
          review_url: string | null
          reviewed_at: string
          sentiment: 'positive' | 'neutral' | 'negative' | null
          sentiment_score: number | null
          keywords: string[] | null
          categories: string[] | null
          language: string | null
          is_spam: boolean
          has_response: boolean
          response_text: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          platform_id: string
          platform_review_id: string
          reviewer_name?: string | null
          reviewer_avatar_url?: string | null
          rating: number
          review_text?: string | null
          review_url?: string | null
          reviewed_at: string
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          sentiment_score?: number | null
          keywords?: string[] | null
          categories?: string[] | null
          language?: string | null
          is_spam?: boolean
          has_response?: boolean
          response_text?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          platform_id?: string
          platform_review_id?: string
          reviewer_name?: string | null
          reviewer_avatar_url?: string | null
          rating?: number
          review_text?: string | null
          review_url?: string | null
          reviewed_at?: string
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          sentiment_score?: number | null
          keywords?: string[] | null
          categories?: string[] | null
          language?: string | null
          is_spam?: boolean
          has_response?: boolean
          response_text?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_responses: {
        Row: {
          id: string
          review_id: string
          response_text: string
          tone: 'professional' | 'friendly' | 'apologetic' | 'enthusiastic' | null
          is_used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          response_text: string
          tone?: 'professional' | 'friendly' | 'apologetic' | 'enthusiastic' | null
          is_used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          response_text?: string
          tone?: 'professional' | 'friendly' | 'apologetic' | 'enthusiastic' | null
          is_used?: boolean
          created_at?: string
        }
      }
      analytics_snapshots: {
        Row: {
          id: string
          business_id: string
          snapshot_date: string
          total_reviews: number
          average_rating: number | null
          positive_reviews: number
          neutral_reviews: number
          negative_reviews: number
          response_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          snapshot_date: string
          total_reviews?: number
          average_rating?: number | null
          positive_reviews?: number
          neutral_reviews?: number
          negative_reviews?: number
          response_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          snapshot_date?: string
          total_reviews?: number
          average_rating?: number | null
          positive_reviews?: number
          neutral_reviews?: number
          negative_reviews?: number
          response_rate?: number | null
          created_at?: string
        }
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
  }
}
