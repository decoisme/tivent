-- Create pending_payments table
CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id VARCHAR(255) UNIQUE NOT NULL,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  event_id INTEGER NOT NULL,
  ticket_quantity INTEGER NOT NULL,
  amount_idr BIGINT NOT NULL,
  payer_email VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(42),
  status VARCHAR(50) DEFAULT 'pending',
  invoice_url TEXT,
  paid_at TIMESTAMP,
  paid_amount BIGINT,
  completed_at TIMESTAMP,
  error_message TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create custodial_wallets table
CREATE TABLE IF NOT EXISTS custodial_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_pending_payments_invoice_id ON pending_payments(invoice_id);
CREATE INDEX idx_pending_payments_external_id ON pending_payments(external_id);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);
CREATE INDEX idx_pending_payments_wallet_address ON pending_payments(wallet_address);
CREATE INDEX idx_custodial_wallets_email ON custodial_wallets(email);
CREATE INDEX idx_custodial_wallets_wallet_address ON custodial_wallets(wallet_address);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_payments_updated_at
  BEFORE UPDATE ON pending_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custodial_wallets_updated_at
  BEFORE UPDATE ON custodial_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custodial_wallets ENABLE ROW LEVEL SECURITY;

-- Policies for pending_payments
CREATE POLICY "Anyone can view their own pending payments"
  ON pending_payments FOR SELECT
  USING (payer_email = current_user OR wallet_address = current_user);

CREATE POLICY "Service role can manage all pending payments"
  ON pending_payments FOR ALL
  USING (current_user = 'service_role');

-- Policies for custodial_wallets
CREATE POLICY "Users can view their own custodial wallet"
  ON custodial_wallets FOR SELECT
  USING (email = current_user);

CREATE POLICY "Service role can manage all custodial wallets"
  ON custodial_wallets FOR ALL
  USING (current_user = 'service_role');

-- Comments
COMMENT ON TABLE pending_payments IS 'Stores pending Xendit payment transactions';
COMMENT ON TABLE custodial_wallets IS 'Stores custodial wallets for users without crypto wallets';
COMMENT ON COLUMN pending_payments.status IS 'Payment status: pending, processing, completed, failed';
COMMENT ON COLUMN custodial_wallets.encrypted_private_key IS 'Encrypted private key - NEVER expose this';
