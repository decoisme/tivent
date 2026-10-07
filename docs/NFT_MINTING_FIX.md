# NFT Minting Fix - Transfer from Platform Wallet

## Problem

Sebelumnya, sistem minting NFT ticket mengalami masalah:
- ✅ Payment berhasil (Xendit)
- ✅ Email verification berhasil (Resend)
- ❌ Ticket NFT **tidak minted ke buyer's wallet**
- Payment status menunjukkan: `ticket_minted: false`, `tx_hash: null`

## Root Cause

Function `mintTicketWithPlatformWallet()` memanggil `contract.buyTicket()`, yang akan:
- Mint NFT ticket ke `msg.sender` (= platform wallet)
- **BUKAN** ke buyer's wallet

Dari contract `EventTicketing.sol` line 317:
```solidity
_safeMint(msg.sender, tokenId); // Mints to caller (platform wallet)
```

## Solution

Menggunakan **2-step minting process**:

### Step 1: Mint to Platform Wallet
```typescript
const buyTx = await contract.buyTicket(
  eventId,
  ticketTypeId,
  metadataURI,
  { value: ticketPrice }
);
```
- Platform wallet membeli ticket (bayar dengan POL)
- NFT di-mint ke platform wallet
- Dapat tokenId dari transaction logs

### Step 2: Transfer to Buyer
```typescript
const transferTx = await contract.transferFrom(
  platformWallet,  // from
  buyerAddress,    // to
  tokenId          // token
);
```
- Platform wallet transfer NFT ke buyer
- Verify ownership setelah transfer
- Simpan transfer TX hash ke database

## Contract Requirements

Contract harus support `transferFrom()` (standard ERC-721):
```solidity
function transferFrom(address from, address to, uint256 tokenId) external;
```

✅ EventTicketing.sol sudah inherit dari OpenZeppelin ERC721, jadi sudah support.

## Implementation Files

### Updated Files:
1. **`src/app/api/payment/xendit/webhook/route.ts`**
   - Function `mintTicketWithPlatformWallet()` updated
   - Tambah step transfer ke buyer
   - Enhanced logging untuk debugging

2. **`src/app/api/payment/manual-mint/route.ts`** (NEW)
   - Manual mint endpoint untuk debugging
   - POST dengan body `{ externalId: "TIVENT-xxx" }`
   - Returns both buy & transfer TX hashes

3. **`src/app/api/payment/xendit/verify-email/route.ts`**
   - Auto-mint trigger after email verification
   - Calls `mintTicketWithPlatformWallet()` from webhook

## Testing

### Manual Mint Test (Debugging)
```bash
POST https://tivent.vercel.app/api/payment/manual-mint
Content-Type: application/json

{
  "externalId": "TIVENT-1-1791394621711-ofl88m"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Ticket minted and transferred successfully!",
  "token_id": "1",
  "buy_tx_hash": "0xabc...",
  "transfer_tx_hash": "0xdef...",
  "buy_tx_url": "https://amoy.polygonscan.com/tx/0xabc...",
  "transfer_tx_url": "https://amoy.polygonscan.com/tx/0xdef..."
}
```

### Full Flow Test
1. Create payment → Xendit invoice
2. Pay invoice → Webhook triggered
3. Email verification link sent
4. Click verification link → Auto-mint triggered
5. Check database: `ticket_minted: true`, `tx_hash: "0x..."`
6. Check buyer wallet at https://testnets.opensea.io/
7. Check "My Tickets" page in app

## Verification Steps

1. **Check Platform Wallet Balance**
   - Visit: https://amoy.polygonscan.com/address/0x60c55981C17DEcd200683ff0F85124199EC6eb08
   - Should have ~20 POL for gas fees

2. **Check Transaction on PolygonScan**
   - Buy TX: Platform wallet → Contract (buyTicket)
   - Transfer TX: Platform wallet → Buyer (transferFrom)

3. **Check Ticket Ownership**
   ```bash
   # Query contract
   contract.ownerOf(tokenId)
   # Should return: buyer's address
   ```

4. **Check Database**
   ```sql
   SELECT 
     external_id,
     buyer_address,
     ticket_minted,
     tx_hash,
     minted_at,
     mint_error
   FROM payments
   WHERE external_id = 'TIVENT-xxx';
   ```

## Environment Requirements

- ✅ `PLATFORM_PRIVATE_KEY` - Platform wallet private key
- ✅ `PLATFORM_WALLET_ADDRESS` - Platform wallet address (0x60c55981...)
- ✅ Platform wallet funded with POL (minimum ~1 POL per ticket)
- ✅ Contract deployed on Polygon Amoy (0xB0637912...)

## Platform Wallet Funding

Get POL from faucet:
1. Visit: https://faucet.polygon.technology/
2. Select "Polygon Amoy Testnet"
3. Paste: `0x60c55981C17DEcd200683ff0F85124199EC6eb08`
4. Complete CAPTCHA and claim

Each claim gives ~0.5 POL. Ticket price is usually 0.001-0.01 POL.

## Future Improvement

Add contract function `mintTicketForUser(address buyer, ...)` to mint directly to buyer in 1 transaction instead of 2 (buy + transfer).

Contract update required:
```solidity
function mintTicketForUser(
    address buyer,
    uint256 eventId,
    uint256 ticketTypeId,
    string memory metadataURI
) external payable onlyRole(MINTER_ROLE) {
    // ... validation ...
    _safeMint(buyer, tokenId); // Direct mint to buyer
}
```

## Logs to Monitor

### Vercel Logs (Filter by):
- `[mintTicket]` - Minting process
- `[verify-email]` - Email verification
- `[manual-mint]` - Manual mint testing

### Key Log Messages:
- ✅ `Step 1: Buying ticket (minting to platform wallet)...`
- ✅ `Buy transaction confirmed in block: XXX`
- ✅ `Token ID minted: XXX`
- ✅ `Step 2: Transferring ticket to buyer...`
- ✅ `Transfer confirmed in block: XXX`
- ✅ `Ticket owner after transfer: 0x...`
- ✅ `✅ Ticket successfully minted and transferred!`

### Error Messages to Watch:
- ❌ `Platform wallet has no POL for gas fees`
- ❌ `Failed to extract tokenId from transaction logs`
- ❌ `Transfer verification failed: owner is...`

## Status

- [x] Root cause identified
- [x] Fix implemented (2-step mint+transfer)
- [x] Manual mint endpoint created
- [x] Code pushed to GitHub
- [ ] Vercel deployment completed
- [ ] Manual mint tested
- [ ] Full flow tested
- [ ] Ticket visible in My Tickets

---

**Date:** 2026-09-29  
**Developer:** Kiro + User  
**Issue:** Tickets not minting after payment  
**Status:** Fix deployed, pending testing
