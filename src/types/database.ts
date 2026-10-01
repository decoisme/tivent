/**
 * Database types matching Supabase schema
 * These types represent the cached/indexed data
 * ALWAYS verify critical data against blockchain
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet_address: string;
          display_name: string | null;
          role: 'BUYER' | 'ORGANIZER' | 'GATE_OFFICER' | 'ADMIN';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          display_name?: string | null;
          role: 'BUYER' | 'ORGANIZER' | 'GATE_OFFICER' | 'ADMIN';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          display_name?: string | null;
          role?: 'BUYER' | 'ORGANIZER' | 'GATE_OFFICER' | 'ADMIN';
          created_at?: string;
          updated_at?: string;
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
          ticket_price: string; // BigInt as string
          max_tickets: number;
          tickets_sold: number;
          max_tickets_per_wallet: number;
          resale_price_cap: number;
          resale_deadline: string;
          primary_sale_active: boolean;
          resale_active: boolean;
          cancelled: boolean;
          created_at: string;
          updated_at: string;
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
          ticket_price: string;
          max_tickets: number;
          tickets_sold?: number;
          max_tickets_per_wallet: number;
          resale_price_cap: number;
          resale_deadline: string;
          primary_sale_active?: boolean;
          resale_active?: boolean;
          cancelled?: boolean;
          created_at?: string;
          updated_at?: string;
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
          ticket_price?: string;
          max_tickets?: number;
          tickets_sold?: number;
          max_tickets_per_wallet?: number;
          resale_price_cap?: number;
          resale_deadline?: string;
          primary_sale_active?: boolean;
          resale_active?: boolean;
          cancelled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_metadata: {
        Row: {
          id: string;
          token_id: number;
          event_id: string;
          blockchain_event_id: number;
          ticket_type: string;
          seat: string | null;
          metadata_uri: string;
          original_price: string;
          current_owner: string;
          resale_count: number;
          max_resale_count: number;
          redeemed: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_id: number;
          event_id: string;
          blockchain_event_id: number;
          ticket_type: string;
          seat?: string | null;
          metadata_uri: string;
          original_price: string;
          current_owner: string;
          resale_count?: number;
          max_resale_count?: number;
          redeemed?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          token_id?: number;
          event_id?: string;
          blockchain_event_id?: number;
          ticket_type?: string;
          seat?: string | null;
          metadata_uri?: string;
          original_price?: string;
          current_owner?: string;
          resale_count?: number;
          max_resale_count?: number;
          redeemed?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      blockchain_transactions: {
        Row: {
          id: string;
          tx_hash: string;
          block_number: number;
          transaction_type:
            | 'EVENT_CREATED'
            | 'TICKET_MINTED'
            | 'TICKET_LISTED'
            | 'TICKET_DELISTED'
            | 'TICKET_RESOLD'
            | 'TICKET_REDEEMED'
            | 'EVENT_CANCELLED'
            | 'REFUND_CLAIMED';
          token_id: number | null;
          event_id: number | null;
          from_address: string | null;
          to_address: string | null;
          amount: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tx_hash: string;
          block_number: number;
          transaction_type:
            | 'EVENT_CREATED'
            | 'TICKET_MINTED'
            | 'TICKET_LISTED'
            | 'TICKET_DELISTED'
            | 'TICKET_RESOLD'
            | 'TICKET_REDEEMED'
            | 'EVENT_CANCELLED'
            | 'REFUND_CLAIMED';
          token_id?: number | null;
          event_id?: number | null;
          from_address?: string | null;
          to_address?: string | null;
          amount?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tx_hash?: string;
          block_number?: number;
          transaction_type?:
            | 'EVENT_CREATED'
            | 'TICKET_MINTED'
            | 'TICKET_LISTED'
            | 'TICKET_DELISTED'
            | 'TICKET_RESOLD'
            | 'TICKET_REDEEMED'
            | 'EVENT_CANCELLED'
            | 'REFUND_CLAIMED';
          token_id?: number | null;
          event_id?: number | null;
          from_address?: string | null;
          to_address?: string | null;
          amount?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      resale_listings: {
        Row: {
          id: string;
          token_id: number;
          seller_wallet: string;
          price: string;
          active: boolean;
          listed_at: string;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_id: number;
          seller_wallet: string;
          price: string;
          active?: boolean;
          listed_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          token_id?: number;
          seller_wallet?: string;
          price?: string;
          active?: boolean;
          listed_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fraud_flags: {
        Row: {
          id: string;
          wallet_address: string;
          risk_score: number;
          risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          reason: string;
          details: Json | null;
          status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          risk_score: number;
          risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          reason: string;
          details?: Json | null;
          status?: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          risk_score?: number;
          risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          reason?: string;
          details?: Json | null;
          status?: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
      };
      gate_devices: {
        Row: {
          id: string;
          device_name: string;
          event_id: string;
          authorized_wallet: string;
          active: boolean;
          last_scan_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_name: string;
          event_id: string;
          authorized_wallet: string;
          active?: boolean;
          last_scan_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_name?: string;
          event_id?: string;
          authorized_wallet?: string;
          active?: boolean;
          last_scan_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scan_logs: {
        Row: {
          id: string;
          ticket_id: number;
          token_id: number;
          gate_device_id: string | null;
          scanner_wallet: string;
          result: 'VALID' | 'INVALID';
          reason: string | null;
          holder_wallet: string;
          event_id: string;
          scanned_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: number;
          token_id: number;
          gate_device_id?: string | null;
          scanner_wallet: string;
          result: 'VALID' | 'INVALID';
          reason?: string | null;
          holder_wallet: string;
          event_id: string;
          scanned_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: number;
          token_id?: number;
          gate_device_id?: string | null;
          scanner_wallet?: string;
          result?: 'VALID' | 'INVALID';
          reason?: string | null;
          holder_wallet?: string;
          event_id?: string;
          scanned_at?: string;
        };
      };
    };
    Views: {
      event_analytics: {
        Row: {
          id: string;
          blockchain_event_id: number;
          title: string;
          organizer_wallet: string;
          max_tickets: number;
          tickets_sold: number;
          sales_percentage: number;
          active_listings: number;
          tickets_redeemed: number;
          total_scans: number;
          failed_scans: number;
          start_at: string;
          end_at: string;
          cancelled: boolean;
        };
      };
      wallet_activity: {
        Row: {
          wallet_address: string;
          tickets_owned: number;
          tickets_used: number;
          active_listings: number;
          total_transactions: number;
          last_activity: string;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}
