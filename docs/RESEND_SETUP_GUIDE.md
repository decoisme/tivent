# 📧 Resend Email Setup Guide

Complete guide to setup Resend.com for email verification in Tivent.

---

## 🎯 Overview

Resend is used to send email verification after fiat payment. Flow:

```
User pays → Payment success → 
Email sent with verification link → 
User clicks link → Email verified → 
Ticket minted ✅
```

---

## 📋 Prerequisites

- [x] Resend package installed (`npm install resend`)
- [x] Email template created (`src/lib/email.ts`)
- [x] Send verification endpoint (`/api/payment/xendit/send-verification`)
- [x] Verify endpoint (`/api/payment/xendit/verify-email`)

---

## 🚀 Setup Steps

### **STEP 1: Create Resend Account** (2 minutes)

1. Go to [Resend.com](https://resend.com)
2. Click **"Sign Up"**
3. Sign up with:
   - GitHub (recommended)
   - Email
4. Verify your email

**Free Tier Limits:**
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ No credit card required

---

### **STEP 2: Get API Key** (1 minute)

1. After login, go to **[API Keys](https://resend.com/api-keys)**
2. Click **"Create API Key"**
3. Name: `Tivent Production` (or `Tivent Development`)
4. Permission: **Full Access**
5. Click **"Add"**
6. **COPY THE API KEY** (starts with `re_`)
7. ⚠️ **IMPORTANT:** Save it securely - it won't be shown again!

---

### **STEP 3: Add API Key to Environment Variables**

#### **For Local Development:**

Edit `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_YourActualApiKeyHere
```

Replace `re_YourActualApiKeyHere` with your actual API key from Step 2.

#### **For Vercel Production:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings**
3. Click **Environment Variables**
4. Add new variable:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_YourActualApiKeyHere`
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**
6. **Redeploy** your app (Deployments → ... → Redeploy)

---

### **STEP 4: Verify Domain (Optional - For Production)**

By default, emails are sent from `onboarding@resend.dev`. For production, use your own domain.

#### **4.1 Add Your Domain:**

1. Go to **[Domains](https://resend.com/domains)**
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.com`
4. Click **"Add"**

#### **4.2 Configure DNS Records:**

Resend will show DNS records you need to add. Go to your domain provider (Namecheap, GoDaddy, Cloudflare, etc.) and add:

**MX Record:**
```
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

**TXT Records:**
```
Name: @
Value: v=spf1 include:amazonses.com ~all

Name: resend._domainkey
Value: [provided by Resend]
```

**CNAME Record:**
```
Name: [provided by Resend]
Value: [provided by Resend]
```

#### **4.3 Verify Domain:**

1. After adding DNS records, click **"Verify"** in Resend dashboard
2. Wait 5-10 minutes for DNS propagation
3. Status should change to **"Verified" ✅**

#### **4.4 Update Email Template:**

Edit `src/lib/email.ts`, line 25:

```typescript
// Before (using Resend default)
from: 'Tivent <onboarding@resend.dev>',

// After (using your domain)
from: 'Tivent <noreply@yourdomain.com>',
```

---

## 🧪 Testing

### **Test 1: Local Development**

1. Start dev server:
```bash
npm run dev
```

2. Make a test payment:
   - Buy ticket → Pay with Fiat
   - Complete Xendit payment
   - Check console logs for:
   ```
   [send-verification] Sending email to: user@email.com
   [email] Verification email sent: msg_abc123
   ```

3. Check your email inbox
4. Click verification link
5. Should redirect to `/payment/verified` ✅

### **Test 2: Production**

1. Deploy to Vercel (push to main branch)
2. Test payment on production URL
3. Verify email is sent to real inbox

---

## 📧 Email Template Features

The verification email includes:

- ✅ Professional gradient header with Tivent branding
- ✅ Order details box (Event, Tickets, Amount)
- ✅ Large CTA button "Verify Email Address"
- ✅ Alternative text link (if button doesn't work)
- ✅ Security notice (24-hour expiry)
- ✅ Responsive design (mobile-friendly)
- ✅ No external images (fast loading)

---

## 🔍 Troubleshooting

### **Error: "Failed to send verification email"**

**Possible causes:**
1. Invalid API key
2. API key not set in environment variables
3. Resend service down

**Solutions:**
1. Check `.env.local` has correct `RESEND_API_KEY`
2. Restart dev server after changing env vars
3. Check Resend status: [status.resend.com](https://status.resend.com)

---

### **Emails going to spam**

**For development (`onboarding@resend.dev`):**
- This is normal in testing
- Check spam folder

**For production (custom domain):**
- Make sure DNS records are verified
- Add DMARC record:
  ```
  Name: _dmarc
  Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
  ```
- Wait 24-48 hours for email reputation to build

---

### **Email not received**

**Check:**
1. Console logs - was email sent?
   ```
   [email] Verification email sent: msg_abc123
   ```
2. Resend dashboard → **Logs** → check delivery status
3. Check spam folder
4. Try different email provider (Gmail, Outlook, etc.)

---

### **"Invalid API key" error**

**Solutions:**
1. Make sure API key starts with `re_`
2. No extra spaces in `.env.local`
3. Regenerate API key in Resend dashboard
4. Restart server after changing env vars

---

## 📊 Monitoring & Analytics

### **Resend Dashboard:**

Go to [resend.com/emails](https://resend.com/emails) to see:

- ✅ Emails sent
- ✅ Delivery status
- ✅ Opens (if tracking enabled)
- ✅ Clicks
- ✅ Bounces
- ✅ Spam reports

### **Enable Email Tracking:**

In `src/lib/email.ts`, add tracking options:

```typescript
await resend.emails.send({
  from: 'Tivent <noreply@yourdomain.com>',
  to,
  subject: 'Verify your email - Tivent',
  html: getVerificationEmailTemplate(...),
  // Add tracking
  tags: [
    { name: 'category', value: 'verification' },
    { name: 'event_id', value: String(eventId) },
  ],
});
```

---

## 💰 Pricing & Limits

### **Free Tier:**
- 3,000 emails/month
- 100 emails/day
- No credit card required
- Perfect for MVP/testing

### **Pro Plan ($20/month):**
- 50,000 emails/month
- No daily limit
- Email support
- Analytics & insights

### **Enterprise:**
- Custom volume
- Dedicated IP
- Priority support
- Custom integrations

**For Tivent:**
- Free tier = ~100 ticket sales/day
- Pro tier = ~1,600 ticket sales/day
- Upgrade when you need more! 🚀

---

## 🔐 Security Best Practices

1. **Never commit API keys to git**
   - ✅ Use `.env.local` (gitignored)
   - ✅ Use environment variables in Vercel

2. **Rotate API keys regularly**
   - Regenerate every 3-6 months
   - Immediately if compromised

3. **Use separate keys for dev/prod**
   - Development key for testing
   - Production key for live traffic

4. **Monitor email logs**
   - Check for unusual activity
   - Set up alerts for bounces/spam

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://resend.com/docs/send-with-nodejs)
- [Email Best Practices](https://resend.com/docs/knowledge-base/best-practices)
- [Resend Status Page](https://status.resend.com)

---

## ✅ Checklist

Before going live, make sure:

- [ ] Resend account created
- [ ] API key generated and saved
- [ ] `RESEND_API_KEY` added to `.env.local`
- [ ] `RESEND_API_KEY` added to Vercel environment variables
- [ ] Test email sent successfully in local
- [ ] Test email sent successfully in production
- [ ] (Optional) Custom domain verified
- [ ] (Optional) Email template updated with custom domain
- [ ] Email lands in inbox (not spam)
- [ ] Verification link works correctly

---

**Last Updated:** 2026-09-29  
**Status:** Ready for production ✅
