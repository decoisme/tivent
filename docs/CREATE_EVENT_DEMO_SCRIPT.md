# 🎬 Demo Script: Create Event di Tivent

Script untuk demo/presentasi cara create event di platform Tivent.

---

## 🎯 Demo Scenario

**Event**: Jakarta Tech Conference 2026  
**Target**: Create event untuk 500 peserta  
**Duration**: ~5 menit demo

---

## 📝 Script

### Opening (30 detik)

```
"Halo semuanya! Hari ini saya akan demo cara create event 
di Tivent, platform decentralized event ticketing yang saya buat.

Platform ini menggunakan blockchain untuk ensure transparency, 
prevent scalping, dan protect ticket buyers.

Mari kita mulai!"
```

---

### Part 1: Connect Wallet (1 menit)

**Action**:
1. Buka browser → `http://localhost:3000`
2. Klik "Connect Wallet" di kanan atas
3. Pilih MetaMask
4. Approve connection

**Narration**:
```
"Langkah pertama adalah connect wallet. Saya menggunakan MetaMask.

[Klik Connect Wallet]

Platform ini fully decentralized, jadi semua transaksi langsung 
ke blockchain tanpa melalui server pusat.

[Approve di MetaMask]

OK, wallet sudah connected. Saya punya 0.5 ETH di wallet, 
cukup untuk create event dan gas fee."
```

**Show Screen**:
- Wallet address muncul di navbar
- Balance visible

---

### Part 2: Navigate to Create Event (30 detik)

**Action**:
1. Klik "Organizer" di navigation
2. Atau langsung ke `/organizer/events/new`

**Narration**:
```
"Sekarang saya akan create event baru. 
Saya navigate ke halaman Create Event.

[Open /organizer/events/new]

Ini form untuk create event. Ada 4 section yang perlu diisi:
1. Basic Information
2. Date & Time
3. Ticketing Configuration
4. Anti-Scalping Rules"
```

---

### Part 3: Fill Form - Basic Info (1 menit)

**Action**: Isi form section 1

```
Title: "Jakarta Tech Conference 2026"
Description: "Annual technology conference featuring speakers from top tech companies. Topics include AI, blockchain, cloud computing, and cybersecurity."
Venue: "Jakarta Convention Center, Hall A"
Image URL: (leave empty or paste sample URL)
```

**Narration**:
```
"Saya akan create event untuk tech conference.

[Type title]
Title: Jakarta Tech Conference 2026

[Type description]
Description lengkap tentang event...

[Type venue]
Venue: Jakarta Convention Center

Image URL optional, bisa diisi nanti.

Next, date and time..."
```

---

### Part 4: Fill Form - Date & Time (30 detik)

**Action**: Isi section 2

```
Start Date: 2026-06-15
Start Time: 09:00
End Date: 2026-06-15
End Time: 18:00
```

**Narration**:
```
"Event ini akan diadakan tanggal 15 Juni 2026,
dari jam 9 pagi sampai 6 sore.

[Fill dates]

System akan validate bahwa event date harus di masa depan,
dan end time harus setelah start time."
```

---

### Part 5: Fill Form - Ticketing (1 menit)

**Action**: Isi section 3

```
Ticket Price: 0.02 ETH
Max Tickets: 500
Max Per Wallet: 2
```

**Narration**:
```
"Sekarang konfigurasi ticketing.

[Fill price]
Harga tiket: 0.02 ETH, sekitar 1 juta rupiah.

[Fill max tickets]
Total supply: 500 tickets

[Fill max per wallet]
Max per wallet: 2 tickets

Ini adalah fitur anti-scalping pertama. 
Dengan limit 2 per wallet, scalpers tidak bisa beli dalam jumlah banyak."
```

---

### Part 6: Fill Form - Anti-Scalping (1 menit)

**Action**: Isi section 4

```
Resale Price Cap: 110%
Resale Deadline: 6 hours
```

**Narration**:
```
"Yang membuat Tivent unique adalah anti-scalping rules.

[Fill resale cap]
Resale Price Cap: 110%
Ini berarti buyer bisa resale ticket maksimal 110% dari harga asli.
Jadi max profit hanya 10%, tidak seperti scalper yang markup 500%.

[Fill deadline]
Resale Deadline: 6 hours before event
Resale marketplace akan otomatis close 6 jam sebelum event.
Ini prevent last-minute scalping.

Semua rules ini enforced by smart contract, 
bukan by server yang bisa dimanipulasi."
```

---

### Part 7: Submit Transaction (1.5 menit)

**Action**:
1. Klik "Create Event"
2. Confirm di MetaMask
3. Wait for confirmation

**Narration**:
```
"OK, semua data sudah lengkap. Saya akan submit.

[Click Create Event]

MetaMask popup muncul untuk confirm transaction.

[Show MetaMask popup]

Disini kita bisa lihat:
- Gas fee: sekitar 0.008 ETH (about $25)
- Contract address: EventTicketing smart contract
- Function: createEvent

[Confirm transaction]

Sekarang kita tunggu blockchain confirmation...
Biasanya 30 detik sampai 1 menit di testnet.

[Wait for confirmation]

Loading... Transaction submitted...
```

---

### Part 8: Success & Verification (1 menit)

**Action**:
1. Show success message
2. Navigate to event page
3. Show event details

**Narration**:
```
"Dan... Event created!

[Show success screen]

Event sudah live on blockchain. 
Kita dapat Event ID = 1 (ini event pertama).

[Click to view event]

Sekarang saya buka event page...

[Show event page]

Perfect! Semua data sudah on-chain:
- Title, description, venue ✓
- Date & time ✓
- Ticket price: 0.02 ETH ✓
- Supply: 0/500 sold ✓
- Anti-scalping rules active ✓

User sekarang bisa beli ticket melalui page ini.

[Show purchase button]

Transaction history juga tercatat permanent di blockchain,
bisa dicek di block explorer."
```

---

### Closing (30 detik)

**Narration**:
```
"Jadi itulah cara create event di Tivent.

Keuntungan menggunakan blockchain:
1. ✅ Transparent - semua transaction public
2. ✅ Tamper-proof - data tidak bisa diubah
3. ✅ Anti-scalping - rules enforced by code
4. ✅ Ownership proof - ticket adalah NFT
5. ✅ Provenance tracking - full ownership history

Platform ini solve masalah real di industri ticketing:
scalping, fake tickets, dan lack of transparency.

Terima kasih! Ada pertanyaan?"
```

---

## 📊 Key Points untuk Ditekankan

### 1. **Decentralization**
- Tidak ada central server
- Direct wallet-to-contract interaction
- No middleman fees (except gas)

### 2. **Smart Contract Enforcement**
- Anti-scalping rules di-enforce by code
- Tidak bisa dibypass atau dimanipulasi
- Transparent dan auditable

### 3. **NFT Tickets**
- Setiap ticket adalah NFT unique
- Proof of ownership on-chain
- Tradeable di marketplace (dengan rules)

### 4. **Transparency**
- Semua transactions public
- Lihat di block explorer
- Full audit trail

### 5. **User Experience**
- Simple UI (familiar web2 experience)
- MetaMask integration seamless
- Real-time blockchain updates

---

## 🎥 Demo Tips

### Preparation
- [ ] Test wallet terisi ETH cukup (0.5 ETH)
- [ ] MetaMask unlocked & ready
- [ ] Browser console closed (clean UI)
- [ ] Form data prepared (copy-paste ready)
- [ ] Backup plan if transaction gagal

### During Demo
- ✅ Speak clearly & slowly
- ✅ Show MetaMask popup (transparency)
- ✅ Explain technical terms when first mentioned
- ✅ Pause for questions
- ✅ Have block explorer open in another tab

### Common Questions (Prepare Answers)

**Q: "Apa bedanya dengan Eventbrite/Ticketmaster?"**
```
A: Platform traditional itu centralized - mereka control data,
pricing, dan bisa manipulate supply. Tivent fully transparent,
rules enforced by code, dan user own their tickets as NFTs.
```

**Q: "Gas fee nya mahal ya?"**
```
A: Di Ethereum mainnet memang $15-$60 per event creation.
Tapi kita bisa deploy ke Polygon atau BSC yang gas fee-nya < $1.
Untuk organizer yang create 1 event, ini worthwhile untuk
transparent & anti-scalping benefits.
```

**Q: "Bagaimana kalau user tidak punya crypto?"**
```
A: Kita sudah implement Xendit integration. User bisa bayar
pakai Rupiah, dan backend automatically convert & mint ticket.
Best of both worlds - easy payment, blockchain ownership.
```

**Q: "Apakah scalpers bisa bypass dengan multiple wallets?"**
```
A: Mereka bisa buat multiple wallets, tapi:
1. Tiket limit per wallet enforce by contract
2. Resale price cap limit profit margin
3. Fraud detection system track suspicious patterns
4. Gas fee cost untuk multiple wallets cukup tinggi

Jadi technically bisa, but economically tidak menguntungkan.
```

---

## 🔍 Post-Demo Actions

### Show Additional Features
1. **Organizer Dashboard**
   - View sales stats
   - Ticket holders list
   - Revenue tracking

2. **Purchase Flow**
   - How users buy tickets
   - Dual payment (crypto/fiat)

3. **Resale Marketplace**
   - Price cap enforcement
   - Deadline mechanism

4. **Fraud Detection**
   - Risk scoring
   - Suspicious activity alerts

5. **Ownership History**
   - Provenance tracking
   - Transfer history

### Open Block Explorer
```
"Mari kita lihat transaction di block explorer..."
[Open Etherscan/Polygonscan]

"Ini adalah proof bahwa event benar-benar on-chain.
Semua orang bisa verify data ini."
```

---

## ✅ Demo Checklist

**Before Demo:**
- [ ] Local server running (`npm run dev`)
- [ ] Blockchain node/RPC working
- [ ] MetaMask configured correctly
- [ ] Wallet has sufficient ETH
- [ ] Form data prepared
- [ ] Script reviewed

**During Demo:**
- [ ] Wallet connected successfully
- [ ] Form filled completely
- [ ] Transaction confirmed
- [ ] Event visible on platform
- [ ] Block explorer shown

**After Demo:**
- [ ] Questions answered
- [ ] Additional features shown
- [ ] Code walkthrough (if requested)
- [ ] Documentation shared

---

Good luck with your demo! 🚀
