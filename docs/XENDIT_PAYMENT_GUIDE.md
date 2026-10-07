# Xendit Payment Integration Guide

Panduan lengkap untuk implementasi pembayaran fiat (IDR) menggunakan Xendit payment gateway.

## 🎯 Overview

Tivent mengintegrasikan Xendit untuk memungkinkan user membeli ticket dengan Rupiah (IDR) menggunakan berbagai metode pembayaran lokal:
- QRIS (Quick Response Code Indonesian Standard)
- E-Wallet (GoPay, OVO, Dana, LinkAja, ShopeePay)
- Virtual Account (BCA, Mandiri, BNI, BRI, Permata)
- Credit/Debit Card
- Retail Outlet (Alfamart, Indomaret)

## 🔄 Payment Flow

```
1. User selects tickets and chooses "Fiat Payment"
   ↓
2. User enters email address
   ↓
3. Frontend calls /api/payment/xendit/create-invoice
   ↓
4. Backend creates Xendit invoice with payment details
   ↓
5. User redirected to Xendit payment page
   ↓
6. User completes payment (QRIS, e-wallet, etc.)
   ↓
7. Xendit sends webhook to /api/payment/xendit/webhook
   ↓
8. Backend verifies payment and mints NFT ticket
   ↓
9. User redirected to success page with ticket details
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── payment/
│   │       └── xendit/
│   │           ├── create-invoice/
│   │           │   └── route.ts          # Create payment invoice
│   │           └── webhook/
│   │               └── route.ts          # Handle payment callback
│   └── payment/
│       ├── success/
│       │   └── page.tsx                  # Payment success page
│       └── failed/
│           └── page.tsx                  # Payment failed page
├── components/
│   └── PaymentMethodSelector.tsx         # Payment method UI
└── lib/
    └── xendit.ts                         # Xendit client wrapper

supabase/
└── migrations/
    └── 001_create_payments_table.sql     # Database schema

scripts/
├── generate-platform-wallet.js           # Generate platform wallet
└── test-platform-wallet.js               # Test platform wallet

docs/
├── XENDIT_PAYMENT_GUIDE.md               # This file
└── PLATFORM_WALLET_SETUP.md              # Platform wallet setup
```

## ⚙️ Setup Instructions

### 1. Xendit Account Setup

1. **Create Xendit Account**
   - Go to https://dashboard.xendit.co/register
   - Sign up with business email
   - Complete KYB (Know Your Business) verification

2. **Get API Keys**
   - Login to https://dashboard.xendit.co
   - Go to Settings → Developers → API Keys
   - Copy **Secret Key** (starts with `xnd_development_` or `xnd_production_`)
   - Copy **Webhook Verification Token**

3. **Configure Webhook**
   - Go to Settings → Developers → Webhooks
   - Add webhook URL: `https://your-domain.com/api/payment/xendit/webhook`
   - Select events: `invoice.paid`, `invoice.expired`
   - Save webhook token for verification

### 2. Environment Variables

Add to `.env.local`:

```env
# Xendit Configuration
XENDIT_SECRET_KEY=xnd_development_your_secret_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_verification_token_here

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to production URL

# Platform Wallet (for auto-minting tickets)
PLATFORM_PRIVATE_KEY=your_platform_wallet_private_key
PLATFORM_WALLET_ADDRESS=0xYourPlatformWalletAddress
```

### 3. Database Setup

Run the migration to create `payments` table:

```bash
# Using Supabase Dashboard
1. Go to SQL Editor
2. Copy contents of supabase/migrations/001_create_payments_table.sql
3. Run the query

# Or using Supabase CLI
supabase db push
```

### 4. Platform Wallet Setup

Generate and fund platform wallet:

```bash
# Generate new wallet
npm run generate-wallet

# Fund with POL (Polygon Amoy testnet)
# Visit: https://faucet.polygon.technology/

# Test wallet
npm run test:platform-wallet
```

See [PLATFORM_WALLET_SETUP.md](./PLATFORM_WALLET_SETUP.md) for detailed instructions.

## 🧪 Testing

### Test Mode (Sandbox)

Xendit provides sandbox environment for testing:

1. Use test API key: `xnd_development_...`
2. Test payment page shows "TEST MODE" banner
3. No real money is charged
4. Use test credentials for payment methods

**Test Credentials:**
- QRIS: Use any QR scanner, payment auto-succeeds
- E-Wallet: Use test phone numbers provided by Xendit
- Credit Card: `4000000000000002` (success), `4000000000000010` (failure)

### Manual Testing Flow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Create test event:**
   - Go to `/organizer/events/new`
   - Create event with test data
   - Set ticket price (e.g., 0.001 POL ≈ Rp 50,000)

3. **Test purchase flow:**
   - Go to event page
   - Click "Buy Tickets"
   - Select "Rupiah (IDR)" payment method
   - Enter test email
   - Complete payment on Xendit page

4. **Verify webhook:**
   - Check server logs for webhook received
   - Verify payment status in Supabase `payments` table
   - Check ticket minting transaction on PolygonScan

5. **Test success page:**
   - Should redirect to `/payment/success`
   - Should show payment details
   - Should show minting progress

### Local Webhook Testing

To test webhooks locally, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Add to Xendit webhook settings:
# https://abc123.ngrok.io/api/payment/xendit/webhook
```

## 🔐 Security Checklist

- [ ] Xendit secret key stored in environment variables
- [ ] Webhook verification token configured
- [ ] Platform wallet private key never committed to git
- [ ] HTTPS enabled in production
- [ ] Webhook signature verification enabled
- [ ] Rate limiting on payment endpoints
- [ ] Input validation on all payment forms
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection on payment pages

## 💰 Pricing & Fees

### Xendit Transaction Fees

| Payment Method | Fee |
|----------------|-----|
| QRIS | 0.7% |
| E-Wallet | 2% |
| Virtual Account | Rp 4,000 flat |
| Credit Card | 2.9% + Rp 2,000 |
| Retail Outlet | Rp 5,000 flat |

### Gas Fees (Blockchain)

- Ticket minting: ~0.001 POL (~Rp 50)
- Paid by platform wallet
- Not charged to user

### Total Cost Example

For a Rp 100,000 ticket paid via QRIS:
- Ticket price: Rp 100,000
- Xendit fee: Rp 700 (0.7%)
- Gas fee: Rp 50 (paid by platform)
- **User pays: Rp 100,700**

## 📊 Monitoring

### Key Metrics to Track

1. **Payment Success Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'PAID') * 100.0 / COUNT(*) as success_rate
   FROM payments
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

2. **Minting Success Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE ticket_minted = TRUE) * 100.0 / COUNT(*) as mint_rate
   FROM payments
   WHERE status = 'PAID';
   ```

3. **Average Processing Time**
   ```sql
   SELECT 
     AVG(EXTRACT(EPOCH FROM (minted_at - paid_at))) as avg_seconds
   FROM payments
   WHERE ticket_minted = TRUE;
   ```

4. **Revenue by Payment Method**
   ```sql
   SELECT 
     payment_method,
     COUNT(*) as transactions,
     SUM(amount_idr) as total_revenue
   FROM payments
   WHERE status = 'PAID'
   GROUP BY payment_method
   ORDER BY total_revenue DESC;
   ```

### Alerts to Setup

- Payment webhook failures (> 5% failure rate)
- Ticket minting failures (any occurrence)
- Platform wallet balance < 0.1 POL
- Unusual payment patterns (fraud detection)

## 🐛 Troubleshooting

### Issue: Webhook not received

**Symptoms:** Payment completed but ticket not minted

**Solutions:**
1. Check webhook URL in Xendit dashboard
2. Verify webhook token matches
3. Check server logs for errors
4. Test webhook with Xendit's webhook simulator

### Issue: Ticket minting failed

**Symptoms:** Payment successful but `ticket_minted = FALSE`

**Solutions:**
1. Check platform wallet balance
2. Verify contract is not paused
3. Check if tickets are sold out
4. Review `mint_error` column in database
5. Manually retry minting:
   ```bash
   npm run retry:mint -- --external-id TIVENT-XXX
   ```

### Issue: Payment amount mismatch

**Symptoms:** User paid different amount than expected

**Solutions:**
1. Check POL/IDR exchange rate calculation
2. Verify ticket price in smart contract
3. Check for rounding errors
4. Review invoice creation logic

### Issue: Duplicate payments

**Symptoms:** User charged twice for same ticket

**Solutions:**
1. Check `external_id` uniqueness
2. Implement idempotency in webhook handler
3. Add database constraint on `external_id`
4. Refund duplicate via Xendit dashboard

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Switch to production Xendit API key (`xnd_production_...`)
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Configure webhook URL to production domain (HTTPS)
- [ ] Test webhook in production environment
- [ ] Fund platform wallet with sufficient POL
- [ ] Set up monitoring and alerts
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Test complete payment flow in production
- [ ] Prepare customer support documentation
- [ ] Set up payment reconciliation process

### Deployment Steps

1. **Deploy to Vercel/hosting:**
   ```bash
   vercel --prod
   ```

2. **Update environment variables:**
   - Set production Xendit keys
   - Set production base URL
   - Set platform wallet keys

3. **Configure Xendit webhook:**
   - Add production webhook URL
   - Test with webhook simulator

4. **Run smoke tests:**
   - Create test payment
   - Verify webhook received
   - Check ticket minting
   - Test success/failure pages

5. **Monitor for 24 hours:**
   - Watch for errors
   - Check payment success rate
   - Monitor platform wallet balance
   - Review user feedback

## 📞 Support

### Xendit Support
- Documentation: https://docs.xendit.co
- Email: support@xendit.co
- WhatsApp: +62 812-8686-0239

### Tivent Support
- Email: support@tivent.com
- Documentation: https://docs.tivent.com

## 📚 Additional Resources

- [Xendit API Documentation](https://developers.xendit.co/api-reference)
- [Xendit Invoice Guide](https://developers.xendit.co/api-reference/#create-invoice)
- [Platform Wallet Setup](./PLATFORM_WALLET_SETUP.md)
- [Supabase Setup](../supabase/README.md)
