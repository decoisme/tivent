# Verified Claims for Thesis (Bab 2-4)

**Last Updated:** October 8, 2026  
**Purpose:** Semua klaim di bawah sudah diverifikasi dengan sumber resmi

---

## 1. Polygon PoS Network Specifications

### ✅ Throughput (TPS)

**Official Source:** [Polygon Docs - PoS Overview](https://docs.polygon.technology/pos/overview/)

**Verified Claims:**
- **Current Capacity:** 3,800 TPS (official documentation)
- **Peak Capacity (2026):** 2,600+ TPS (after 83% capacity upgrade)
- **Future Target:** 100,000 TPS ("gigagas" roadmap)

**Source Citation:**
> "Polygon Chain is an EVM-compatible blockchain anchored to Ethereum. Sub-5 second finality, 3,800 TPS, and $0.002 average transaction cost."
> — Polygon Docs, PoS Overview

**Additional Context:**
- Recent upgrade (2026): Gas limit raised from 60M to 110M (83% increase)
- Peak observed: 2,600+ TPS under production load
- Source: [Polygon Blog - Network Capacity Upgrade](https://polygon.technology/blog/more-transactions-more-capacity-polygon-is-constantly-upgrading-to-keep-up-with-demand)

**⚠️ Note for Thesis:**
- Quote 3,800 TPS as "documented maximum capacity"
- Mention 2,600+ TPS as "observed peak capacity in production"
- Clarify: Not measured by thesis author, cited from official documentation

---

### ✅ Transaction Cost

**Official Source:** [Polygon Docs - PoS Overview](https://docs.polygon.technology/pos/overview/)

**Verified Claims:**
- **Average TX Cost (Mainnet):** $0.002 USD
- **Settlement Time:** ~2 seconds
- **Finality:** Sub-5 seconds

**Source Citation:**
> "Polygon settles transactions in approximately 2 seconds with fees under $0.01, making it the most practical blockchain for real-world payment use cases at scale."
> — Polygon Official Documentation

---

## 2. Polygon Amoy Testnet Specifications

### ✅ Amoy Network Characteristics

**Official Source:** [Thirdweb - Polygon Amoy Testnet](https://thirdweb.com/polygon-amoy-testnet)

**Verified Claims:**
- **Block Time:** ~2 seconds
- **Throughput:** 20-60+ TPS (under normal testnet load)
- **Gas Cost:** Negligible (typically < $0.001 per simple transaction)
- **Chain ID:** 80002
- **Native Token:** POL (testnet version)

**Source Citation:**
> "Key performance traits for rapid iteration include ~2s block times, negligible testnet gas costs (typically < $0.001 per simple tx), 20–60+ TPS under normal load, and lower activity than mainnet for predictable confirmations."
> — Thirdweb Documentation, Polygon Amoy Testnet

**⚠️ Important Note:**
- Amoy is **testnet** - performance != mainnet
- Testnet typically has lower activity = more predictable confirmations
- Gas costs are negligible on testnet (free POL from faucet)

**For Thesis:**
- Use Amoy **only** for development/testing discussion
- Do NOT extrapolate testnet costs to production
- Clearly label all measurements as "testnet environment"

---

## 3. POL Token Price (for Cost Calculations)

### ✅ Current Market Price (October 2026)

**Sources:**
- [Coinbase](https://www.coinbase.com/price/polygon-pol)
- [Crypto.com](https://crypto.com/us/price/polygon-ecosystem-token/usd)
- [Binance](https://www.binance.com/en/price/polygon-ecosystem-token)

**Verified Price Range (October 8, 2026):**
- **Crypto.com:** $0.1158 USD
- **Binance:** $0.1027 USD  
- **Kraken:** $0.10 USD
- **Average:** ~$0.10 USD per POL

**⚠️ For Thesis Calculations:**
```
POL Price Assumption: $0.10 USD per POL (October 2026 market price)
Note: Cryptocurrency prices are volatile. Use this as reference only.
Source: Multiple exchanges (Coinbase, Binance, Crypto.com)
```

---

## 4. Actual Gas Cost Measurements (Tivent Implementation)

### ✅ Measured Transaction: Free Mint

**Transaction Hash:** `0x76f273f98aa3a48086b1085e05edb9a90898e567ce8cf5a4db546c6ff295f6cb`  
**Network:** Polygon Amoy Testnet  
**Function:** `mintTicketFree()`  
**PolygonScan:** https://amoy.polygonscan.com/tx/0x76f273f98aa3a48086b1085e05edb9a90898e567ce8cf5a4db546c6ff295f6cb

**TODO: Fill in after checking PolygonScan**

| Metric | Value | Calculation |
|--------|-------|-------------|
| **Gas Used** | [TO BE FILLED] | From PolygonScan |
| **Gas Price** | [TO BE FILLED] Gwei | From PolygonScan |
| **Transaction Fee** | [TO BE FILLED] POL | Gas Used × Gas Price |
| **Cost in USD** | [TO BE FILLED] | Fee × POL Price ($0.10) |

**Instructions:**
1. Open PolygonScan link above
2. Copy values from transaction page
3. Calculate USD cost using POL = $0.10

---

## 5. Resale Price Cap Justification

### ✅ 110% Cap Calculation

**Research Context:**
- DeTi (Cheng et al.) uses 100% cap (no markup allowed)
- Tivent uses 110% cap (10% markup allowed)

**Justification for 110%:**

**1. Gas Cost Coverage (Primary Reason)**

On Polygon **Mainnet** (not testnet):
```
Average TX Cost: $0.002 (from official docs)
Resale involves 2 transactions:
  1. List ticket: ~$0.002
  2. Transfer ticket: ~$0.002
Total Gas Cost: ~$0.004 USD

For Rp 125,000 ticket:
  $0.004 = ~Rp 60 (at $1 = Rp 15,000)
  Percentage: 0.048%
```

**2. Market Flexibility (Secondary Reason)**

Allow minimal profit for legitimate resellers:
```
110% cap = 10% markup maximum
For Rp 125,000 ticket:
  Max resale price: Rp 137,500
  Seller profit after gas: ~Rp 12,440
```

**3. Anti-Scalping Protection**

10% markup is:
- ✅ Too low for professional scalpers (not profitable at scale)
- ✅ Covers costs for legitimate emergencies
- ✅ Significantly lower than typical scalper markup (50-500%)

**Comparison Table:**

| Scenario | Cap | Max Profit | Scalping Risk |
|----------|-----|------------|---------------|
| DeTi (100%) | No markup | $0 (loss after gas) | ❌ Very Low |
| Tivent (110%) | 10% markup | ~$0.80 | ⚠️ Low |
| No cap | Unlimited | Unlimited | ✅ Very High |

**For Thesis:**
- Cite DeTi's 100% approach (Cheng et al.)
- Explain 110% as compromise between anti-scalping and practicality
- Acknowledge trade-off: slightly higher than DeTi, but covers gas costs

---

## 6. Cost Comparison (Old vs New Implementation)

### ⚠️ DO NOT CLAIM WITHOUT MEASUREMENT

**Old Implementation (buyTicket + transfer):**
- [ ] Gas used: [MEASURE FROM OLD TX]
- [ ] POL cost: [CALCULATE]
- [ ] USD cost: [CALCULATE with POL price]

**New Implementation (mintTicketFree):**
- [ ] Gas used: [FROM TX 0x76f2...]
- [ ] POL cost: [CALCULATE]
- [ ] USD cost: [CALCULATE with POL price]

**Savings:**
- [ ] Percentage: [CALCULATE after measurements]

**⚠️ For Thesis:**
- Only include if you have BOTH measurements
- Clearly state assumptions (POL price, gas price)
- Label as "testnet measurements" if using Amoy
- Do NOT extrapolate testnet costs to production

---

## 7. Platform Wallet Economics

### ✅ Capacity Calculation

**Given:**
- Platform wallet balance: 17.4 POL (current)
- Gas cost per mint: [TO BE MEASURED] POL
- POL price: $0.10 USD

**Calculation:**
```
Tickets per POL = 1 / [Gas Cost Per Mint]
Total capacity = 17.4 POL × Tickets per POL
```

**Example (if gas = 0.01 POL per mint):**
```
Tickets per POL = 1 / 0.01 = 100 tickets/POL
Current capacity = 17.4 × 100 = 1,740 tickets

With 100 POL top-up:
Total = 117.4 POL
Capacity = 11,740 tickets
```

**⚠️ For Thesis:**
- Wait for gas measurement before calculating capacity
- Use conservative estimates (higher gas cost)
- Account for gas price variability

---

## Summary: What to Use in Thesis

### ✅ Safe to Cite (with source):

1. **Polygon PoS TPS:** 3,800 TPS (Polygon Docs)
2. **Polygon Average TX Cost:** $0.002 (Polygon Docs)
3. **Amoy Block Time:** ~2 seconds (Thirdweb)
4. **Amoy TPS:** 20-60+ TPS under normal load (Thirdweb)
5. **POL Price:** ~$0.10 USD (October 2026, multiple exchanges)

### ⚠️ Needs Measurement (DO NOT GUESS):

1. ❌ "99.96% savings" - needs both old & new gas measurements
2. ❌ "$0.005 per ticket" - needs actual gas measurement
3. ❌ Wallet capacity - needs gas measurement
4. ❌ Any "production cost" estimates - Amoy is testnet

### 📝 How to Present in Thesis:

**Good Example:**
> "According to official Polygon documentation, the network supports up to 3,800 transactions per second with an average transaction cost of $0.002 USD [1]. Testing was conducted on Polygon Amoy testnet, which provides similar characteristics with ~2-second block times [2]."

**Bad Example:**
> ❌ "Our implementation saves 99.96% in gas costs, reducing cost to $0.005 per ticket on a network capable of 7000+ TPS."
> (No source, mixing measured vs claimed, unclear if testnet or mainnet)

---

## References for Thesis

[1] Polygon Technology. "Polygon PoS Overview." Polygon Developer Documentation. https://docs.polygon.technology/pos/overview/ (accessed October 8, 2026).

[2] Thirdweb. "Polygon Amoy Testnet Specifications." Thirdweb Documentation. https://thirdweb.com/polygon-amoy-testnet (accessed October 8, 2026).

[3] Polygon Technology. "Network Capacity Upgrade." Polygon Blog, December 2026. https://polygon.technology/blog/more-transactions-more-capacity-polygon-is-constantly-upgrading-to-keep-up-with-demand

[4] Cheng, R., et al. "DeTi: A Decentralized Ticketing System Based on Blockchain." [Cite full reference from your literature review]

[5] Multiple cryptocurrency exchanges (Coinbase, Binance, Crypto.com). POL/USD pricing data, October 2026.

---

## Action Items Before Finalizing Thesis

- [ ] Open PolygonScan for TX 0x76f2... and record gas metrics
- [ ] Calculate actual USD cost using measured gas + POL price
- [ ] If comparing old vs new: Find old transaction and measure gas
- [ ] Update all tables above with real measurements
- [ ] Remove any unsupported claims from thesis draft
- [ ] Add explicit "Limitations" section mentioning testnet vs mainnet
