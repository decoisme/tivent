# Ownership History & Provenance Tracking

## Overview

Tivent implements a comprehensive ownership history tracking system that records the complete lifecycle of each NFT ticket from minting to redemption. This provides full transparency, authenticity verification, and detailed provenance tracking for all tickets on the platform.

## Features

### 1. **Complete Ownership Chain**

Every ticket's full history is tracked including:
- **Minting**: Original purchase from event organizer
- **Listings**: When tickets are listed for resale
- **Resales**: Transfers between users
- **Listing Cancellations**: When resale listings are removed
- **Redemptions**: When tickets are used for event entry

### 2. **Provenance Verification**

Blockchain-verified chain of custody:
- Original owner tracking
- Current owner verification
- Complete transfer history
- Timestamp verification
- Transaction hash linking

### 3. **Price History Analytics**

Comprehensive price tracking:
- Original mint price
- Current market price
- Highest resale price
- Lowest resale price
- Total trading volume
- Price appreciation/depreciation percentage

### 4. **Visual Timeline**

Interactive timeline visualization showing:
- Event type icons and colors
- Transaction timestamps
- Wallet addresses (from/to)
- Price information
- Transaction hashes (linkable to Etherscan)
- Event metadata

## Data Structure

### Ownership Event Types

```typescript
enum OwnershipEventType {
  MINTED = 'minted',           // Original purchase
  PURCHASED = 'purchased',      // Direct purchase
  LISTED = 'listed',            // Listed for resale
  LISTING_CANCELLED = 'listing_cancelled',  // Listing removed
  RESOLD = 'resold',            // Resale transfer
  REDEEMED = 'redeemed',        // Used for entry
  TRANSFERRED = 'transferred',   // Direct transfer
}
```

### Ownership Record

```typescript
interface OwnershipRecord {
  id: string;
  tokenId: number;
  eventType: OwnershipEventType;
  fromAddress: string | null;
  toAddress: string | null;
  price: string | null;
  transactionHash: string | null;
  blockNumber: number | null;
  timestamp: Date;
  metadata?: {
    eventId?: number;
    listingPrice?: string;
    reason?: string;
  };
}
```

### Ownership Chain

```typescript
interface OwnershipChain {
  tokenId: number;
  currentOwner: string;
  originalOwner: string;
  totalTransfers: number;
  totalResales: number;
  history: OwnershipRecord[];
  timeline: {
    minted: Date;
    firstSale?: Date;
    lastTransfer?: Date;
    redeemed?: Date;
  };
  priceHistory: {
    originalPrice: string;
    currentPrice: string;
    highestPrice: string;
    lowestPrice: string;
    totalVolume: string;
  };
}
```

## Usage

### Get Ticket Ownership History

```typescript
import { useTicketOwnershipHistory } from '@/hooks/useOwnershipHistory';

function TicketDetail() {
  const { ownershipChain, loading } = useTicketOwnershipHistory(tokenId);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <h2>Total Transfers: {ownershipChain.totalTransfers}</h2>
      <h2>Total Resales: {ownershipChain.totalResales}</h2>
      {/* Render timeline */}
    </div>
  );
}
```

### Get Wallet Ownership History

```typescript
import { useWalletOwnershipHistory } from '@/hooks/useOwnershipHistory';

function WalletProfile() {
  const { history, stats } = useWalletOwnershipHistory(walletAddress);
  
  return (
    <div>
      <p>Total Purchases: {stats.totalPurchases}</p>
      <p>Total Sales: {stats.totalSales}</p>
      <p>Net Position: {formatEther(stats.netPosition)} ETH</p>
      {/* Render history */}
    </div>
  );
}
```

### Verify Ticket Provenance

```typescript
import { useProvenanceVerification } from '@/hooks/useOwnershipHistory';

function ProvenanceCheck() {
  const { provenance, verifying } = useProvenanceVerification(tokenId);
  
  if (!provenance) return null;
  
  return (
    <div>
      {provenance.isVerified && (
        <span>✓ Verified</span>
      )}
      <p>Transfer Count: {provenance.transferCount}</p>
      {/* Render chain of custody */}
    </div>
  );
}
```

## Visual Components

### 1. Ownership Timeline

Shows chronological history with visual indicators:

```typescript
import { OwnershipTimeline } from '@/components/OwnershipTimeline';

<OwnershipTimeline 
  history={ownershipChain.history}
  compact={false}  // Full view with details
/>
```

**Features:**
- Color-coded event types
- Event icons (🎫 mint, 🔄 resale, ✅ redeemed, etc.)
- Timestamp display
- Address information (from/to)
- Price information
- Transaction hash links to Etherscan
- Vertical timeline line connecting events

### 2. Ownership Stats Card

Displays key statistics:

```typescript
import { OwnershipStatsCard } from '@/components/OwnershipTimeline';

<OwnershipStatsCard stats={{
  totalTransfers: 3,
  totalResales: 2,
  originalPrice: "1000000000000000000",
  currentPrice: "1200000000000000000",
  highestPrice: "1500000000000000000",
  totalVolume: "3500000000000000000",
}} />
```

**Displays:**
- Total transfers
- Total resales
- Original price
- Current price
- Highest price
- Total trading volume
- Value change percentage

### 3. Provenance Card

Verification and chain of custody:

```typescript
import { ProvenanceCard } from '@/components/OwnershipTimeline';

<ProvenanceCard provenance={provenance} />
```

**Shows:**
- Verification status
- Mint date
- Transfer count
- Chain integrity percentage
- Complete chain of custody with dates

## API Functions

### Core Functions

```typescript
// Get complete ownership history for a ticket
const chain = await getTicketOwnershipHistory(tokenId);

// Get ownership history for a wallet
const history = await getWalletOwnershipHistory(walletAddress);

// Get wallet statistics
const stats = await getWalletOwnershipStats(walletAddress);

// Verify provenance
const verification = await verifyTicketProvenance(tokenId);

// Export to CSV
const csv = exportOwnershipHistoryToCSV(chain);
```

### Database Queries

The system queries multiple tables:
- `ticket_metadata` - Current ticket state
- `blockchain_transactions` - All blockchain events
- `resale_listings` - Listing and resale history

All data is sorted chronologically and validated for consistency.

## Data Sources

### 1. Blockchain Transactions Table

```sql
SELECT * FROM blockchain_transactions
WHERE metadata->>'tokenId' = '123'
ORDER BY timestamp ASC;
```

Records all on-chain events:
- Ticket purchases (mints)
- Resale transactions
- Event-related transactions

### 2. Resale Listings Table

```sql
SELECT * FROM resale_listings
WHERE token_id = 123
ORDER BY listed_at ASC;
```

Tracks:
- Active listings
- Cancelled listings
- Completed sales
- Listing prices

### 3. Ticket Metadata Table

```sql
SELECT * FROM ticket_metadata
WHERE token_id = 123;
```

Current state:
- Current owner
- Original owner
- Purchase count
- Redemption status

## Timeline Event Icons

| Event Type | Icon | Color |
|------------|------|-------|
| Minted | 🎫 | Blue |
| Purchased | 💰 | Green |
| Listed | 📋 | Yellow |
| Listing Cancelled | ❌ | Red |
| Resold | 🔄 | Purple |
| Redeemed | ✅ | Green |
| Transferred | ➡️ | Gray |

## Price Analytics

### Value Change Calculation

```typescript
const valueChange = (
  (currentPrice - originalPrice) / originalPrice
) * 100;

// Display as percentage with color coding:
// Green: Positive appreciation
// Red: Depreciation
// Gray: No change
```

### Volume Calculation

```typescript
const totalVolume = history
  .filter(h => h.price !== null)
  .reduce((sum, h) => sum + BigInt(h.price), 0n);
```

## Use Cases

### 1. For Buyers

- **Authenticity Verification**: Verify ticket is genuine
- **Price History**: See historical resale prices
- **Owner History**: Check if ticket changed hands frequently (red flag)
- **Original Source**: Verify it was minted from official event

### 2. For Sellers

- **Proof of Ownership**: Show legitimate ownership
- **Price Justification**: Show market history for pricing
- **Transfer History**: Transparent resale count

### 3. For Event Organizers

- **Ticket Tracking**: Monitor ticket distribution
- **Fraud Detection**: Identify suspicious transfer patterns
- **Revenue Analysis**: Track primary vs secondary sales
- **Fan Analytics**: Understand ticket holder behavior

### 4. For Platform Admins

- **Audit Trail**: Complete transaction history
- **Compliance**: Regulatory reporting
- **Dispute Resolution**: Investigate ownership disputes
- **Analytics**: Platform-wide trading patterns

## Export Functionality

### CSV Export

```typescript
const csv = exportOwnershipHistoryToCSV(ownershipChain);

// Download as file
const blob = new Blob([csv], { type: 'text/csv' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `ticket-${tokenId}-history.csv`;
a.click();
```

CSV format includes:
- Timestamp
- Event Type
- From Address
- To Address
- Price (ETH)
- Transaction Hash

## Security Considerations

1. **Data Integrity**: All data sourced from blockchain transactions
2. **Timestamp Accuracy**: Block timestamps used for ordering
3. **Address Verification**: Checksummed Ethereum addresses
4. **Transaction Linking**: Direct links to Etherscan for verification
5. **Privacy**: Only on-chain public data is displayed

## Performance Optimization

1. **Lazy Loading**: History loaded on-demand
2. **Pagination**: For wallets with many tickets
3. **Caching**: Recent queries cached in memory
4. **Indexing**: Database indexes on token_id, wallet_address
5. **Aggregation**: Pre-calculated statistics

## Future Enhancements

### Planned Features:

1. **Real-Time Updates**: WebSocket for live history updates
2. **Advanced Filtering**: Filter by date range, event type, price range
3. **Graph Visualization**: Network graph of ticket transfers
4. **IPFS Integration**: Store detailed metadata on IPFS
5. **PDF Reports**: Generate printable ownership certificates
6. **Multi-Chain**: Support for multiple blockchain networks
7. **NFT Metadata**: Display ticket images and attributes
8. **Trading Analysis**: Advanced price prediction and trends

## Testing

### Unit Tests (Future)

```typescript
describe('Ownership History', () => {
  it('should load complete history', async () => {
    const chain = await getTicketOwnershipHistory(1);
    expect(chain).toBeDefined();
    expect(chain.history.length).toBeGreaterThan(0);
  });
  
  it('should calculate price statistics correctly', async () => {
    const chain = await getTicketOwnershipHistory(1);
    expect(chain.priceHistory.totalVolume).toBeDefined();
  });
  
  it('should verify provenance', async () => {
    const provenance = await verifyTicketProvenance(1);
    expect(provenance.isVerified).toBe(true);
  });
});
```

## Support

For issues with ownership history:
- Check blockchain sync status
- Verify transaction data in database
- Review Etherscan for on-chain verification
- Contact platform support

---

**Last Updated**: 2024
**Version**: 1.0.0
