# Update Vercel Environment Variable

## 🔴 Problem

Backend is calling OLD contract address:
- Current (wrong): `0xB0637912f3e017542F8d6E7759F1D0bF3f21e678`
- Should be (new): `0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB`

## ✅ Solution

Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in Vercel:

### Step 1: Go to Vercel Dashboard

1. Go to: https://vercel.com/
2. Select your project: **tivent**
3. Go to: **Settings** → **Environment Variables**

### Step 2: Update Variable

Find `NEXT_PUBLIC_CONTRACT_ADDRESS` and:

**Old Value:**
```
0xB0637912f3e017542F8d6E7759F1D0bF3f21e678
```

**New Value:**
```
0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB
```

### Step 3: Apply to All Environments

Make sure to update for:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 4: Redeploy

After updating the env var:

**Option A: Trigger via Git**
```powershell
git commit --allow-empty -m "Trigger redeploy with new contract address"
git push
```

**Option B: Redeploy in Vercel Dashboard**
1. Go to **Deployments**
2. Find latest deployment
3. Click **...** → **Redeploy**

### Step 5: Wait for Deployment

Wait ~1-2 minutes for deployment to complete.

### Step 6: Test Again

After deployment completes:

```powershell
.\test-auto-mint-endpoint.ps1
```

Expected result:
```
✓ Email Verified: True
✓ Ticket Minted: True
✓ Token ID: 1
✓ TX Hash: 0x...
✓ Gas cost: ~0.002 POL (~$0.001 USD)
```

## 📝 Verify Contract Address

After redeploy, check which contract is being used:

```powershell
# Check via test endpoint
curl "https://tivent-chi.vercel.app/api/test-contract-address"
```

Or check Vercel logs - should show:
```
[mintTicket] Calling contract: 0x35206B197Ed1293343Eaf44F7dbE268B7C109FaB
```

## ⚠️ Important

After this update:
- All NEW tickets will mint to NEW contract ✅
- Old events (Event ID 2) won't work anymore (they're in old contract)
- Use Event ID 1 (from new contract) for testing

## 🎯 After Successful Test

1. Create production events via web UI (will be in new contract)
2. Set real priceIDR values
3. Top up platform wallet with ~10 POL (good for 5000+ tickets)
4. Test full Xendit payment flow
5. Go live! 🚀
