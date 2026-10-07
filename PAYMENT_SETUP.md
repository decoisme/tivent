# 🚀 Xendit Payment Setup - Step by Step

## ❌ Current Problem
Payment berhasil di Xendit, tapi redirect ke success page menunjukkan "Payment Not Found"

**Root Cause:**
1. Database table `payments` belum dibuat di Supabase
2. Endpoint `/api/payment/xendit/status` mungkin belum ter-deploy di Vercel

---

## ✅ Solution: 3 Langkah Wajib

### 1️⃣ Create Database Table di Supabase (PALING PENTING!)

**Langkah:**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project: `lpnetzsaxtxmviromnww`
3. Klik menu **SQL Editor** (ikon database di sidebar)
4. Klik **New Query**
5. Copy-paste SQL ini:

```sql
-- Create payments table for tracking Xendit fiat payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Xendit reference
  external_id TEXT UNIQUE NOT NULL,
  invoice_id TEXT NOT NULL,
  invoice_url TEXT,
  
  -- Event and ticket info
  event_id INTEGER NOT NULL,
  ticket_type_id INTEGER NOT NULL,
  ticket_quantity INTEGER NOT NULL,
  
  -- Buyer info
  buyer_email TEXT NOT NULL,
  buyer_address TEXT,
  
  -- Payment amounts
  amount_idr NUMERIC NOT NULL,
  amount_eth NUMERIC NOT NULL,
  paid_amount NUMERIC,
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  
  -- Ticket minting info
  ticket_minted BOOLEAN DEFAULT FALSE,
  tx_hash TEXT,
  minted_at TIMESTAMP WITH TIME ZONE,
  mint_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_email ON payments(buyer_email);
CREATE INDEX IF NOT EXISTS idx_payments_buyer_address ON payments(buyer_address);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

6. Klik tombol **Run** (atau tekan F5)
7. Pastikan muncul **"Success. No rows returned"**

**Verifikasi:**
- Klik menu **Table Editor** di sidebar
- Lihat apakah tabel `payments` muncul
- Klik tabel → pastikan ada 16 columns

---

### 2️⃣ Cek Vercel Deployment

**Langkah:**
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik project Tivent
3. Lihat tab **Deployments**
4. Cek deployment terakhir:
   - ✅ **Ready** = deployment berhasil
   - 🔄 **Building** = masih proses
   - ❌ **Error** = deployment gagal

**Jika Deployment Gagal:**
- Klik deployment → lihat **Build Logs**
- Screenshot error logs
- Share ke saya untuk debug

**Jika Deployment Berhasil:**
- Klik **Visit** untuk buka production URL
- Test payment lagi

---

### 3️⃣ Setup Environment Variables di Vercel

**CRITICAL:** Environment variables di Vercel harus match dengan `.env.local`

**Langkah:**
1. Di Vercel Dashboard → Project Settings
2. Klik tab **Environment Variables**
3. Pastikan variables ini ada:

```bash
# Blockchain
NEXT_PUBLIC_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/alch_O6zJwZHcpZxN3W2aGTshW
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_CONTRACT_ADDRESS=0xB0637912f3e017542F8d6E7759F1D0bF3f21e678
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://lpnetzsaxtxmviromnww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Xendit (SECRET - jangan share!)
XENDIT_SECRET_KEY=xnd_development_fbW1Cgzkns2IytpPjvq3LOsYLcaXzAWKVT6k44hGNdL8rmDx1NTbBa8RemlY
XENDIT_WEBHOOK_TOKEN=aeq8sCzxzooom8EVUUUWQczxSaZ0a46zooFQNKNhL14GLqz4

# Platform Wallet (SECRET - jangan share!)
PLATFORM_PRIVATE_KEY=feb552c3b93927f239fc657242c171c7299c00b8cb37f9d0f4c725c737b0b799
PLATFORM_WALLET_ADDRESS=0x60c55981C17DEcd200683ff0F85124199EC6eb08
```

**JANGAN set `NEXT_PUBLIC_BASE_URL`** - ini sudah otomatis detect!

4. Jika ada perubahan → klik **Save**
5. Vercel akan auto-redeploy

---

## 🧪 Test Payment Flow

Setelah 3 langkah di atas selesai:

### Step 1: Create Event
1. Buka `/organizer/events/new`
2. Create event dengan harga flat IDR (misal: Rp 50.000)
3. Submit event

### Step 2: Buy Ticket
1. Buka event detail page
2. Klik **Get Tickets**
3. Pilih **Pay with Fiat (IDR)** ← pilih ini, bukan crypto!
4. Isi email
5. Pilih quantity
6. Klik **Pay with Fiat**

### Step 3: Xendit Payment
1. Akan redirect ke Xendit payment page
2. Pilih payment method (QRIS/E-wallet/Bank Transfer)
3. Complete payment (test mode)

### Step 4: Success Page
Setelah payment berhasil:

**✅ Expected Behavior:**
```
Payment Successful!
Your payment has been confirmed. Your ticket is being issued.

Payment Details:
- Invoice ID: inv_xxx
- Amount: Rp 50.000
- Tickets: 1x Ticket(s)
- Status: PAID

🎟️ Issuing Your Ticket...
Please wait, we are minting your NFT ticket on the blockchain.
```

**❌ If Still Error:**
Open browser console (F12) dan screenshot logs:
- `[PaymentSuccess] Component mounted`
- `[PaymentSuccess] Checking payment status`
- Any error messages

---

## 🐛 Troubleshooting

### Error: "Payment Not Found (Status: 404)"

**Cause:** Database table belum dibuat atau endpoint belum deploy

**Fix:**
1. Run SQL migration di Supabase (Step 1)
2. Tunggu Vercel deployment selesai (Step 2)
3. Hard refresh browser (Ctrl+Shift+R)

---

### Error: "Failed to load resource: 404"

**Cause:** Vercel deployment belum selesai atau gagal

**Fix:**
1. Cek Vercel dashboard → Deployments
2. Jika Building → tunggu selesai (1-2 menit)
3. Jika Error → screenshot build logs

---

### Payment Berhasil Tapi Tiket Tidak Ter-Mint

**Cause:** Platform wallet tidak punya POL untuk gas fee

**Fix:**
1. Run: `npm run generate-wallet` (jika belum)
2. Copy platform wallet address
3. Kirim POL ke address itu (dari wallet pribadi atau [faucet](https://faucet.polygon.technology/))
4. Minimum: 0.1 POL

---

## 📊 Database Schema

Table `payments` memiliki columns:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| external_id | TEXT | Unique ID format: TIVENT-{eventId}-{timestamp}-{random} |
| invoice_id | TEXT | Xendit invoice ID |
| event_id | INTEGER | Event ID dari smart contract |
| ticket_type_id | INTEGER | Ticket type ID |
| ticket_quantity | INTEGER | Jumlah tiket dibeli |
| buyer_email | TEXT | Email pembeli |
| buyer_address | TEXT | Wallet address (nullable) |
| amount_idr | NUMERIC | Total harga IDR |
| status | TEXT | PENDING, PAID, PAID_PENDING_MINT, EXPIRED, FAILED |
| ticket_minted | BOOLEAN | Apakah tiket sudah di-mint |
| tx_hash | TEXT | Blockchain transaction hash |

---

## 🎯 Next Steps After Payment Works

1. **Setup Xendit Webhook** (for real-time payment updates)
   - Xendit Dashboard → Settings → Webhooks
   - Add URL: `https://your-domain.vercel.app/api/payment/xendit/webhook`
   - Set webhook token

2. **Implement Claim Flow** (for users who pay without wallet)
   - User bayar tanpa connect wallet
   - Success page → "Connect Wallet to Claim Ticket"
   - User connect wallet → manual mint

3. **Add Platform Wallet POL** (for auto-mint)
   - Kirim POL ke platform wallet
   - Test auto-mint after fiat payment

---

## 📞 Support

Jika masih error setelah ikuti semua langkah:
1. Screenshot console logs (F12 → Console tab)
2. Screenshot Vercel deployment logs
3. Check apakah tabel `payments` ada di Supabase

---

**Last Updated:** 2026-09-29
**Status:** Ready for testing after database migration
