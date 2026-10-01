# Tivent Smart Contracts

Solidity smart contracts for the Tivent decentralized event ticketing platform.

## Overview

The EventTicketing contract implements an ERC-721 NFT-based ticketing system with:
- Event creation and management
- Ticket minting and ownership
- Atomic resale marketplace with escrow
- Anti-scalping rules (purchase limits, price caps, deadlines)
- Ticket redemption tracking
- Event cancellation and refund logic

## Contract Architecture

### EventTicketing.sol

Main contract inheriting from:
- `ERC721` - NFT standard for ticket ownership
- `ERC721URIStorage` - Metadata storage
- `Ownable` - Access control
- `ReentrancyGuard` - Protection against reentrancy attacks

### Key Data Structures

```solidity
struct EventData {
    uint256 eventId;
    address organizer;
    string metadataURI;
    uint256 ticketPrice;
    uint256 maxTickets;
    uint256 ticketsSold;
    uint256 maxTicketsPerWallet;
    uint256 resalePriceCap;      // Basis points (10000 = 100%)
    uint256 resaleDeadline;      // Unix timestamp
    bool primarySaleActive;
    bool resaleActive;
    bool cancelled;
}

struct TicketData {
    uint256 eventId;
    uint256 ticketTypeId;
    uint256 originalPrice;
    bool redeemed;
    bool active;
}

struct Listing {
    uint256 ticketId;
    address seller;
    uint256 price;
    bool active;
}
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your configuration to `.env`:
- RPC URL for testnet
- Private key for deployment
- Etherscan API key for verification

## Commands

### Compile contracts
```bash
npm run compile
```

### Run tests
```bash
npm run test
```

### Generate coverage report
```bash
npm run test:coverage
```

### Deploy to local network
Start local node:
```bash
npm run node
```

In another terminal:
```bash
npm run deploy:local
```

### Deploy to Sepolia testnet
```bash
npm run deploy:sepolia
```

## Testing

Comprehensive tests cover:
- ✅ Event creation and configuration
- ✅ Ticket minting and purchase
- ✅ Purchase limits per wallet
- ✅ Resale listing and cancellation
- ✅ Resale price cap enforcement
- ✅ Resale deadline enforcement
- ✅ Atomic escrow transactions
- ✅ Ticket redemption
- ✅ Double redemption prevention
- ✅ Event cancellation
- ✅ Refund claims
- ✅ Access control
- ✅ Reentrancy protection

## Security Features

### Access Control
- Event creators can manage their events
- Only gate officers can redeem tickets
- Owner can pause/unpause system

### Anti-Scalping
- `maxTicketsPerWallet` - Purchase limit per address
- `resalePriceCap` - Maximum resale markup (e.g., 110% = 11000 basis points)
- `resaleDeadline` - Cutoff timestamp for resales
- Optional resale count limits per ticket

### Safety
- ReentrancyGuard on all payment functions
- Checks-effects-interactions pattern
- Input validation on all parameters
- SafeERC20 for token transfers
- No manual payment confirmations

## Events

```solidity
event EventCreated(uint256 indexed eventId, address indexed organizer, string metadataURI);
event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed buyer);
event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
event TicketDelisted(uint256 indexed tokenId);
event TicketResold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
event TicketRedeemed(uint256 indexed tokenId, address indexed holder);
event EventCancelled(uint256 indexed eventId);
event RefundClaimed(uint256 indexed tokenId, address indexed holder, uint256 amount);
```

## Gas Optimization

- Struct packing for storage efficiency
- Batch operations where possible
- Minimal storage reads
- Events for off-chain indexing

## Upgradeability

The MVP uses a non-upgradeable contract for security and simplicity. Future versions may implement:
- UUPS proxy pattern
- Diamond standard for modularity

## Audit Status

⚠️ **Not Audited** - This is a development version. Professional security audit required before mainnet deployment.

## License

MIT License
