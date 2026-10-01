# Tivent Supabase Database

This directory contains the database schema and migrations for the Tivent platform.

## Important: Blockchain is Source of Truth

**The Supabase database serves as an INDEX and CACHE only.**

- ✅ Use for: Fast searches, filtering, analytics, UI display
- ❌ Never trust for: Ticket ownership, redemption status, payment verification
- ⚠️ Always verify: Critical data against blockchain before taking action

## Database Architecture

### Tables

#### Core Tables
- **profiles** - User wallet addresses and roles
- **events** - Event metadata and cached blockchain state
- **ticket_metadata** - Ticket details and cached ownership
- **blockchain_transactions** - Complete transaction history

#### Marketplace
- **resale_listings** - Active and historical resale listings

#### Security & Operations
- **fraud_flags** - Risk scoring and suspicious activity
- **gate_devices** - Authorized scanning devices
- **scan_logs** - Complete scan history for analytics

### Views

- **event_analytics** - Pre-computed event statistics
- **wallet_activity** - User activity summaries

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

### 2. Run Schema

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL Editor in Supabase dashboard
# Copy and paste contents of schema.sql
```

### 3. Configure Environment

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Row Level Security (RLS)

RLS is enabled on all tables with the following policies:

### Public Access
- Events (read)
- Ticket metadata (read)
- Resale listings (read)
- Blockchain transactions (read)

### Authenticated Access
- Profiles (read own, update own)

### Admin Only
- Fraud flags (read/write)

### Role-Based Access
- Gate devices (authorized officers and organizers)
- Scan logs (gate officers and organizers)

## Data Synchronization

The database is kept in sync with the blockchain through event listeners:

1. **Blockchain Events** → Emit from smart contract
2. **Event Listener** → Catch events in backend
3. **Database Update** → Cache data in Supabase

### Synchronization Flow

```
Smart Contract Event
        ↓
Backend Event Listener
        ↓
Validate Event Data
        ↓
Update Supabase Table
        ↓
Emit Real-time Update
        ↓
Frontend Updates
```

## Critical Operations

### Ticket Verification Flow

**WRONG** ❌
```typescript
// Never trust database alone
const ticket = await supabase
  .from('ticket_metadata')
  .select('redeemed')
  .eq('token_id', ticketId)
  .single();

if (!ticket.redeemed) {
  // DANGEROUS - data might be stale
}
```

**CORRECT** ✅
```typescript
// Always verify on blockchain
const isRedeemed = await contract.tickets(tokenId).redeemed;
const currentOwner = await contract.ownerOf(tokenId);

// Then use database for UX only
const ticket = await supabase
  .from('ticket_metadata')
  .select('*')
  .eq('token_id', ticketId)
  .single();
```

## Indexes

All critical query paths are indexed:

- **Wallet lookups**: Fast user ticket retrieval
- **Event queries**: Efficient event browsing
- **Time-based queries**: Scan logs and transaction history
- **Status filters**: Active/redeemed/cancelled tickets

## Analytics Queries

### Event Performance

```sql
SELECT * FROM event_analytics
WHERE blockchain_event_id = $1;
```

### Wallet Activity

```sql
SELECT * FROM wallet_activity
WHERE wallet_address = $1;
```

### Fraud Detection

```sql
SELECT 
    wallet_address,
    risk_score,
    COUNT(*) as flag_count
FROM fraud_flags
WHERE status = 'ACTIVE'
GROUP BY wallet_address, risk_score
HAVING COUNT(*) > 2
ORDER BY risk_score DESC;
```

### Resale Activity

```sql
SELECT 
    e.title,
    COUNT(rl.id) as listing_count,
    AVG(rl.price::numeric / tm.original_price::numeric) as avg_markup
FROM resale_listings rl
JOIN ticket_metadata tm ON rl.token_id = tm.token_id
JOIN events e ON tm.event_id = e.id
WHERE rl.active = true
GROUP BY e.id, e.title;
```

## Maintenance

### Backup Strategy

- Supabase provides automatic backups
- Critical data is always recoverable from blockchain
- Export analytics data periodically for reporting

### Data Cleanup

```sql
-- Archive old scan logs (keep 90 days)
DELETE FROM scan_logs 
WHERE scanned_at < NOW() - INTERVAL '90 days';

-- Archive resolved fraud flags (keep 1 year)
DELETE FROM fraud_flags 
WHERE status = 'RESOLVED' 
AND resolved_at < NOW() - INTERVAL '1 year';
```

### Reindexing

If queries become slow:

```sql
REINDEX TABLE ticket_metadata;
REINDEX TABLE blockchain_transactions;
```

## Monitoring

### Health Checks

```sql
-- Check sync lag (should be < 1 minute)
SELECT 
    MAX(created_at) as last_transaction,
    NOW() - MAX(created_at) as lag
FROM blockchain_transactions;

-- Check for missing data
SELECT 
    COUNT(*) as events_without_tickets
FROM events e
LEFT JOIN ticket_metadata tm ON e.id = tm.event_id
WHERE e.tickets_sold > 0 AND tm.id IS NULL;
```

### Performance Metrics

```sql
-- Slow queries
SELECT 
    query,
    calls,
    total_time / calls as avg_time
FROM pg_stat_statements
ORDER BY avg_time DESC
LIMIT 10;
```

## Real-time Subscriptions

Enable real-time updates for:

- New ticket purchases
- Resale listing changes
- Scan events (for organizer dashboards)

```typescript
// Subscribe to ticket purchases for an event
const subscription = supabase
  .channel('ticket-purchases')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'ticket_metadata',
    filter: `blockchain_event_id=eq.${eventId}`
  }, (payload) => {
    console.log('New ticket purchased!', payload);
  })
  .subscribe();
```

## Troubleshooting

### Data Inconsistency

If database is out of sync with blockchain:

1. Check event listener is running
2. Verify RPC connection
3. Re-sync from blockchain:

```typescript
// Rebuild ticket_metadata from blockchain
const tokenCount = await contract.ticketCount();
for (let i = 1; i <= tokenCount; i++) {
  const ticket = await contract.tickets(i);
  const owner = await contract.ownerOf(i);
  // Update database...
}
```

### Performance Issues

1. Check query execution plans: `EXPLAIN ANALYZE SELECT ...`
2. Verify indexes are being used
3. Consider materialized views for heavy analytics
4. Enable connection pooling

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ API keys properly scoped
- ✅ Sensitive data never exposed
- ✅ Wallet addresses validated
- ✅ No direct writes from frontend to critical tables
- ✅ Admin functions protected
- ✅ Rate limiting on queries

## Migration Strategy

For schema changes:

1. Create migration file: `migrations/YYYYMMDD_description.sql`
2. Test on staging database
3. Apply to production during low-traffic period
4. Verify data integrity
5. Update application code

## Support

For database issues:
- Check Supabase status page
- Review query logs
- Contact Supabase support for infrastructure issues
- Rebuild from blockchain if data is corrupted
