-- Seed data for development and testing
-- This creates sample data for UI development before blockchain integration

-- WARNING: This is for DEVELOPMENT only
-- In production, data comes from blockchain events

-- ==================== SAMPLE PROFILES ====================

INSERT INTO profiles (wallet_address, display_name, role) VALUES
('0x1234567890123456789012345678901234567890', 'Alice Organizer', 'ORGANIZER'),
('0x2345678901234567890123456789012345678901', 'Bob Buyer', 'BUYER'),
('0x3456789012345678901234567890123456789012', 'Charlie Buyer', 'BUYER'),
('0x4567890123456789012345678901234567890123', 'Diana Gate Officer', 'GATE_OFFICER'),
('0x5678901234567890123456789012345678901234', 'Eve Admin', 'ADMIN')
ON CONFLICT (wallet_address) DO NOTHING;

-- ==================== SAMPLE EVENTS ====================

INSERT INTO events (
    blockchain_event_id,
    organizer_wallet,
    title,
    description,
    venue,
    start_at,
    end_at,
    image_url,
    metadata_uri,
    ticket_price,
    max_tickets,
    tickets_sold,
    max_tickets_per_wallet,
    resale_price_cap,
    resale_deadline
) VALUES
(
    1,
    '0x1234567890123456789012345678901234567890',
    'Jakarta Music Festival 2026',
    'The biggest music festival of the year featuring top international and local artists. Three days of non-stop entertainment with multiple stages.',
    'Jakarta International Stadium',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '33 days',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    'ipfs://QmMusicFest2026',
    100000000000000000, -- 0.1 ETH in wei
    5000,
    1243,
    4,
    11000, -- 110%
    NOW() + INTERVAL '29 days'
),
(
    2,
    '0x1234567890123456789012345678901234567890',
    'Tech Conference 2026',
    'Annual technology conference bringing together industry leaders, innovators, and developers for two days of insights and networking.',
    'Bali Convention Center',
    NOW() + INTERVAL '60 days',
    NOW() + INTERVAL '62 days',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    'ipfs://QmTechConf2026',
    150000000000000000, -- 0.15 ETH
    2000,
    856,
    6,
    11500, -- 115%
    NOW() + INTERVAL '59 days'
),
(
    3,
    '0x1234567890123456789012345678901234567890',
    'Art Gallery Opening',
    'Exclusive opening night for contemporary art exhibition featuring emerging artists from Southeast Asia.',
    'National Gallery',
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '15 days' + INTERVAL '6 hours',
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
    'ipfs://QmArtGallery2026',
    50000000000000000, -- 0.05 ETH
    300,
    287,
    2,
    10000, -- 100% (no markup allowed)
    NOW() + INTERVAL '14 days'
),
(
    4,
    '0x1234567890123456789012345678901234567890',
    'Startup Pitch Night',
    'Watch 10 promising startups pitch their ideas to a panel of top investors. Networking session follows.',
    'Innovation Hub Jakarta',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '4 hours',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    'ipfs://QmStartupPitch2026',
    25000000000000000, -- 0.025 ETH
    500,
    482,
    3,
    10500, -- 105%
    NOW() + INTERVAL '6 days'
)
ON CONFLICT (blockchain_event_id) DO NOTHING;

-- ==================== SAMPLE TICKETS ====================

-- Get event IDs
DO $$
DECLARE
    event1_id UUID;
    event2_id UUID;
    event3_id UUID;
BEGIN
    SELECT id INTO event1_id FROM events WHERE blockchain_event_id = 1;
    SELECT id INTO event2_id FROM events WHERE blockchain_event_id = 2;
    SELECT id INTO event3_id FROM events WHERE blockchain_event_id = 3;

    -- Tickets for Music Festival
    INSERT INTO ticket_metadata (
        token_id,
        event_id,
        blockchain_event_id,
        ticket_type,
        seat,
        metadata_uri,
        original_price,
        current_owner
    ) VALUES
    (1, event1_id, 1, 'VIP', 'VIP-A-001', 'ipfs://QmTicket1', 100000000000000000, '0x2345678901234567890123456789012345678901'),
    (2, event1_id, 1, 'General', 'GA-1234', 'ipfs://QmTicket2', 100000000000000000, '0x2345678901234567890123456789012345678901'),
    (3, event1_id, 1, 'General', 'GA-1235', 'ipfs://QmTicket3', 100000000000000000, '0x3456789012345678901234567890123456789012'),
    (4, event1_id, 1, 'VIP', 'VIP-B-042', 'ipfs://QmTicket4', 100000000000000000, '0x3456789012345678901234567890123456789012'),
    
    -- Tickets for Tech Conference
    (5, event2_id, 2, 'Regular', 'R-101', 'ipfs://QmTicket5', 150000000000000000, '0x2345678901234567890123456789012345678901'),
    (6, event2_id, 2, 'Regular', 'R-102', 'ipfs://QmTicket6', 150000000000000000, '0x3456789012345678901234567890123456789012'),
    
    -- Tickets for Art Gallery (one redeemed)
    (7, event3_id, 3, 'General', NULL, 'ipfs://QmTicket7', 50000000000000000, '0x2345678901234567890123456789012345678901'),
    (8, event3_id, 3, 'General', NULL, 'ipfs://QmTicket8', 50000000000000000, '0x3456789012345678901234567890123456789012')
    ON CONFLICT (token_id) DO NOTHING;

    -- Mark one ticket as redeemed
    UPDATE ticket_metadata SET redeemed = true WHERE token_id = 8;
END $$;

-- ==================== SAMPLE RESALE LISTINGS ====================

INSERT INTO resale_listings (token_id, seller_wallet, price, active) VALUES
(2, '0x2345678901234567890123456789012345678901', 105000000000000000, true), -- 5% markup
(4, '0x3456789012345678901234567890123456789012', 110000000000000000, true), -- 10% markup
(6, '0x3456789012345678901234567890123456789012', 165000000000000000, false) -- Sold
ON CONFLICT (token_id) DO NOTHING;

-- ==================== SAMPLE BLOCKCHAIN TRANSACTIONS ====================

INSERT INTO blockchain_transactions (
    tx_hash,
    block_number,
    transaction_type,
    token_id,
    event_id,
    from_address,
    to_address,
    amount
) VALUES
('0xabc123...001', 1000001, 'EVENT_CREATED', NULL, 1, '0x1234567890123456789012345678901234567890', '0x0000000000000000000000000000000000000000', 0),
('0xabc123...002', 1000012, 'TICKET_MINTED', 1, 1, '0x0000000000000000000000000000000000000000', '0x2345678901234567890123456789012345678901', 100000000000000000),
('0xabc123...003', 1000023, 'TICKET_MINTED', 2, 1, '0x0000000000000000000000000000000000000000', '0x2345678901234567890123456789012345678901', 100000000000000000),
('0xabc123...004', 1000034, 'TICKET_LISTED', 2, 1, '0x2345678901234567890123456789012345678901', '0x0000000000000000000000000000000000000000', 105000000000000000),
('0xabc123...005', 1000045, 'TICKET_REDEEMED', 8, 3, '0x3456789012345678901234567890123456789012', '0x0000000000000000000000000000000000000000', 0)
ON CONFLICT (tx_hash) DO NOTHING;

-- ==================== SAMPLE GATE DEVICES ====================

DO $$
DECLARE
    event1_id UUID;
BEGIN
    SELECT id INTO event1_id FROM events WHERE blockchain_event_id = 1;
    
    INSERT INTO gate_devices (device_name, event_id, authorized_wallet, active) VALUES
    ('Main Entrance Scanner A', event1_id, '0x4567890123456789012345678901234567890123', true),
    ('Main Entrance Scanner B', event1_id, '0x4567890123456789012345678901234567890123', true),
    ('VIP Entrance Scanner', event1_id, '0x4567890123456789012345678901234567890123', true)
    ON CONFLICT DO NOTHING;
END $$;

-- ==================== SAMPLE SCAN LOGS ====================

DO $$
DECLARE
    event1_id UUID;
    device1_id UUID;
BEGIN
    SELECT id INTO event1_id FROM events WHERE blockchain_event_id = 1;
    SELECT id INTO device1_id FROM gate_devices LIMIT 1;
    
    INSERT INTO scan_logs (
        ticket_id, 
        token_id, 
        gate_device_id, 
        scanner_wallet, 
        result, 
        reason,
        holder_wallet, 
        event_id
    ) VALUES
    (8, 8, device1_id, '0x4567890123456789012345678901234567890123', 'VALID', NULL, '0x3456789012345678901234567890123456789012', event1_id),
    (8, 8, device1_id, '0x4567890123456789012345678901234567890123', 'INVALID', 'TICKET ALREADY REDEEMED', '0x3456789012345678901234567890123456789012', event1_id),
    (1, 1, device1_id, '0x4567890123456789012345678901234567890123', 'INVALID', 'QR CODE EXPIRED', '0x2345678901234567890123456789012345678901', event1_id)
    ON CONFLICT DO NOTHING;
END $$;

-- ==================== SAMPLE FRAUD FLAGS ====================

INSERT INTO fraud_flags (
    wallet_address,
    risk_score,
    risk_level,
    reason,
    status,
    details
) VALUES
(
    '0x9999999999999999999999999999999999999999',
    72,
    'HIGH',
    'Multiple rapid resale attempts within 24 hours',
    'ACTIVE',
    '{"resale_count": 8, "time_window": "24h", "events": [1, 2]}'::jsonb
),
(
    '0x8888888888888888888888888888888888888888',
    45,
    'MEDIUM',
    'Purchased maximum tickets across multiple wallets from same IP',
    'ACTIVE',
    '{"wallet_count": 3, "ticket_count": 12}'::jsonb
),
(
    '0x7777777777777777777777777777777777777777',
    25,
    'LOW',
    'Minor pattern anomaly detected',
    'RESOLVED',
    '{"resolved_reason": "False positive - legitimate buyer"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- ==================== REFRESH MATERIALIZED VIEWS ====================

-- If you create materialized views, refresh them here
-- REFRESH MATERIALIZED VIEW event_stats;

COMMENT ON TABLE profiles IS 'Sample development data loaded';
