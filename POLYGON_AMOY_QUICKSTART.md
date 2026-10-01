# ⚡ Polygon Amoy Testnet - Quick Start

> **⚠️ IMPORTANT:** Mumbai testnet is deprecated! Use **Amoy** testnet instead.

## 🔄 Why Amoy?

Mumbai testnet has been **deprecated** and replaced by **Polygon Amoy** testnet:
- ❌ Mumbai (Chain ID: 80001) - **DEPRECATED**
- ✅ Amoy (Chain ID: 80002) - **ACTIVE**

---

## 🚀 Quick Setup (3 minutes)

### 1️⃣ Add Amoy Network to MetaMask

**Open MetaMask → Click network dropdown → "Add Network" → "Add a network manually"**

Fill in:
```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology
Chain ID: 80002
Currency Symbol: POL
Block Explorer: https://amoy.polygonscan.com
```

**Alternative RPC URLs (if above is slow):**
- `https://rpc.ankr.com/polygon_amoy`
- `https://polygon-amoy-bor-rpc.publicnode.com`

Click **"Save"** → Switch to "Polygon Amoy Testnet"

---

### 2️⃣ Get Free Test POL

**Visit:** https://faucet.polygon.technology/

1. Select **"Amoy"** (NOT Mumbai!)
2. Paste your wallet address
3. Click "Submit"
4. Wait 30 seconds
5. ✅ Receive **0.5 POL FREE**

**Alternative Faucets:**
- https://www.alchemy.com/faucets/polygon-amoy
- https://faucet.quicknode.com/polygon/amoy

---

### 3️⃣ Start App

```bash
npm run dev
```

Open: http://localhost:3000

---

### 4️⃣ Test

1. **Connect Wallet** → Should show "🧪 Amoy Testnet" badge
2. **Create Event** → Gas fee: **~$0.00** ✅
3. **Verify Transaction** → https://amoy.polygonscan.com/

---

## 📊 Amoy vs Mumbai

| Feature | Mumbai (OLD) | Amoy (NEW) |
|---------|--------------|------------|
| Status | ❌ Deprecated | ✅ Active |
| Chain ID | 80001 | **80002** |
| Currency | MATIC | **POL** |
| Faucet | Limited | Unlimited |
| Support | Ending soon | Full support |
| Explorer | mumbai.polygonscan.com | **amoy.polygonscan.com** |

---

## 🔍 Verify Your Network

**In MetaMask:**
- Network: "Polygon Amoy Testnet"
- Chain ID: **80002**
- Currency: POL (not MATIC)
- RPC: `https://rpc-amoy.polygon.technology`

**In App:**
- Badge shows: "🧪 Amoy Testnet"
- Bottom-left: "Amoy Testnet - Gas fees: FREE"

---

## 🐛 Troubleshooting

### Error: "Wrong Network" banner showing

**Solution:**
1. Check MetaMask is on "Polygon Amoy Testnet"
2. Chain ID must be **80002** (not 80001)
3. Click "Switch to Amoy" button in the banner

### Can't add network (Chainlist error)

**Solution:**
Add manually (Method 1 above) - Chainlist can be unreliable

### No POL in wallet

**Solution:**
Visit https://faucet.polygon.technology/ → Select "Amoy" → Get free POL

---

## 📝 Configuration Files Updated

✅ `.env.local` - RPC URL & Chain ID 80002  
✅ `src/lib/wagmi.ts` - polygonAmoy chain  
✅ `src/lib/contractReads.ts` - Amoy RPC  
✅ `src/lib/eventListener.ts` - Amoy chain  
✅ `src/components/WalletButton.tsx` - Amoy badge  
✅ `src/components/NetworkWarning.tsx` - Amoy detection  
✅ `src/components/TestnetBadge.tsx` - Amoy label  

---

## 🎯 Key Changes

**Mumbai → Amoy:**
- Chain ID: `80001` → `80002`
- RPC: `rpc-mumbai.*` → `rpc-amoy.polygon.technology`
- Explorer: `mumbai.polygonscan.com` → `amoy.polygonscan.com`
- Currency: `MATIC` → `POL`
- Faucet: Select "Amoy" (not Mumbai)

---

## ✅ Ready!

Your app is now configured for **Polygon Amoy testnet** with:
- ✅ FREE gas fees (~$0.00)
- ✅ Fast confirmations (2-5 seconds)
- ✅ Active support (Mumbai is deprecated)
- ✅ Unlimited faucet access

**Start testing:** `npm run dev` 🚀

---

## 📚 Resources

- **Faucet:** https://faucet.polygon.technology/ (select Amoy)
- **Explorer:** https://amoy.polygonscan.com/
- **RPC Status:** https://chainlist.org/chain/80002
- **Docs:** https://docs.polygon.technology/

---

**⚠️ Remember:** Always use **Amoy** (80002), not Mumbai (80001 - deprecated)
