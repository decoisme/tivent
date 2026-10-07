-- Create payments table for tracking Xendit fiat payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Xendit reference
  external_id TEXT UNIQUE NOT NULL,
  invoice_id TEXT NOT NULL,
  invoice_url TEXT,
  
  -- Event and ticket info
  event_id INTEGER NOT NULL,
  ticket_type_id INTEGER NOT NULL,
  ticket_quantity INTEGER NOT NULL,
  
  -- Buyer info
  buyer_email TEXT NOT NULL,
  buyer_address TEXT, -- Wallet address (optional, may be null if user doesn't have wallet yet)
  
  -- Payment amounts
  amount_idr NUMERIC NOT NULL,
  amount_eth NUMERIC NOT NULL,
  paid_amount NUMERIC,
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, EXPIRED, FAILED
  payment_method TEXT,
  
  -- Ticket minting info
  ticket_minted BOOLEAN DEFAULT FALSE,
  tx_hash TEXT, -- Blockchain transaction hash
  minted_at TIMESTAMP WITH TIME ZONE,
  mint_error TEXT, -- Error message if minting failed
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_email ON payments(buyer_email);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_address ON payments(buyer_address);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their own payments (by email or wallet address)
CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  USING (
    buyer_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR buyer_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

-- Allow service role to do everything (for API endpoints)
CREATE POLICY "Service role can do everything"
  ON payments
  FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Tracks fiat payment transactions via Xendit and their corresponding NFT ticket minting status';
COMMENT ON COLUMN payments.external_id IS 'Unique identifier for tracking payment across systems (format: TIVENT-{eventId}-{timestamp}-{random})';
COMMENT ON COLUMN payments.invoice_id IS 'Xendit invoice ID';
COMMENT ON COLUMN payments.status IS 'Payment status: PENDING (awaiting payment), PAID (payment confirmed), EXPIRED (invoice expired), FAILED (payment failed)';
COMMENT ON COLUMN payments.ticket_minted IS 'Whether the NFT ticket has been successfully minted on blockchain';
COMMENT ON COLUMN payments.tx_hash IS 'Blockchain transaction hash from ticket minting';
COMMENT ON COLUMN payments.mint_error IS 'Error message if automatic ticket minting failed (requires manual intervention)';
