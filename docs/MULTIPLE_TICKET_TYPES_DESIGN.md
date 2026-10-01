# Multiple Ticket Types - Design Document

## Overview
Implement support for multiple ticket types (Regular, VIP, VVIP, etc.) per event with different prices and quantities.

## Data Structure

### Smart Contract Level

#### TicketType Struct (New)
```solidity
struct TicketType {
    uint256 typeId;           // Unique ID within the event
    string name;              // "Regular", "VIP", "VVIP", etc.
    uint256 price;            // Price in wei
    uint256 maxSupply;        // Maximum tickets for this type
    uint256 sold;             // Number sold
    bool active;              // Can be purchased
}
```

#### Updated EventData Struct
```solidity
struct EventData {
    uint256 eventId;
    address organizer;
    string metadataURI;
    uint256 ticketTypesCount;     // Number of ticket types
    uint256 maxTickets;            // Total across all types (calculated)
    uint256 ticketsSold;           // Total sold across all types
    uint256 maxTicketsPerWallet;
    uint256 resalePriceCap;
    uint256 resaleDeadline;
    bool primarySaleActive;
    bool resaleActive;
    bool cancelled;
}
```

#### Updated TicketData Struct
```solidity
struct TicketData {
    uint256 eventId;
    uint256 ticketTypeId;      // Reference to ticket type
    uint256 originalPrice;
    uint8 resaleCount;
    uint8 maxResaleCount;
    bool redeemed;
    bool active;
}
```

#### New Mappings
```solidity
// eventId => typeId => TicketType
mapping(uint256 => mapping(uint256 => TicketType)) public ticketTypes;

// eventId => typeId => buyer => quantity purchased
mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public ticketsPurchasedByType;
```

### Metadata Level (JSON)

#### Event Metadata
```json
{
  "title": "Web3 Conference 2025",
  "description": "Annual blockchain conference",
  "venue": "Jakarta Convention Center",
  "startDate": "2025-01-15T09:00:00Z",
  "endDate": "2025-01-17T18:00:00Z",
  "imageUrl": "https://...",
  "ticketTypes": [
    {
      "typeId": 0,
      "name": "Regular",
      "description": "Standard admission",
      "priceIDR": 500000,
      "maxSupply": 1000,
      "benefits": ["Event access", "Digital certificate"]
    },
    {
      "typeId": 1,
      "name": "VIP",
      "description": "Premium experience",
      "priceIDR": 1500000,
      "maxSupply": 200,
      "benefits": ["Event access", "VIP lounge", "Meet & greet", "Exclusive swag"]
    },
    {
      "typeId": 2,
      "name": "VVIP",
      "description": "Ultimate package",
      "priceIDR": 5000000,
      "maxSupply": 50,
      "benefits": ["All VIP benefits", "Private dinner", "Backstage access", "Premium seating"]
    }
  ]
}
```

#### Ticket Metadata
```json
{
  "eventId": 1,
  "ticketTypeId": 1,
  "ticketTypeName": "VIP",
  "tokenId": 123,
  "holder": "0x...",
  "mintedAt": "2024-12-01T10:30:00Z",
  "originalPrice": 1500000,
  "qrCode": "https://..."
}
```

## Smart Contract Changes

### New Functions

#### 1. createEventWithTypes
```solidity
function createEventWithTypes(
    string memory metadataURI,
    TicketTypeInput[] memory types,
    uint256 maxTicketsPerWallet,
    uint256 resalePriceCap,
    uint256 resaleDeadline
) external returns (uint256)
```

**TicketTypeInput:**
```solidity
struct TicketTypeInput {
    string name;
    uint256 price;
    uint256 maxSupply;
}
```

#### 2. addTicketType
```solidity
function addTicketType(
    uint256 eventId,
    string memory name,
    uint256 price,
    uint256 maxSupply
) external onlyEventOrganizer(eventId)
```

#### 3. updateTicketType
```solidity
function updateTicketType(
    uint256 eventId,
    uint256 typeId,
    uint256 price,
    uint256 maxSupply,
    bool active
) external onlyEventOrganizer(eventId)
```

#### 4. buyTicketByType
```solidity
function buyTicketByType(
    uint256 eventId,
    uint256 ticketTypeId,
    string memory ticketMetadataURI
) external payable returns (uint256)
```

#### 5. getTicketType
```solidity
function getTicketType(uint256 eventId, uint256 typeId) 
    external view returns (TicketType memory)
```

#### 6. getEventTicketTypes
```solidity
function getEventTicketTypes(uint256 eventId) 
    external view returns (TicketType[] memory)
```

### Modified Functions

- `createEvent` - Deprecated, kept for backward compatibility
- `buyTicket` - Modified to require `ticketTypeId` parameter
- `getEvent` - Now includes `ticketTypesCount`

## Frontend Changes

### Create Event Page

**UI Components:**
1. **Ticket Types Manager**
   - Add ticket type button
   - List of ticket types (name, price, quantity)
   - Edit/Delete actions for each type
   - Drag to reorder (optional)

**Form State:**
```typescript
interface TicketType {
  id: string;           // Temporary client ID
  name: string;         // "Regular", "VIP", etc.
  priceIDR: number;
  maxSupply: number;
  description: string;  // Optional
  benefits: string[];   // Optional
}

const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
  {
    id: 'default',
    name: 'Regular',
    priceIDR: 50000,
    maxSupply: 1000,
    description: '',
    benefits: []
  }
]);
```

**Validation:**
- At least 1 ticket type required
- Each type must have valid name, price > 0, supply > 0
- No duplicate names
- Total supply must be reasonable (< 1,000,000)

### Event Detail Page

**Display:**
```tsx
<div className="grid gap-4">
  {ticketTypes.map((type) => (
    <div key={type.typeId} className="dp-surface p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{type.name}</h3>
          <p className="text-sm text-muted">{type.description}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">Rp {type.priceIDR.toLocaleString()}</p>
          <p className="text-sm">
            {type.sold}/{type.maxSupply} sold
          </p>
        </div>
      </div>
      {type.sold >= type.maxSupply ? (
        <button disabled className="dp-btn-secondary opacity-40">
          Sold Out
        </button>
      ) : (
        <button onClick={() => navigate(`/purchase?type=${type.typeId}`)}>
          Buy Ticket
        </button>
      )}
    </div>
  ))}
</div>
```

### Purchase Page

**Flow:**
1. Show all available ticket types
2. User selects ticket type
3. Enter quantity (respecting per-wallet limit)
4. Show total price
5. Confirm & purchase

**Ticket Type Selector:**
```tsx
<div className="space-y-3">
  {availableTypes.map((type) => (
    <button
      key={type.typeId}
      onClick={() => setSelectedType(type)}
      className={`w-full p-4 rounded-lg border-2 ${
        selectedType?.typeId === type.typeId
          ? 'border-accent bg-accent/10'
          : 'border-border'
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold">{type.name}</h4>
          <p className="text-sm text-muted">
            {type.maxSupply - type.sold} available
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">Rp {type.priceIDR.toLocaleString()}</p>
          <p className="text-xs text-muted">≈ {type.pricePOL} POL</p>
        </div>
      </div>
    </button>
  ))}
</div>
```

### My Tickets Page

**Display Ticket Type:**
```tsx
<div className="dp-badge">{ticket.typeName}</div>
```

**Color Coding:**
- Regular: Gray
- VIP: Gold
- VVIP: Purple
- Custom: Use event theme color

### Resale Marketplace

**Filter by Type:**
```tsx
<div className="flex gap-2 mb-4">
  <button onClick={() => setTypeFilter('all')}>All Types</button>
  {ticketTypes.map(type => (
    <button key={type.typeId} onClick={() => setTypeFilter(type.typeId)}>
      {type.name}
    </button>
  ))}
</div>
```

## Migration Strategy

### Phase 1: Backward Compatibility
- Keep old `createEvent` function working
- Auto-create single "General Admission" ticket type for old events
- Old `buyTicket` calls use typeId = 0

### Phase 2: New Features
- Add `createEventWithTypes` for new events
- Frontend defaults to multiple ticket types
- Migration tool for organizers to upgrade old events

### Phase 3: Deprecation
- Mark old functions as deprecated
- All new events must use ticket types
- Display warning for old single-type events

## Benefits Analysis

### For Organizers
- ✅ Segment audiences (Regular, VIP, VVIP)
- ✅ Tiered pricing strategies
- ✅ Control supply per tier
- ✅ Better revenue optimization
- ✅ Marketing flexibility

### For Buyers
- ✅ Clear tier differences
- ✅ Choose based on budget
- ✅ Know exactly what they're getting
- ✅ Fair allocation per tier

### Technical
- ✅ Same anti-scalping rules apply per type
- ✅ Resale cap applies to original tier price
- ✅ Each tier tracked independently
- ✅ Single contract manages all types

## Edge Cases

1. **Sold Out Tier**: Other tiers still available
2. **Price Changes**: Only affect new purchases, not minted tickets
3. **Tier Limits**: Per-wallet limit applies across all tiers
4. **Resale**: Maintains original tier identity
5. **Refunds**: Based on original purchase price per tier
6. **Redemption**: All tiers valid for entry (unless specified)

## Gas Optimization

- Store ticket types in nested mapping (not array)
- Lazy initialization of ticket type data
- Batch operations where possible
- Events emit only necessary data

## Security Considerations

- ✅ Only organizer can add/modify ticket types
- ✅ Cannot modify types after sales started
- ✅ Total supply cannot exceed uint256 limits
- ✅ Price must be > 0 for active types
- ✅ Cannot delete types with sold tickets

## Testing Checklist

- [ ] Create event with 1 ticket type
- [ ] Create event with 3+ ticket types
- [ ] Buy ticket of each type
- [ ] Reach supply limit per type
- [ ] Respect per-wallet limit across types
- [ ] Resale maintains tier identity
- [ ] Refund correct amount per tier
- [ ] Event cancellation affects all types
- [ ] Gate redemption works for all tiers
- [ ] Metadata correctly stored/retrieved

## Implementation Order

1. ✅ Design data structures (this document)
2. Smart contract modifications
3. Create event UI
4. Purchase flow updates
5. Event detail display
6. My tickets page updates
7. Resale marketplace updates
8. Testing & deployment

## Next Steps

1. Review and approve design
2. Update smart contract
3. Deploy to testnet
4. Update frontend components
5. Integration testing
6. Documentation updates
7. User acceptance testing
