# 🎫 Cara Create Event di Tivent

Panduan lengkap untuk membuat event menggunakan platform Tivent (decentralized event ticketing).

---

## 📋 Prerequisites

Sebelum create event, pastikan kamu punya:

1. ✅ **Wallet Crypto (MetaMask/WalletConnect)**
   - Download MetaMask: https://metamask.io/
   - Atau gunakan wallet lain yang support WalletConnect

2. ✅ **ETH untuk Gas Fee**
   - Kamu perlu ETH di wallet untuk bayar gas fee create event
   - Testnet: Dapatkan ETH gratis dari faucet
   - Mainnet: Beli ETH dari exchange

3. ✅ **Connect ke Network yang Benar**
   - Pastikan wallet terkoneksi ke network yang sama dengan smart contract
   - Check di `.env.local` untuk `NEXT_PUBLIC_RPC_URL`

---

## 🚀 Langkah-Langkah Create Event

### 1. Buka Halaman Create Event

```
http://localhost:3000/organizer/events/new
```

Atau klik **"Create Event"** di dashboard organizer.

### 2. Connect Wallet

Jika belum connect:
- Klik tombol **"Connect Wallet"** di navbar
- Pilih MetaMask atau WalletConnect
- Approve connection di wallet popup

### 3. Isi Form Event

Form terbagi menjadi 4 section:

#### A. **Basic Information**

| Field | Keterangan | Contoh |
|-------|-----------|---------|
| **Event Title*** | Nama event | "Jakarta Music Festival 2026" |
| **Description*** | Deskripsi lengkap event | "Annual music festival featuring..." |
| **Venue*** | Lokasi event | "Jakarta International Stadium" |
| **Image URL** | Link gambar event (optional) | "https://..." |

#### B. **Date & Time**

| Field | Keterangan | Contoh |
|-------|-----------|---------|
| **Start Date*** | Tanggal mulai | 2026-12-31 |
| **Start Time*** | Jam mulai | 18:00 |
| **End Date*** | Tanggal selesai | 2027-01-01 |
| **End Time*** | Jam selesai | 02:00 |

⚠️ **Validasi:**
- Event harus start di masa depan
- End time harus setelah start time

#### C. **Ticketing Configuration**

| Field | Keterangan | Contoh |
|-------|-----------|---------|
| **Ticket Price (ETH)*** | Harga tiket dalam ETH | 0.1 |
| **Maximum Tickets*** | Total tiket tersedia | 1000 |
| **Max Tickets Per Wallet** | Limit per wallet (anti-scalping) | 4 |

💡 **Tips:**
- **Ticket Price**: 
  - 1 ETH ≈ 50,000,000 IDR (approx)
  - 0.1 ETH ≈ 5,000,000 IDR
  - 0.01 ETH ≈ 500,000 IDR
- **Max Tickets Per Wallet**: Recommended 2-4 untuk prevent scalping

#### D. **Anti-Scalping Rules**

| Field | Keterangan | Default | Contoh |
|-------|-----------|---------|---------|
| **Resale Price Cap (%)** | Max markup resale | 110% | 120% (max 20% profit) |
| **Resale Deadline (hours)** | Resale close berapa jam sebelum event | 2 | 24 (resale tutup 1 hari sebelum) |

💡 **Penjelasan:**
- **Resale Price Cap**: Kalau set 110%, buyer bisa jual max 110% dari harga asli (max profit 10%)
- **Resale Deadline**: Kalau set 2, resale marketplace tutup 2 jam sebelum event start

### 4. Review & Submit

1. **Review semua data** yang sudah diisi
2. Klik tombol **"Create Event"**
3. **Confirm transaction** di wallet popup
4. **Tunggu confirmation** (biasanya < 1 menit)
5. ✅ **Event created!** - kamu akan redirect ke dashboard

---

## 💰 Estimasi Gas Fee

| Network | Gas Fee (approx) |
|---------|------------------|
| Ethereum Mainnet | 0.005 - 0.02 ETH ($15-$60) |
| Polygon | 0.01 - 0.05 MATIC ($0.01-$0.05) |
| BSC | 0.001 - 0.005 BNB ($0.30-$1.50) |
| Testnet | FREE (faucet) |

⚠️ **Note**: Gas fee tergantung network congestion

---

## 🔍 Yang Terjadi di Blockchain

Saat kamu create event, smart contract akan:

1. **Store event metadata** on-chain:
   - Title, description, venue, dates
   - Metadata URI (IPFS hash)

2. **Configure ticketing rules**:
   - Ticket price (ETH)
   - Max supply
   - Max per wallet

3. **Set anti-scalping parameters**:
   - Resale price cap (basis points)
   - Resale deadline (Unix timestamp)

4. **Emit CreateEvent event**:
   ```solidity
   event EventCreated(
     uint256 indexed eventId,
     address indexed organizer,
     string metadataURI,
     uint256 ticketPrice,
     uint256 maxTickets
   );
   ```

5. **Assign organizer role**:
   - Kamu jadi owner event
   - Bisa withdraw revenue
   - Bisa cancel event (dengan refund)

---

## 📊 Setelah Event Dibuat

### Event ID
Setiap event dapat **unique ID** (incremental: 1, 2, 3, ...)

### View Event
```
http://localhost:3000/events/[eventId]
```

### Purchase Ticket
User bisa beli tiket via:
```
http://localhost:3000/events/[eventId]/purchase
```

### Organizer Dashboard
Kamu bisa manage event di:
```
http://localhost:3000/organizer
```

Features untuk organizer:
- 📊 View sales statistics
- 👥 See ticket holders
- 💰 Withdraw revenue
- ❌ Cancel event (if needed)

---

## 🐛 Troubleshooting

### ❌ "Wallet not connected"
**Solution**: Klik "Connect Wallet" di navbar, approve di wallet popup

### ❌ "Transaction failed: insufficient funds"
**Solution**: Pastikan ada cukup ETH untuk gas fee

### ❌ "Event must start in the future"
**Solution**: Set start date/time di masa depan

### ❌ "End time must be after start time"
**Solution**: End date/time harus lebih besar dari start date/time

### ❌ "User rejected transaction"
**Solution**: Approve transaction di wallet popup

### ❌ "Network mismatch"
**Solution**: Switch wallet ke network yang benar (check chain ID di `.env.local`)

---

## 🎯 Best Practices

### 1. **Pricing Strategy**
- Research harga kompetitor
- Consider gas fee dalam pricing
- Jangan terlalu murah (attract scalpers)
- Jangan terlalu mahal (no buyers)

### 2. **Anti-Scalping Configuration**
- **Max Tickets Per Wallet**: 
  - Small event (< 500): Set 2-4
  - Large event (> 1000): Set 4-6
- **Resale Price Cap**:
  - Popular event: Set 110-120% (limit profit)
  - Niche event: Set 150-200% (allow market)
- **Resale Deadline**:
  - Same-day event: Set 2-6 hours
  - Multi-day event: Set 24-48 hours

### 3. **Marketing**
- Share event link di social media
- Provide clear event details
- Upload attractive event image
- Announce early bird pricing

### 4. **Revenue Management**
- Withdraw revenue secara berkala
- Don't wait sampai last minute
- Monitor ticket sales di dashboard

---

## 📝 Example: Create Music Festival

```
Title: "Jakarta Music Festival 2026"
Description: "The biggest EDM festival in Southeast Asia featuring international DJs..."
Venue: "Jakarta International Stadium"
Image: "https://example.com/poster.jpg"

Start: 2026-12-31 18:00
End: 2027-01-01 02:00

Ticket Price: 0.05 ETH (≈ 2.5 juta IDR)
Max Tickets: 5000
Max Per Wallet: 4

Resale Cap: 120% (max profit 20%)
Resale Deadline: 24 hours before event
```

**Result**: Event created! EventID = 1

---

## 🔗 Related Documentation

- [Smart Contract Documentation](./SMART_CONTRACT.md)
- [How to Purchase Tickets](./HOW_TO_PURCHASE.md)
- [Fraud Detection System](./FRAUD_DETECTION.md)
- [Ownership History](./OWNERSHIP_HISTORY.md)

---

## 💬 Need Help?

Jika ada kendala:
1. Check troubleshooting section di atas
2. Check browser console untuk error messages
3. Verify wallet connection & network
4. Check transaction status di block explorer

**Block Explorer URLs:**
- Ethereum: https://etherscan.io/
- Polygon: https://polygonscan.com/
- BSC: https://bscscan.com/

---

## ✅ Checklist Create Event

- [ ] Wallet terkoneksi
- [ ] Cukup ETH untuk gas fee
- [ ] Event title & description jelas
- [ ] Venue & dates sudah benar
- [ ] Ticket price sudah sesuai
- [ ] Max tickets & per wallet sudah set
- [ ] Anti-scalping rules configured
- [ ] Review semua data
- [ ] Transaction confirmed
- [ ] Event muncul di dashboard

Happy creating! 🎉
