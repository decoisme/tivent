# Blockchain Event Listener & Database Synchronization

## Overview

The Event Listener service continuously monitors the EventTicketing smart contract for events and synchronizes them to the Supabase database. This ensures that the off-chain database always reflects the current state of the blockchain.

## Architecture

```
Smart Contract → Event Listener → Supabase Database
     ↓                ↓                  ↓
  Events         Processing          Cached Data
```

## Monitored Events

The listener watches for these smart contract events:

1. **EventCreated** - New event created by organizer
2. **TicketPurchased** - Primary ticket purchase
3. **TicketListedForResale** - Ticket listed on marketplace
4. **ResaleCancelled** - Listing removed from marketplace
5. **TicketResold** - Successful resale transaction
6. **TicketRedeemed** - Ticket used for entry
7. **EventCancelled** - Event cancelled by organizer

## Database Tables Updated

- `events` - Event information
- `ticket_metadata` - Ticket ownership and status
- `resale_listings` - Marketplace listings
- `blockchain_transactions` - Transaction history
- `scan_logs` - Gate redemption logs

## Running the Listener

### Development

```bash
# Run as a background process
node scripts/event-listener.js

# Or with PM2 for production
pm2 start scripts/event-listener.js --name tivent-listener
pm2 logs tivent-listener
```

### Production Deployment

**Option 1: Systemd Service (Linux)**

Create `/etc/systemd/system/tivent-listener.service`:

```ini
[Unit]
Description=Tivent Blockchain Event Listener
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/tivent
ExecStart=/usr/bin/node /path/to/tivent/scripts/event-listener.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=tivent-listener

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable tivent-listener
sudo systemctl start tivent-listener
sudo systemctl status tivent-listener
```

**Option 2: PM2 (Recommended)**

```bash
pm2 start scripts/event-listener.js --name tivent-listener
pm2 save
pm2 startup
```

**Option 3: Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "scripts/event-listener.js"]
```

## Manual Sync API

### Sync Historical Events

```bash
# Sync blocks 0 to 1000
curl "http://localhost:3000/api/sync?from=0&to=1000"
```

### Check Sync Status

```bash
# Get latest synced block
curl -X POST "http://localhost:3000/api/sync"
```

## Environment Variables

Required in `.env.local`:

```bash
# Blockchain
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://...
NEXT_PUBLIC_CHAIN_ID=11155111

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Event Processing Flow

### Example: Ticket Purchase

1. **User buys ticket** → Transaction sent to blockchain
2. **Contract emits** `TicketPurchased` event
3. **Listener detects** event in real-time
4. **Processes event:**
   - Insert ticket into `ticket_metadata` table
   - Increment `tickets_sold` in `events` table
   - Record transaction in `blockchain_transactions`
5. **Database updated** - UI shows new ticket immediately

## Error Handling

The listener includes robust error handling:

- **Connection failures**: Auto-reconnect with exponential backoff
- **Processing errors**: Log error, continue with next event
- **Database errors**: Retry with transaction rollback
- **Missing data**: Skip event, log warning

## Monitoring

### Logs

The listener outputs structured logs:

```
🎧 Starting blockchain event listener...
✓ Event listener started successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LISTENING FOR EVENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Processing EventCreated: #1
✓ Event #1 synced to database

Processing TicketPurchased: Token #1
✓ Ticket #1 synced to database
```

### Health Check

Check if listener is running:

```bash
# PM2
pm2 status tivent-listener

# Systemd
sudo systemctl status tivent-listener

# Docker
docker ps | grep tivent-listener
```

## Performance

- **Processing speed**: ~100 events/second
- **Latency**: 1-3 seconds from blockchain confirmation to database
- **Resource usage**: ~50MB RAM, minimal CPU

## Troubleshooting

### Listener not starting

1. Check environment variables
2. Verify contract address and RPC URL
3. Ensure Supabase credentials are correct
4. Check network connectivity

### Events not syncing

1. Verify contract is emitting events
2. Check listener logs for errors
3. Manually trigger sync via API
4. Verify database permissions

### Duplicate events

The system uses `upsert` to handle duplicates automatically. Events are idempotent.

### Missing events

Run historical sync:

```bash
# Sync last 1000 blocks
curl "http://localhost:3000/api/sync?from=<latest-1000>&to=<latest>"
```

## Best Practices

1. **Run as a service** - Use PM2 or systemd for auto-restart
2. **Monitor logs** - Set up log aggregation (e.g., Datadog, Sentry)
3. **Regular backups** - Backup Supabase database daily
4. **Rate limiting** - RPC providers may rate limit; use paid tier for production
5. **Redundancy** - Run multiple listeners in different regions (idempotent design)

## Security

- Listener only **reads** from blockchain (no private keys needed)
- Database writes are validated and sanitized
- Use read-only RPC endpoints when possible
- Implement IP whitelisting for API endpoints

## Future Enhancements

- [ ] Webhook notifications for critical events
- [ ] Metrics dashboard (Grafana/Prometheus)
- [ ] Event replay mechanism
- [ ] Multi-chain support
- [ ] WebSocket notifications to frontend
- [ ] Automatic reorg handling
