# Free Minting Implementation - Testing Guide

## ✅ What's Done

1. **Smart Contract Updated**
   - Added `mintTicketFree()` function
   - Deployed to: `0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB`
   - Network: Polygon Amoy Testnet
   
2. **Backend Updated**
   - `mintTicketWithPlatformWallet()` now uses `mintTicketFree()`
   - Single-step minting (no buy + transfer)
   - Only pays gas (~0.002 POL = ~$0.001 USD)

3. **ABI Updated**
   - Added `mintTicketFree` function to contractReads.ts
   - Contract address updated in .env.local

## 🧪 How to Test

### Step 1: Create Test Event

Since this is a new contract, you need to create an event first:

**Option A: Via Web UI (Recommended)**
1. Go to http://localhost:3000/create-event (or your Vercel URL)
2. Connect wallet: `0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77`
3. Create event with:
   - Event Name: "Test Event"
   - Ticket Type: "General Admission"
   - Price POL: 0.025 (doesn't matter - users don't pay this)
   - Price IDR: 125000
   - Max Supply: 100
   - Max per wallet: 10
4. Note the Event ID (will be #1)

**Option B: Via Hardhat Script**
```bash
cd contracts
npx hardhat run scripts/create-event.js --network amoy
```

### Step 2: Update Test Endpoint

Edit `src/app/api/payment/test-auto-mint/route.ts` and change `eventId: 2` to `eventId: 1`

Or just test with Event ID 1:

```powershell
$body = @{
    eventId = 1  # Change this to your event ID
    ticketTypeId = 0
    buyerAddress = "0xA167fBfD1d0b4eC46b5CddA6ec545f12B92B8a77"
    buyerEmail = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/test-auto-mint" `
    -Method Post -Body $body -ContentType "application/json"
```

### Step 3: Run Full Test

```powershell
.\test-auto-mint-endpoint.ps1
```

This will:
1. Create test payment (status: PAID)
2. Generate verification token
3. Click verification link → trigger auto-mint
4. Check final status

### Step 4: Verify Results

**Expected Outcome:**
```
Email Verified: True
Ticket Minted: True
Token ID: 1 (or higher)
TX Hash: 0x...
```

**Check on PolygonScan:**
```
https://amoy.polygonscan.com/tx/<TX_HASH>
```

**Check Gas Cost in Logs:**
Look for: `[mintTicket] 💸 Gas cost: ~0.002 POL (~$0.001 USD)`

## 💰 Cost Comparison

### Old Implementation (buyTicket + transfer):
- Ticket Price: 27.3 POL (~$13.65 USD)
- Gas: ~0.5 POL (~$0.25 USD)
- **Total Platform Cost: ~27.8 POL (~$13.90 USD per ticket)** ❌

### New Implementation (mintTicketFree):
- Ticket Price: **0 POL** ✅
- Gas: ~0.002 POL (~$0.001 USD)
- **Total Platform Cost: ~0.002 POL (~$0.001 USD per ticket)** ✅

### Per 1000 Tickets:
- Old: ~27,800 POL (~$13,900 USD) ❌
- New: ~2 POL (~$1 USD) ✅
- **Savings: 99.99%!** 🎉

## 📊 Business Model

**Revenue per ticket:**
- User pays: Rp 125,000 (via Xendit)
- Platform cost: Rp 500 (gas only)
- **Platform profit: Rp 124,500 (~99.6% margin)** ✅

**Sustainable & Scalable!**

## 🔍 Troubleshooting

### Ticket not minting?

1. **Check Vercel Logs:**
   - Look for `[verify-email] TRIGGERING AUTO-MINT`
   - Look for `[mintTicket] Starting FREE mint process...`
   - Check for error messages

2. **Check Platform Wallet Balance:**
   ```
   Address: 0x60c55981C17DEcd200683ff0F85124199EC6eb08
   Minimum: 0.01 POL for gas
   ```

3. **Check Event Exists:**
   ```
   Contract: 0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB
   Event must exist in THIS contract (not old contract)
   ```

4. **Check Payment Status:**
   ```powershell
   Invoke-RestMethod -Uri "https://tivent-chi.vercel.app/api/payment/xendit/status?externalId=<EXTERNAL_ID>"
   ```
   Look for `mint_error` field

## 🎯 Next Steps

After successful test:

1. **Create real events** in the new contract via web UI
2. **Update event prices** - set priceIDR for real fiat amounts
3. **Top up platform wallet** with ~10 POL for production (enough for ~5000 tickets)
4. **Test full payment flow** with real Xendit payment
5. **Monitor gas costs** in production logs

## 📝 Notes

- Old contract address: `0xB0637912f3e017542F8d6E7759F1D0bF3f21e678` (deprecated)
- New contract address: `0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB` (active)
- Events in old contract won't work with new code
- Need to recreate events in new contract
