# Platform Wallet Setup Guide

Platform wallet adalah wallet yang digunakan oleh backend untuk automatically mint NFT tickets setelah user melakukan pembayaran fiat melalui Xendit.

## 🎯 Purpose

When users pay with fiat (IDR) via Xendit, they don't directly interact with the blockchain. The platform wallet:
1. Receives payment confirmation from Xendit webhook
2. Pays gas fees to mint the NFT ticket
3. Transfers the minted ticket to the buyer's wallet address

## 📋 Prerequisites

- A wallet with sufficient POL balance for gas fees
- Private key from that wallet
- Wallet must be on Polygon Amoy testnet

## 🔐 Security Warning

**⚠️ CRITICAL: Never commit platform wallet private key to git!**

The platform wallet private key must be:
- Stored securely in environment variables
- Never logged or displayed
- Rotated regularly
- Backed up securely

## 🚀 Setup Instructions

### Step 1: Create Platform Wallet

You have 3 options:

#### Option A: Use Existing Wallet (Quick)
If you already have a wallet with POL on Amoy testnet:

1. Export private key from MetaMask:
   - Open MetaMask
   - Click account icon → Account Details
   - Click "Show Private Key"
   - Enter password
   - Copy the private key (64 characters, without 0x prefix)

#### Option B: Create New Wallet (Recommended for Production)
```bash
# Go to contracts directory
cd contracts

# Run wallet generator script
npm run generate-wallet
```

This will create:
- New wallet address
- Private key
- Mnemonic phrase (backup)

#### Option C: Use Hardhat (Development Only)
```javascript
// Use one of Hardhat's test accounts
// These are PUBLIC keys - never use in production!
```

### Step 2: Fund Platform Wallet

The platform wallet needs POL for gas fees.

**Estimated costs:**
- Mint 1 ticket: ~0.001 POL
- Recommended balance: 1-10 POL (for 1000-10000 tickets)

**Get test POL on Amoy:**
1. Go to https://faucet.polygon.technology/
2. Select "Polygon Amoy"
3. Enter your platform wallet address
4. Request tokens

### Step 3: Configure Environment Variables

Add to `.env.local`:

```env
# Platform Wallet Configuration
PLATFORM_PRIVATE_KEY=your_private_key_without_0x_prefix
PLATFORM_WALLET_ADDRESS=0xYourPlatformWalletAddress
```

**Example:**
```env
PLATFORM_PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
PLATFORM_WALLET_ADDRESS=0x1234567890123456789012345678901234567890
```

### Step 4: Verify Setup

Run the verification script:

```bash
# Test platform wallet connection
npm run test:platform-wallet
```

This will:
- ✅ Check if private key is valid
- ✅ Verify wallet balance
- ✅ Test contract connection
- ✅ Simulate a mint transaction (without executing)

## 🔄 How It Works

### Automatic Minting Flow

```
User pays via Xendit
    ↓
Xendit sends webhook to /api/payment/xendit/webhook
    ↓
Webhook verifies payment status = 'PAID'
    ↓
Platform wallet calls contract.buyTicket()
    ↓
Platform wallet pays gas fee
    ↓
NFT ticket minted to buyer's wallet
    ↓
Database updated: ticket_minted = true, tx_hash saved
```

### Code Implementation

The minting logic is in `/src/app/api/payment/xendit/webhook/route.ts`:

```typescript
async function mintTicketWithPlatformWallet(
  eventId: number,
  ticketTypeId: number,
  buyerAddress: string
) {
  // Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PLATFORM_PRIVATE_KEY!, provider);
  
  // Initialize contract
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  
  // Get ticket price
  const ticketType = await contract.getTicketType(eventId, ticketTypeId);
  const ticketPrice = ticketType.price;
  
  // Mint ticket (platform pays gas, ticket goes to buyer)
  const tx = await contract.buyTicket(
    eventId,
    ticketTypeId,
    ticketMetadataURI,
    {
      value: ticketPrice,
      gasLimit: 500000,
    }
  );
  
  await tx.wait();
  return { success: true, txHash: tx.hash };
}
```

## 🛠️ Maintenance

### Monitor Platform Wallet Balance

Create a monitoring script that alerts when balance is low:

```bash
# Check balance
npm run check:platform-wallet-balance
```

If balance < 0.1 POL, you'll get a warning.

### Refill Platform Wallet

When balance is low:
1. Send POL from your main wallet
2. Or use faucet (testnet only)
3. Or transfer from revenue wallet (mainnet)

### Rotate Private Key

For security, rotate the platform wallet every 3-6 months:

1. Create new platform wallet
2. Fund it with POL
3. Update environment variables
4. Test on staging environment
5. Deploy to production
6. Drain old wallet

### Handle Failed Minting

If automatic minting fails, use the retry script:

```bash
# Retry failed minting for a specific payment
npm run retry:mint -- --external-id TIVENT-123-456-789
```

## 📊 Monitoring & Logging

### Check Minting Success Rate

```sql
-- Supabase query
SELECT 
  COUNT(*) FILTER (WHERE ticket_minted = TRUE) as successful,
  COUNT(*) FILTER (WHERE ticket_minted = FALSE AND status = 'PAID') as failed,
  COUNT(*) as total
FROM payments
WHERE status = 'PAID';
```

### View Failed Minting Attempts

```sql
SELECT 
  external_id,
  buyer_address,
  event_id,
  mint_error,
  created_at
FROM payments
WHERE status = 'PAID' AND ticket_minted = FALSE
ORDER BY created_at DESC;
```

## ⚠️ Common Issues

### Issue 1: "Insufficient funds for gas"
**Solution:** Fund platform wallet with more POL

### Issue 2: "Transaction reverted"
**Possible causes:**
- Event sold out
- Buyer's wallet limit exceeded
- Event cancelled
- Contract paused

**Solution:** Check contract state and error message

### Issue 3: "Invalid private key"
**Solution:** 
- Verify private key format (64 hex characters)
- Ensure no 0x prefix
- Check for extra spaces or newlines

### Issue 4: Webhook not triggering
**Solution:**
- Verify Xendit webhook URL is correct
- Check webhook token matches
- Review server logs

## 🔒 Security Best Practices

1. **Never expose private key**
   - Don't log it
   - Don't send it in API responses
   - Don't store in frontend code

2. **Use separate wallets**
   - Platform wallet (for minting)
   - Treasury wallet (for holding revenue)
   - Owner wallet (for contract management)

3. **Set spending limits**
   - Keep only necessary POL in platform wallet
   - Refill regularly instead of holding large amounts

4. **Monitor transactions**
   - Set up alerts for unusual activity
   - Review transaction history daily

5. **Regular audits**
   - Check for failed minting attempts
   - Verify gas costs are reasonable
   - Ensure no duplicate minting

## 🧪 Testing

### Test on Staging

Before deploying to production:

1. Create test payment in Xendit sandbox
2. Trigger webhook manually
3. Verify ticket is minted correctly
4. Check database records
5. Confirm buyer receives ticket

### Manual Testing Script

```bash
# Test minting with platform wallet
cd contracts
npx hardhat run scripts/test-platform-mint.js --network amoy
```

## 📝 Environment Variables Checklist

Make sure these are set in production:

- [ ] `PLATFORM_PRIVATE_KEY` - Platform wallet private key
- [ ] `PLATFORM_WALLET_ADDRESS` - Platform wallet address
- [ ] `NEXT_PUBLIC_RPC_URL` - Polygon Amoy RPC URL
- [ ] `NEXT_PUBLIC_CONTRACT_ADDRESS` - EventTicketing contract address
- [ ] `XENDIT_SECRET_KEY` - Xendit API secret key
- [ ] `XENDIT_WEBHOOK_TOKEN` - Xendit webhook verification token

## 🚀 Deployment Checklist

Before going live:

- [ ] Platform wallet created and funded
- [ ] Environment variables configured
- [ ] Webhook URL registered in Xendit dashboard
- [ ] Test payment successful
- [ ] Monitoring setup (balance alerts, failed minting alerts)
- [ ] Backup private key stored securely
- [ ] Documentation updated
- [ ] Team trained on troubleshooting procedures

## 📞 Support

If you encounter issues:

1. Check server logs: `npm run logs:production`
2. Check Supabase logs for database errors
3. Check PolygonScan for transaction details
4. Review Xendit dashboard for webhook logs

For help: support@tivent.com
