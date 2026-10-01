# 🔧 Polygon Mumbai Testnet Setup Guide

Complete guide untuk deploy DecentraPass ke Polygon Mumbai Testnet (FREE gas, fully decentralized).

---

## 📋 **Prerequisites**

1. ✅ MetaMask installed
2. ✅ Node.js & npm installed
3. ✅ Hardhat project ready

---

## 🚀 **Step 1: Get Free MATIC (Test Tokens)**

### **1.1 Add Polygon Mumbai to MetaMask**

**Manual Method:**
1. Open MetaMask
2. Click network dropdown (top)
3. Click "Add Network"
4. Click "Add Network Manually"
5. Enter details:

```
Network Name: Polygon Mumbai Testnet
RPC URL: https://rpc-mumbai.maticvigil.com
Chain ID: 80001
Currency Symbol: MATIC
Block Explorer: https://mumbai.polygonscan.com
```

**Auto Method:**
- Visit: https://chainlist.org/
- Search: "Mumbai"
- Click "Connect Wallet" → "Add to MetaMask"

### **1.2 Get Free Test MATIC**

Visit faucets (dapatkan 0.5-1 MATIC gratis):

**Option 1: Polygon Faucet (Recommended)**
- URL: https://faucet.polygon.technology/
- Connect wallet
- Select "Mumbai"
- Click "Submit" 
- Wait ~30 seconds

**Option 2: Alchemy Faucet**
- URL: https://mumbaifaucet.com/
- Enter wallet address
- Complete captcha
- Get 0.5 MATIC

**Option 3: QuickNode Faucet**
- URL: https://faucet.quicknode.com/polygon/mumbai
- Sign up free account
- Get 0.1 MATIC per day

**Check Balance:**
```bash
# MetaMask should show: ~0.5 MATIC
```

---

## 🔧 **Step 2: Update Environment Variables**

### **2.1 Create/Update `.env.local`**

Copy from example:
```bash
cp .env.local.example .env.local
```

### **2.2 Update Blockchain Config**

Edit `.env.local`:

```bash
# Blockchain Configuration - POLYGON MUMBAI
NEXT_PUBLIC_RPC_URL=https://rpc-mumbai.maticvigil.com
NEXT_PUBLIC_CHAIN_ID=80001
NEXT_PUBLIC_CONTRACT_ADDRESS=  # Leave empty for now (fill after deploy)

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Platform Wallet (optional - for backend relay)
PLATFORM_PRIVATE_KEY=  # Your wallet private key (KEEP SECRET!)
PLATFORM_WALLET_ADDRESS=  # Your wallet address

# Event Listener (optional)
EVENT_LISTENER_POLL_INTERVAL=5000
EVENT_LISTENER_BATCH_SIZE=100

# Xendit (for fiat payment)
XENDIT_SECRET_KEY=xnd_development_...
XENDIT_WEBHOOK_TOKEN=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://lpnetzsaxtxmviromnww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📜 **Step 3: Deploy Smart Contract**

### **3.1 Create Hardhat Config (if not exists)**

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY], // Your deployer wallet private key
      chainId: 80001,
      gas: 6000000,
      gasPrice: 35000000000, // 35 Gwei
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};
```

### **3.2 Create Deploy Script**

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EventTicketing to Polygon Mumbai...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.error("❌ Insufficient MATIC! Get from faucet first.");
    process.exit(1);
  }

  // Deploy contract
  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  const contract = await EventTicketing.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ EventTicketing deployed to:", address);
  console.log("🔗 View on PolygonScan:", `https://mumbai.polygonscan.com/address/${address}`);

  // Wait for block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await contract.deploymentTransaction().wait(5);

  console.log("✅ Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log(`1. Update .env.local with: NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`2. Verify contract: npx hardhat verify --network mumbai ${address}`);
  console.log(`3. Test on frontend: npm run dev`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### **3.3 Add Private Key to `.env`**

Create `.env` (for Hardhat):

```bash
PRIVATE_KEY=your_metamask_private_key_here
POLYGONSCAN_API_KEY=  # Optional (for verification)
```

**⚠️ How to get Private Key from MetaMask:**
1. Open MetaMask
2. Click 3 dots → Account Details
3. Click "Show Private Key"
4. Enter password
5. Copy private key
6. **NEVER share or commit this!**

### **3.4 Deploy**

```bash
# Install dependencies (if not yet)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Deploy to Mumbai
npx hardhat run scripts/deploy.js --network mumbai
```

**Expected Output:**
```
🚀 Deploying EventTicketing to Polygon Mumbai...
📍 Deploying from: 0x1234...5678
💰 Balance: 0.5 MATIC
✅ EventTicketing deployed to: 0xABCD...EF01
🔗 View on PolygonScan: https://mumbai.polygonscan.com/address/0xABCD...EF01
⏳ Waiting for block confirmations...
✅ Deployment complete!
```

### **3.5 Update Frontend Config**

Copy contract address and update `.env.local`:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xABCD...EF01  # Your deployed address
```

---

## ✅ **Step 4: Verify Contract (Optional but Recommended)**

### **4.1 Get PolygonScan API Key**

1. Visit: https://polygonscan.com/
2. Sign up free account
3. Go to: API-KEYs → Create
4. Copy API key

### **4.2 Add to `.env`**

```bash
POLYGONSCAN_API_KEY=your_api_key_here
```

### **4.3 Verify**

```bash
npx hardhat verify --network mumbai YOUR_CONTRACT_ADDRESS
```

**Success:**
```
✅ Successfully verified contract EventTicketing
🔗 https://mumbai.polygonscan.com/address/0x.../contracts
```

---

## 🧪 **Step 5: Test Frontend**

### **5.1 Start Dev Server**

```bash
npm run dev
```

### **5.2 Connect Wallet**

1. Open: http://localhost:3000
2. Click "Connect Wallet"
3. **Make sure MetaMask is on Mumbai network!**
4. Approve connection

### **5.3 Test Create Event**

1. Go to: http://localhost:3000/organizer/events/new
2. Fill form:
   - Title: "Test Event Mumbai"
   - Description: "Testing Polygon Mumbai"
   - Venue: "Virtual"
   - Start Date: Tomorrow
   - Start Time: 19:00
   - End Date: Tomorrow
   - End Time: 23:00
   - Price: 0.01 (MATIC)
   - Max Tickets: 100

3. Click "Create Event"
4. **Confirm in MetaMask** (Gas fee: ~0.001 MATIC = **FREE!**)
5. Wait ~5 seconds
6. ✅ Event created!

### **5.4 Verify on PolygonScan**

1. Copy transaction hash from success message
2. Visit: https://mumbai.polygonscan.com/tx/YOUR_TX_HASH
3. Check:
   - ✅ Status: Success
   - ✅ Gas Used: ~200,000 gas
   - ✅ Gas Fee: ~0.001 MATIC ($0.00)
   - ✅ Contract Interaction: EventTicketing

---

## 📊 **Network Comparison**

| Aspect | Ethereum Sepolia | Polygon Mumbai | Polygon Mainnet |
|--------|------------------|----------------|-----------------|
| **Chain ID** | 11155111 | 80001 | 137 |
| **Gas Token** | ETH | MATIC | MATIC |
| **Gas Fee** | Medium | **FREE** | ~$0.01-$0.50 |
| **Speed** | 15-30s | **2-5s** | 2-5s |
| **Faucet** | Limited | Easy to get | Buy from exchange |
| **Use Case** | Testing | **Testing/Demo** | Production |

---

## 🔍 **Useful Links**

### **Block Explorers**
- Mumbai: https://mumbai.polygonscan.com/
- Mainnet: https://polygonscan.com/

### **Faucets**
- Polygon Official: https://faucet.polygon.technology/
- Alchemy: https://mumbaifaucet.com/
- QuickNode: https://faucet.quicknode.com/polygon/mumbai

### **Network Info**
- Chainlist: https://chainlist.org/chain/80001
- Polygon Docs: https://wiki.polygon.technology/

### **RPC URLs (Alternatives)**
```
https://rpc-mumbai.maticvigil.com  ← Recommended
https://matic-mumbai.chainstacklabs.com
https://rpc-mumbai.matic.today
https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "Insufficient funds for gas"**

**Solution:**
```bash
# Get more test MATIC from faucet
# Visit: https://faucet.polygon.technology/
```

### **Issue 2: "Network mismatch"**

**Solution:**
```bash
# MetaMask not on Mumbai
# Click network → Select "Polygon Mumbai Testnet"
```

### **Issue 3: "Transaction underpriced"**

**Solution:**
```javascript
// Increase gasPrice in hardhat.config.js
gasPrice: 50000000000, // 50 Gwei (higher)
```

### **Issue 4: "Nonce too high"**

**Solution:**
```bash
# Reset MetaMask account
# Settings → Advanced → Reset Account
```

### **Issue 5: Contract not showing on PolygonScan**

**Solution:**
```bash
# Wait 30 seconds, then refresh
# Or check: https://mumbai.polygonscan.com/address/YOUR_ADDRESS
```

---

## 🎯 **Checklist**

Before presenting/testing:

- [ ] MetaMask has Mumbai network added
- [ ] Wallet has 0.5+ MATIC from faucet
- [ ] `.env.local` updated with Mumbai RPC
- [ ] Smart contract deployed to Mumbai
- [ ] Contract address in `.env.local`
- [ ] Contract verified on PolygonScan (optional)
- [ ] Frontend connects to Mumbai
- [ ] Test create event works
- [ ] Transaction visible on PolygonScan

---

## 🚀 **Next Steps**

After Mumbai testing success:

### **For Production:**
1. Deploy to **Polygon Mainnet** (same steps, just change network)
2. Buy real MATIC from exchange (Binance, Tokocrypto)
3. Update RPC URL to mainnet
4. Test with small amounts first

### **Network Config for Mainnet:**
```bash
NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_CHAIN_ID=137
```

---

## 📝 **Summary**

**Polygon Mumbai Benefits:**
- ✅ **FREE gas** (perfect for demo/testing)
- ✅ **Fast** (2-5 second confirmations)
- ✅ **Decentralized** (100+ validators)
- ✅ **Easy faucet** (get MATIC in 30 seconds)
- ✅ **Production-like** (same as Polygon mainnet)

**Perfect for:**
- Development & testing
- Demo presentations
- Student projects
- Proof of concepts

**When to move to Mainnet:**
- Ready for real users
- Need real value transactions
- Launching product

---

## 🎉 **You're Ready!**

Follow steps 1-5 and you'll have a working Polygon Mumbai deployment in **~30 minutes**!

Gas fee for create event: **~$0.00** (FREE!) instead of $100+ on Ethereum! 🚀
