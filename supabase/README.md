# Supabase Database Setup

This directory contains database migrations for Tivent's payment tracking system.

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for Beginners)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `lpnetzsaxtxmviromnww`

2. **Run the Migration**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"
   - Copy the contents of `migrations/001_create_payments_table.sql`
   - Paste into the SQL editor
   - Click "Run" button

3. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see a new table called `payments`
   - Check that all columns are created correctly

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref lpnetzsaxtxmviromnww

# Run migrations
supabase db push

# Or run specific migration
psql $DATABASE_URL -f supabase/migrations/001_create_payments_table.sql
```

## Database Schema

### `payments` Table

Tracks fiat payment transactions via Xendit and their NFT ticket minting status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `external_id` | TEXT | Unique payment reference (format: TIVENT-{eventId}-{timestamp}-{random}) |
| `invoice_id` | TEXT | Xendit invoice ID |
| `invoice_url` | TEXT | Xendit payment URL |
| `event_id` | INTEGER | Event ID from smart contract |
| `ticket_type_id` | INTEGER | Ticket type ID |
| `ticket_quantity` | INTEGER | Number of tickets purchased |
| `buyer_email` | TEXT | Buyer's email address |
| `buyer_address` | TEXT | Buyer's wallet address (optional) |
| `amount_idr` | NUMERIC | Payment amount in IDR |
| `amount_eth` | NUMERIC | Equivalent amount in ETH/POL |
| `paid_amount` | NUMERIC | Actual amount paid (from Xendit) |
| `status` | TEXT | Payment status: PENDING, PAID, EXPIRED, FAILED |
| `payment_method` | TEXT | Payment method used (e.g., QRIS, Bank Transfer) |
| `ticket_minted` | BOOLEAN | Whether NFT ticket has been minted |
| `tx_hash` | TEXT | Blockchain transaction hash |
| `minted_at` | TIMESTAMP | When ticket was minted |
| `mint_error` | TEXT | Error message if minting failed |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `paid_at` | TIMESTAMP | Payment confirmation time |
| `expiry_date` | TIMESTAMP | Invoice expiry time |

### Indexes

- `idx_payments_external_id` - Fast lookup by external ID
- `idx_payments_invoice_id` - Fast lookup by Xendit invoice ID
- `idx_payments_buyer_email` - Find payments by buyer email
- `idx_payments_buyer_address` - Find payments by wallet address
- `idx_payments_event_id` - Find payments by event
- `idx_payments_status` - Filter by payment status
- `idx_payments_created_at` - Sort by creation time

### Row Level Security (RLS)

- Users can view their own payments (matched by email or wallet address)
- Service role (API endpoints) has full access

## Payment Flow

1. **User initiates payment** → `status = 'PENDING'`
2. **Xendit webhook receives payment** → `status = 'PAID'`, `paid_at` updated
3. **Platform wallet mints ticket** → `ticket_minted = true`, `tx_hash` set
4. **If minting fails** → `mint_error` contains error message

## Querying Examples

### Find payment by external ID
```sql
SELECT * FROM payments WHERE external_id = 'TIVENT-1-1234567890-abc123';
```

### Find all payments for an event
```sql
SELECT * FROM payments WHERE event_id = 1 ORDER BY created_at DESC;
```

### Find pending payments
```sql
SELECT * FROM payments WHERE status = 'PENDING' AND expiry_date > NOW();
```

### Find failed minting attempts
```sql
SELECT * FROM payments 
WHERE status = 'PAID' AND ticket_minted = FALSE AND mint_error IS NOT NULL;
```

### Get payment statistics
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount_idr) as total_idr,
  SUM(ticket_quantity) as total_tickets
FROM payments
GROUP BY status;
```

## Maintenance

### Retry Failed Minting

If automatic ticket minting fails, you can manually retry:

1. Find failed payments:
```sql
SELECT id, external_id, buyer_address, event_id, ticket_type_id 
FROM payments 
WHERE status = 'PAID' AND ticket_minted = FALSE;
```

2. Use the platform wallet script to manually mint tickets
3. Update the payment record:
```sql
UPDATE payments 
SET 
  ticket_minted = TRUE, 
  tx_hash = 'your_transaction_hash',
  minted_at = NOW(),
  mint_error = NULL
WHERE external_id = 'TIVENT-xxx';
```

### Clean Up Expired Payments

```sql
-- Mark expired invoices
UPDATE payments
SET status = 'EXPIRED'
WHERE status = 'PENDING' AND expiry_date < NOW();
```

## Troubleshooting

### Migration fails
- Check that you have the correct permissions
- Ensure the table doesn't already exist
- Check Supabase logs for detailed error messages

### RLS policies not working
- Ensure RLS is enabled: `ALTER TABLE payments ENABLE ROW LEVEL SECURITY;`
- Check that JWT claims are being passed correctly from your API

### Cannot query from API
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Check that API endpoints use service role key for write operations
