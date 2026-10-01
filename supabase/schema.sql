-- Tivent Database Schema
-- This schema serves as an off-chain index/cache for blockchain data
-- The blockchain is ALWAYS the source of truth for ownership and ticket state

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PROFILES ====================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('BUYER', 'ORGANIZER', 'GATE_OFFICER', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ==================== EVENTS ====================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blockchain_event_id BIGINT UNIQUE NOT NULL,
    organizer_wallet TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    venue TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    metadata_uri TEXT NOT NULL,
    
    -- Cached blockchain data
    ticket_price NUMERIC(78, 0) NOT NULL, -- Wei amount
    max_tickets INTEGER NOT NULL,
    tickets_sold INTEGER NOT NULL DEFAULT 0,
    max_tickets_per_wallet INTEGER NOT NULL,
    resale_price_cap INTEGER NOT NULL, -- Basis points
    resale_deadline TIMESTAMPTZ NOT NULL,
    primary_sale_active BOOLEAN NOT NULL DEFAULT true,
    resale_active BOOLEAN NOT NULL DEFAULT true,
    cancelled BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_organizer ON events(organizer_wallet);
CREATE INDEX idx_events_blockchain_id ON events(blockchain_event_id);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_cancelled ON events(cancelled);

-- ==================== TICKET METADATA ====================

CREATE TABLE ticket_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT UNIQUE NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    blockchain_event_id BIGINT NOT NULL,
    ticket_type TEXT NOT NULL,
    seat TEXT,
    metadata_uri TEXT NOT NULL,
    
    -- Cached blockchain data
    original_price NUMERIC(78, 0) NOT NULL,
    current_owner TEXT NOT NULL,
    resale_count SMALLINT NOT NULL DEFAULT 0,
    max_resale_count SMALLINT NOT NULL DEFAULT 3,
    redeemed BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_metadata_token_id ON ticket_metadata(token_id);
CREATE INDEX idx_ticket_metadata_event_id ON ticket_metadata(event_id);
CREATE INDEX idx_ticket_metadata_owner ON ticket_metadata(current_owner);
CREATE INDEX idx_ticket_metadata_redeemed ON ticket_metadata(redeemed);

-- ==================== BLOCKCHAIN TRANSACTIONS ====================

CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN (
            'EVENT_CREATED',
            'TICKET_MINTED',
            'TICKET_LISTED',
            'TICKET_DELISTED',
            'TICKET_RESOLD',
            'TICKET_REDEEMED',
            'EVENT_CANCELLED',
            'REFUND_CLAIMED'
        )
    ),
    token_id BIGINT,
    event_id BIGINT,
    from_address TEXT,
    to_address TEXT,
    amount NUMERIC(78, 0), -- Wei amount
    metadata JSONB, -- Additional transaction data
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX idx_blockchain_tx_type ON blockchain_transactions(transaction_type);
CREATE INDEX idx_blockchain_tx_token_id ON blockchain_transactions(token_id);
CREATE INDEX idx_blockchain_tx_from ON blockchain_transactions(from_address);
CREATE INDEX idx_blockchain_tx_to ON blockchain_transactions(to_address);
CREATE INDEX idx_blockchain_tx_block ON blockchain_transactions(block_number);

-- ==================== RESALE LISTINGS ====================

CREATE TABLE resale_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT UNIQUE NOT NULL,
    seller_wallet TEXT NOT NULL,
    price NUMERIC(78, 0) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    listed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resale_listings_token_id ON resale_listings(token_id);
CREATE INDEX idx_resale_listings_seller ON resale_listings(seller_wallet);
CREATE INDEX idx_resale_listings_active ON resale_listings(active);

-- ==================== FRAUD FLAGS ====================

CREATE TABLE fraud_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    reason TEXT NOT NULL,
    details JSONB, -- Additional context
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RESOLVED', 'DISMISSED')) DEFAULT 'ACTIVE',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

CREATE INDEX idx_fraud_flags_wallet ON fraud_flags(wallet_address);
CREATE INDEX idx_fraud_flags_risk_level ON fraud_flags(risk_level);
CREATE INDEX idx_fraud_flags_status ON fraud_flags(status);
CREATE INDEX idx_fraud_flags_created_at ON fraud_flags(created_at DESC);

-- ==================== GATE DEVICES ====================

CREATE TABLE gate_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_name TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    authorized_wallet TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    last_scan_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gate_devices_event_id ON gate_devices(event_id);
CREATE INDEX idx_gate_devices_wallet ON gate_devices(authorized_wallet);
CREATE INDEX idx_gate_devices_active ON gate_devices(active);

-- ==================== SCAN LOGS ====================

CREATE TABLE scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id BIGINT NOT NULL,
    token_id BIGINT NOT NULL,
    gate_device_id UUID REFERENCES gate_devices(id) ON DELETE SET NULL,
    scanner_wallet TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('VALID', 'INVALID')),
    reason TEXT, -- Reason for rejection if invalid
    holder_wallet TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX idx_scan_logs_gate_device ON scan_logs(gate_device_id);
CREATE INDEX idx_scan_logs_result ON scan_logs(result);
CREATE INDEX idx_scan_logs_scanned_at ON scan_logs(scanned_at DESC);
CREATE INDEX idx_scan_logs_event_id ON scan_logs(event_id);

-- ==================== ANALYTICS ====================

-- Event analytics view
CREATE VIEW event_analytics AS
SELECT 
    e.id,
    e.blockchain_event_id,
    e.title,
    e.organizer_wallet,
    e.max_tickets,
    e.tickets_sold,
    ROUND((e.tickets_sold::NUMERIC / e.max_tickets::NUMERIC) * 100, 2) as sales_percentage,
    COUNT(DISTINCT rl.id) FILTER (WHERE rl.active = true) as active_listings,
    COUNT(DISTINCT tm.id) FILTER (WHERE tm.redeemed = true) as tickets_redeemed,
    COUNT(DISTINCT sl.id) as total_scans,
    COUNT(DISTINCT sl.id) FILTER (WHERE sl.result = 'INVALID') as failed_scans,
    e.start_at,
    e.end_at,
    e.cancelled
FROM events e
LEFT JOIN ticket_metadata tm ON e.id = tm.event_id
LEFT JOIN resale_listings rl ON tm.token_id = rl.token_id
LEFT JOIN scan_logs sl ON e.id = sl.event_id
GROUP BY e.id;

-- Wallet activity view
CREATE VIEW wallet_activity AS
SELECT 
    tm.current_owner as wallet_address,
    COUNT(DISTINCT tm.token_id) as tickets_owned,
    COUNT(DISTINCT tm.token_id) FILTER (WHERE tm.redeemed = true) as tickets_used,
    COUNT(DISTINCT rl.id) FILTER (WHERE rl.active = true) as active_listings,
    COUNT(DISTINCT bt.id) as total_transactions,
    MAX(bt.created_at) as last_activity
FROM ticket_metadata tm
LEFT JOIN resale_listings rl ON tm.token_id = rl.token_id AND rl.seller_wallet = tm.current_owner
LEFT JOIN blockchain_transactions bt ON bt.from_address = tm.current_owner OR bt.to_address = tm.current_owner
GROUP BY tm.current_owner;

-- ==================== FUNCTIONS ====================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_metadata_updated_at BEFORE UPDATE ON ticket_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resale_listings_updated_at BEFORE UPDATE ON resale_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fraud_flags_updated_at BEFORE UPDATE ON fraud_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gate_devices_updated_at BEFORE UPDATE ON gate_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resale_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for events and ticket metadata
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

CREATE POLICY "Ticket metadata is viewable by everyone" ON ticket_metadata
    FOR SELECT USING (true);

CREATE POLICY "Resale listings are viewable by everyone" ON resale_listings
    FOR SELECT USING (true);

CREATE POLICY "Blockchain transactions are viewable by everyone" ON blockchain_transactions
    FOR SELECT USING (true);

-- Profiles can be viewed by authenticated users
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Fraud flags viewable by admins only
CREATE POLICY "Fraud flags viewable by admins" ON fraud_flags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.wallet_address = auth.jwt()->>'wallet_address'
            AND profiles.role = 'ADMIN'
        )
    );

-- Gate devices viewable by authorized users
CREATE POLICY "Gate devices viewable by authorized users" ON gate_devices
    FOR SELECT USING (
        authorized_wallet = auth.jwt()->>'wallet_address'
        OR EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = gate_devices.event_id
            AND events.organizer_wallet = auth.jwt()->>'wallet_address'
        )
    );

-- Scan logs viewable by event organizers and gate officers
CREATE POLICY "Scan logs viewable by organizers and officers" ON scan_logs
    FOR SELECT USING (
        scanner_wallet = auth.jwt()->>'wallet_address'
        OR EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = scan_logs.event_id
            AND events.organizer_wallet = auth.jwt()->>'wallet_address'
        )
    );

-- ==================== COMMENTS ====================

COMMENT ON TABLE events IS 'Cached event data from blockchain. Blockchain is source of truth.';
COMMENT ON TABLE ticket_metadata IS 'Cached ticket data from blockchain. Verify ownership on-chain.';
COMMENT ON TABLE blockchain_transactions IS 'Historical record of all blockchain transactions.';
COMMENT ON TABLE fraud_flags IS 'Off-chain fraud detection flags based on behavior analysis.';
COMMENT ON TABLE scan_logs IS 'Log of all ticket scan attempts at event gates.';

COMMENT ON COLUMN ticket_metadata.current_owner IS 'Cached from blockchain. Always verify ownership on-chain.';
COMMENT ON COLUMN ticket_metadata.redeemed IS 'Cached from blockchain. Always verify on-chain before entry.';


-- Helper function to increment tickets_sold
CREATE OR REPLACE FUNCTION increment_tickets_sold(p_event_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET tickets_sold = tickets_sold + 1,
      updated_at = NOW()
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;
