# Vercel Environment Variables Setup

## Missing Environment Variables ⚠️

Platform wallet environment variables **belum diset di Vercel**, sehingga API minting tidak bisa berjalan.

## Required Variables

Tambahkan environment variables berikut di Vercel Dashboard:

### 1. PLATFORM_PRIVATE_KEY
```
feb552c3b93927f239fc657242c171c7299c00b8cb37f9d0f4c725c737b0b799
```
- **Environment**: Production, Preview, Development
- **Required for**: NFT minting after payment

### 2. PLATFORM_WALLET_ADDRESS
```
0x60c55981C17DEcd200683ff0F85124199EC6eb08
```
- **Environment**: Production, Preview, Development  
- **Required for**: Identifying platform wallet in logs

## Setup Instructions

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/decoismes-projects/tivent/settings/environment-variables

2. Click **"Add New"**

3. Add `PLATFORM_PRIVATE_KEY`:
   - **Name**: `PLATFORM_PRIVATE_KEY`
   - **Value**: `feb552c3b93927f239fc657242c171c7299c00b8cb37f9d0f4c725c737b0b799`
   - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**

4. Add `PLATFORM_WALLET_ADDRESS`:
   - **Name**: `PLATFORM_WALLET_ADDRESS`
   - **Value**: `0x60c55981C17DEcd200683ff0F85124199EC6eb08`
   - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**

5. **Redeploy** the latest commit:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Select **"Use existing Build Cache"**
   - Click **"Redeploy"**

### Option B: Via Vercel CLI

```bash
# Add PLATFORM_PRIVATE_KEY
vercel env add PLATFORM_PRIVATE_KEY production preview development
# When prompted, paste: feb552c3b93927f239fc657242c171c7299c00b8cb37f9d0f4c725c737b0b799

# Add PLATFORM_WALLET_ADDRESS
vercel env add PLATFORM_WALLET_ADDRESS production preview development
# When prompted, paste: 0x60c55981C17DEcd200683ff0F85124199EC6eb08

# Trigger redeploy
vercel --prod
```

## Vercel Deployment Protection

⚠️ **Current Issue**: Deployment URL is protected with Vercel Authentication

Response saat access API:
```json
{
  "protection": {
    "vercel_auth_enabled": true
  },
  "message": "Protected by Vercel Authentication",
  "error": {
    "message": "Protected deployment",
    "code": "401"
  }
}
```

### Fix: Disable Protection for API Routes

1. Go to https://vercel.com/decoismes-projects/tivent/settings/protection

2. **Option A**: Disable protection entirely (not recommended for production)
   - Toggle off "Vercel Authentication"

3. **Option B**: Whitelist API routes (recommended)
   - Under "Protection Bypass for Automation"
   - Add paths:
     - `/api/payment/*`
     - `/api/test-email`
     - Add protection bypass secret to webhook headers

4. **Option C**: Use Production domain only
   - Keep preview deployments protected
   - Ensure `tivent.vercel.app` (production) is accessible
   - Update Xendit webhook to use production URL only

## After Setup

Once environment variables are added and protection is configured:

### 1. Verify environment variables are set:
```bash
vercel env ls
```

Should show:
- ✅ PLATFORM_PRIVATE_KEY
- ✅ PLATFORM_WALLET_ADDRESS

### 2. Test API endpoint:
```bash
curl "https://tivent.vercel.app/api/payment/xendit/status?externalId=TIVENT-1-1791394621711-ofl88m"
```

Should return JSON payment data (not HTML).

### 3. Test manual mint:
```bash
curl -X POST "https://tivent.vercel.app/api/payment/manual-mint" \
  -H "Content-Type: application/json" \
  -d '{"externalId":"TIVENT-1-1791394621711-ofl88m"}'
```

Should return:
```json
{
  "success": true,
  "message": "Ticket minted and transferred successfully!",
  "token_id": "1",
  "buy_tx_hash": "0x...",
  "transfer_tx_hash": "0x..."
}
```

## Testing Checklist

After setup complete:

- [ ] Environment variables added to Vercel
- [ ] Deployment redeployed with new env vars
- [ ] API protection configured (bypassed or disabled)
- [ ] `/api/payment/xendit/status` endpoint accessible
- [ ] `/api/payment/manual-mint` endpoint working
- [ ] Platform wallet has POL (check: https://amoy.polygonscan.com/address/0x60c55981C17DEcd200683ff0F85124199EC6eb08)
- [ ] Full payment flow tested: Payment → Email verify → Auto-mint
- [ ] Ticket appears in buyer's wallet
- [ ] Ticket appears in "My Tickets" page

## Next Steps

1. **Add env vars** (via Dashboard or CLI)
2. **Redeploy** to apply changes
3. **Configure protection** (whitelist API routes)
4. **Test** with `.\test-manual-mint.ps1`
5. **Verify** full payment flow

---

**Current Status**: 
- ❌ PLATFORM_PRIVATE_KEY not set in Vercel
- ❌ PLATFORM_WALLET_ADDRESS not set in Vercel
- ❌ Deployment protected (401 on API calls)
- ✅ Platform wallet has 20 POL
- ✅ Code deployed to GitHub
- ✅ Latest deployment ready

**Blocking**: Environment variables + deployment protection
