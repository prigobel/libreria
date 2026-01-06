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
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          subtitle: string | null
          authors: string[] | null
          isbn_10: string | null
          isbn_13: string | null
          publisher: string | null
          published_date: string | null
          page_count: number | null
          language: string | null
          description: string | null
          categories: string[] | null
          cover_url: string | null
          spine_image_url: string | null
          google_books_id: string | null
          open_library_id: string | null
          read_status: 'to_read' | 'reading' | 'read'
          rating: number | null
          personal_notes: string | null
          acquisition_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          subtitle?: string | null
          authors?: string[] | null
          isbn_10?: string | null
          isbn_13?: string | null
          publisher?: string | null
          published_date?: string | null
          page_count?: number | null
          language?: string | null
          description?: string | null
          categories?: string[] | null
          cover_url?: string | null
          spine_image_url?: string | null
          google_books_id?: string | null
          open_library_id?: string | null
          read_status?: 'to_read' | 'reading' | 'read'
          rating?: number | null
          personal_notes?: string | null
          acquisition_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          subtitle?: string | null
          authors?: string[] | null
          isbn_10?: string | null
          isbn_13?: string | null
          publisher?: string | null
          published_date?: string | null
          page_count?: number | null
          language?: string | null
          description?: string | null
          categories?: string[] | null
          cover_url?: string | null
          spine_image_url?: string | null
          google_books_id?: string | null
          open_library_id?: string | null
          read_status?: 'to_read' | 'reading' | 'read'
          rating?: number | null
          personal_notes?: string | null
          acquisition_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
