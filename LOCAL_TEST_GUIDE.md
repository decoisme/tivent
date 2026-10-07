# Local Testing Guide

Kalau Vercel masih blocking, kita bisa test di local dulu untuk verify code bekerja.

## Prerequisites

- ✅ `.env.local` sudah ada semua env vars
- ✅ Supabase accessible
- ✅ Platform wallet has POL

## Test Locally

### 1. Start Local Dev Server

```powershell
npm run dev
```

Server akan jalan di `http://localhost:3000`

### 2. Test Local API Endpoints

**Test Status Endpoint:**
```powershell
curl http://localhost:3000/api/payment/xendit/status?externalId=TIVENT-1-1791394621711-ofl88m
```

**Test Manual Mint (Local):**
```powershell
$body = @{ externalId = "TIVENT-1-1791394621711-ofl88m" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/payment/manual-mint" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10
```

### 3. Check Logs

Local dev server akan show detailed logs di console:
- `[manual-mint] Processing: ...`
- `[manual-mint] Platform wallet balance: 20 POL`
- `[manual-mint] Step 1: Buying ticket...`
- `[manual-mint] Step 2: Transferring ticket...`
- `[manual-mint] ✅ Ticket successfully minted and transferred!`

## Common Issues

### Issue: PLATFORM_PRIVATE_KEY not found

**Fix:** Check `.env.local` has:
```env
PLATFORM_PRIVATE_KEY=feb552c3b93927f239fc657242c171c7299c00b8cb37f9d0f4c725c737b0b799
PLATFORM_WALLET_ADDRESS=0x60c55981C17DEcd200683ff0F85124199EC6eb08
```

### Issue: Payment not found

**Fix:** Cek di Supabase, pastikan payment record ada dengan `external_id` yang benar.

### Issue: Email not verified

**Fix:** Update database manual:
```sql
UPDATE payments 
SET email_verified = true, 
    verified_at = now(),
    status = 'VERIFIED'
WHERE external_id = 'TIVENT-1-1791394621711-ofl88m';
```

### Issue: No wallet address

**Fix:** Update database dengan test wallet:
```sql
UPDATE payments 
SET buyer_address = '0xYourTestWallet'
WHERE external_id = 'TIVENT-1-1791394621711-ofl88m';
```

## Local Testing Benefits

1. **Faster iteration** - No deployment wait time
2. **Better logging** - See all console logs
3. **Easy debugging** - Can use breakpoints
4. **Verify code works** - Before dealing with Vercel issues

## Once Local Works

Then focus on fixing Vercel:
1. Add env vars
2. Disable protection
3. Redeploy
4. Test production

---

**Note:** Local testing confirms the **code logic** is correct. Vercel issues are purely **configuration/deployment** problems.
