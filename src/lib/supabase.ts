import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types will be generated from Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet_address: string;
          display_name: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          display_name?: string | null;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          display_name?: string | null;
          role?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          blockchain_event_id: number;
          organizer_wallet: string;
          title: string;
          description: string;
          venue: string;
          start_at: string;
          end_at: string;
          image_url: string | null;
          metadata_uri: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blockchain_event_id: number;
          organizer_wallet: string;
          title: string;
          description: string;
          venue: string;
          start_at: string;
          end_at: string;
          image_url?: string | null;
          metadata_uri: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blockchain_event_id?: number;
          organizer_wallet?: string;
          title?: string;
          description?: string;
          venue?: string;
          start_at?: string;
          end_at?: string;
          image_url?: string | null;
          metadata_uri?: string;
          created_at?: string;
        };
      };
    };
  };
};
