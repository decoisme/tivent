# 🚀 Deploy to Polygon Mumbai Testnet

Quick guide untuk deploy smart contract ke Polygon Mumbai testnet dengan **GAS FEE GRATIS**.

## ✅ Prerequisites

### 1. Install Dependencies
```bash
cd contracts
npm install
```

### 2. Setup MetaMask untuk Mumbai

**Option A: Otomatis (Recommended)**
- Buka https://chainlist.org/chain/80001
- Klik "Connect Wallet"
- Klik "Add to MetaMask"

**Option B: Manual**
- Network Name: `Polygon Mumbai`
- RPC URL: `https://rpc-mumbai.maticvigil.com`
- Chain ID: `80001`
- Currency Symbol: `MATIC`
- Block Explorer: `https://mumbai.polygonscan.com`

### 3. Dapatkan Free Test MATIC

**Faucet 1: Polygon Official (Recommended)**
- Buka https://faucet.polygon.technology/
- Pilih "Mumbai"
- Paste wallet address kamu
- Klik "Submit" → Tunggu 30 detik
- Akan dapat **0.5 MATIC gratis**

**Faucet 2: Alchemy**
- Buka https://mumbaifaucet.com/
- Login dengan Alchemy account
- Paste wallet address
- Dapat 0.1 MATIC per hari

### 4. Export Private Key dari MetaMask

⚠️ **PENTING: Jangan share private key ke siapapun!**

1. Buka MetaMask
2. Klik account name → "Account Details"
3. Klik "Show Private Key"
4. Enter password
5. Copy private key

### 5. Create `.env` File

Di folder `contracts/`, buat file `.env`:

```bash
# Copy dari .env.example
cp .env.example .env
```

Edit `.env`:
```env
# Paste private key kamu (tanpa 0x prefix)
PRIVATE_KEY=your_private_key_here

# Mumbai RPC (sudah default, tidak perlu diubah)
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
```

## 🚀 Deployment

### Deploy ke Mumbai Testnet

```bash
cd contracts
npx hardhat run scripts/deploy-mumbai.js --network mumbai
```

### Expected Output:

```
🚀 Starting deployment to Polygon Mumbai Testnet...

Network: maticmum
Chain ID: 80001

📍 Deployer address: 0x1234...
💰 Balance: 0.5 MATIC

📦 Deploying EventTicketing contract...
⏳ Sending transaction...
⏳ Waiting for deployment...
✅ Contract deployed to: 0xABC123...

📊 Deployment Details:
   Transaction hash: 0xdef456...
   Gas used: 2500000
   
⏳ Waiting for 5 block confirmations...
✅ Confirmed in block: 12345678
💸 Gas cost: 0.0025 MATIC (~$0.0013 USD)

============================================================
🎉 DEPLOYMENT SUCCESSFUL!
============================================================

📋 Summary:
   Network: Polygon Mumbai Testnet
   Contract: EventTicketing
   Address: 0xABC123...
   Explorer: https://mumbai.polygonscan.com/address/0xABC123...

📝 Next Steps:

1. Update your .env.local file:
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xABC123...

2. Verify contract on PolygonScan (optional):
   npx hardhat verify --network mumbai 0xABC123...

3. Test the contract:
   - Connect wallet to Mumbai network
   - Run: npm run dev
   - Create an event and check gas fee (~$0.00)

============================================================
✅ All done! Happy building! 🚀
============================================================
```

## 📝 Update Frontend Configuration

Setelah deployment berhasil, update file `.env.local` di root project:

```bash
# Di root folder (bukan di contracts/)
nano .env.local
```

Update contract address:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xABC123...  # Dari output deployment
```

## 🧪 Testing

### 1. Start Development Server
```bash
# Di root folder
npm run dev
```

### 2. Connect Wallet
- Buka http://localhost:3000
- Klik "Connect Wallet"
- Pastikan MetaMask di Mumbai network (lihat badge "Mumbai" di navbar)

### 3. Create Event
- Pergi ke `/organizer/events/new`
- Isi form event
- Klik "Create Event"
- **Gas fee seharusnya ~$0.00** (hampir gratis!)

### 4. Verify on PolygonScan
- Buka https://mumbai.polygonscan.com/address/[CONTRACT_ADDRESS]
- Klik tab "Transactions"
- Lihat transaction history

## 🔍 Contract Verification (Optional)

Verifikasi contract agar source code terlihat di PolygonScan:

```bash
npx hardhat verify --network mumbai [CONTRACT_ADDRESS]
```

Jika error "Already verified":
```
✅ Contract sudah verified secara otomatis oleh Hardhat!
```

## 💰 Gas Fee Comparison

| Network | Create Event | Buy Ticket | Total for Demo |
|---------|--------------|------------|----------------|
| **Ethereum Mainnet** | $50-$200 | $20-$80 | **$200-$500** |
| **Ethereum Sepolia** | $5-$20 | $2-$8 | **$20-$50** |
| **Polygon Mumbai** | **$0.00** | **$0.00** | **FREE** ✅ |
| **Polygon Mainnet** | $0.01-$0.50 | $0.005-$0.20 | **$0.10-$2** |

## 🐛 Troubleshooting

### Error: "insufficient funds for gas"
**Solution:**
- Dapatkan MATIC dari faucet: https://faucet.polygon.technology/
- Minimal butuh 0.1 MATIC

### Error: "invalid sender"
**Solution:**
- Cek `PRIVATE_KEY` di file `.env`
- Pastikan tidak ada spasi atau newline
- Pastikan tanpa prefix `0x`

### Error: "nonce too low"
**Solution:**
```bash
# Reset nonce di MetaMask
# Settings > Advanced > Reset Account
```

### Transaction Stuck (Pending)
**Solution:**
- Tunggu 1-2 menit (Mumbai block time ~5 detik)
- Cek di https://mumbai.polygonscan.com/

### Wrong Network
**Solution:**
- Buka MetaMask
- Switch ke "Polygon Mumbai" network
- Refresh halaman

## 📚 Resources

- **Faucet**: https://faucet.polygon.technology/
- **Explorer**: https://mumbai.polygonscan.com/
- **RPC Status**: https://chainlist.org/chain/80001
- **Polygon Docs**: https://wiki.polygon.technology/

## 🎯 Production Deployment (Polygon Mainnet)

Ketika siap production:

1. Dapatkan real MATIC dari exchange (Binance, Coinbase, dll)
2. Update `.env`:
   ```env
   POLYGON_RPC_URL=https://polygon-rpc.com
   PRIVATE_KEY=your_mainnet_private_key
   ```
3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network polygon
   ```
4. Update `.env.local`:
   ```env
   NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
   NEXT_PUBLIC_CHAIN_ID=137
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xNEW_ADDRESS
   ```

---

**🎉 Selamat! Contract kamu sekarang live di Polygon Mumbai dengan gas fee GRATIS!**
