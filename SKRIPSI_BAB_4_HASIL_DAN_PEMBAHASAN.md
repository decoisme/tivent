# BAB IV
# HASIL DAN PEMBAHASAN

---

## 4.1 Arsitektur Sistem

### 4.1.1 Arsitektur Keseluruhan

Sistem Tivent dikembangkan dengan arsitektur *multi-layer* yang mengintegrasikan komponen *on-chain* (blockchain) dan *off-chain* (server dan database). Arsitektur ini dirancang agar setiap layer memiliki tanggung jawab yang jelas dan dapat berkomunikasi satu sama lain secara terstruktur. Gambar 4.1 menunjukkan diagram arsitektur keseluruhan sistem.

```
┌─────────────────────────────────────────────────────────────────┐
│                        END USERS                                 │
│              (Web Browser / Mobile Browser)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                     FRONTEND LAYER                               │
│                    Next.js 14 (App Router)                        │
│     ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐    │
│     │  Pages  │  │Components│  │  Hooks   │  │ Providers  │    │
│     └────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘    │
│          └────────────┴────────────┴──────────────┘              │
└──────────────────────────┬──────────────────────────────────────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌────────────┐ ┌─────────────────┐
│  BACKEND API    │ │ BLOCKCHAIN │ │ PAYMENT GATEWAY  │
│  Next.js API    │ │  Polygon   │ │    Xendit         │
│  Routes         │ │  Amoy      │ │    (Sandbox)      │
│                 │ │  Testnet   │ │                   │
│ ┌─────────────┐ │ │            │ │  7 metode bayar   │
│ │ Fraud       │ │ │ Smart      │ │  VA, E-wallet,    │
│ │ Detection   │ │ │ Contract   │ │  Card, QRIS,      │
│ │ (Rule-based)│ │ │ ERC-721    │ │  Retail            │
│ └─────────────┘ │ │            │ │                   │
└────────┬────────┘ └────────────┘ └───────────────────┘
         │
         ▼
┌─────────────────┐
│   DATABASE      │
│   PostgreSQL    │
│   (Supabase)    │
│                 │
│   8 tabel       │
│   25 indeks     │
└─────────────────┘
```

**Gambar 4.1** Diagram Arsitektur Sistem Tivent

Arsitektur sistem terdiri dari lima layer utama:

1. **Frontend Layer** — Dibangun menggunakan Next.js 14 dengan App Router dan React 18 menggunakan TypeScript. Layer ini menangani antarmuka pengguna dan interaksi dengan blockchain melalui library viem dan wagmi.

2. **Backend API Layer** — Menggunakan Next.js API Routes (Route Handlers) untuk menangani logika bisnis server-side, termasuk sistem deteksi fraud, pemrosesan webhook pembayaran, dan sinkronisasi data antara blockchain dan database.

3. **Blockchain Layer** — Smart contract `EventTicketing` di-deploy pada jaringan Polygon Amoy Testnet (Chain ID: 80002). Kontrak ini mengelola pembuatan event, minting tiket sebagai NFT (ERC-721), proses resale dengan mekanisme price cap, dan redemption tiket.

4. **Payment Layer** — Integrasi dengan Xendit Payment Gateway dalam mode sandbox untuk simulasi pembayaran, mendukung tujuh kategori metode pembayaran (Virtual Account, E-wallet, Kartu Kredit/Debit, Retail Outlet, dan QRIS).

5. **Database Layer** — PostgreSQL yang di-hosting pada Supabase, menyimpan data off-chain seperti metadata event, riwayat transaksi, data pengguna, nonce QR Code, dan catatan deteksi fraud. Database terdiri dari 8 tabel dengan 25 indeks.

### 4.1.2 Technology Stack

Tabel 4.1 menyajikan technology stack yang digunakan dalam implementasi sistem.

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Frontend Framework | Next.js (App Router) | 14 |
| UI Library | React | 18 |
| Bahasa Pemrograman | TypeScript | 5.3.3 |
| Styling | Tailwind CSS | 3.4.0 |
| Blockchain Library | viem | 2.x |
| Wallet Integration | wagmi | 2.x |
| Smart Contract | Solidity | 0.8.24 |
| Token Standard | ERC-721 (OpenZeppelin) | 5.0.0 |
| Development Tool | Hardhat | 2.19.2 |
| Database | PostgreSQL (Supabase) | 15+ |
| Payment Gateway | Xendit | sandbox |
| QR Code Generator | qrcode | 1.5.4 |
| QR Code Scanner | jsQR | 1.4.0 |
| Animasi | GSAP | 3.15.0 |
| Ikon | Lucide React | — |
| Jaringan Blockchain | Polygon Amoy Testnet | Chain ID: 80002 |

**Tabel 4.1** Technology Stack Sistem Tivent

### 4.1.3 Struktur Direktori Proyek

Proyek Tivent diorganisir dengan struktur direktori sebagai berikut:

```
Tivent/
├── contracts/                    # Smart contract (Hardhat project)
│   ├── contracts/
│   │   └── EventTicketing.sol    # Smart contract utama (801 baris)
│   ├── test/                     # Unit test smart contract
│   └── scripts/                  # Script deployment
├── src/                          # Source code aplikasi web
│   ├── app/                      # Next.js App Router pages
│   │   ├── events/               # Halaman event & pembelian tiket
│   │   ├── tickets/              # Halaman tiket & QR Code
│   │   ├── resale/               # Halaman resale marketplace
│   │   ├── marketplace/          # Halaman marketplace
│   │   ├── gate/                 # Halaman gate scanner
│   │   ├── organizer/            # Dashboard organizer
│   │   ├── admin/                # Admin panel (fraud management)
│   │   └── api/                  # API routes
│   ├── components/               # Komponen React (13 komponen)
│   ├── hooks/                    # Custom React hooks (9 hooks)
│   ├── lib/                      # Library utilities (11 modul)
│   ├── providers/                # Context providers
│   └── types/                    # TypeScript type definitions
├── supabase/                     # Database schema & migrations
│   ├── schema.sql                # Schema database (8 tabel)
│   └── seed.sql                  # Data seed
└── public/                       # Aset statis
```

---

## 4.2 Implementasi Smart Contract

### 4.2.1 Gambaran Umum Kontrak

Smart contract `EventTicketing` merupakan inti dari sistem Tivent yang mengelola seluruh logika bisnis on-chain. Kontrak ini ditulis dalam bahasa Solidity versi 0.8.24 dan di-deploy pada jaringan Polygon Amoy Testnet dengan alamat `0xF296c0191760541028e72Ae093C3771032aEfA3C`.

Kontrak mewarisi lima kontrak dari library OpenZeppelin:

```solidity
contract EventTicketing is 
    ERC721,              // Standar NFT
    ERC721URIStorage,    // Metadata URI per token
    Ownable,             // Kontrol akses admin
    ReentrancyGuard,     // Perlindungan reentrancy attack
    Pausable             // Mekanisme emergency stop
{ ... }
```

**Tabel 4.2** Inheritance Smart Contract EventTicketing

| Kontrak Induk | Fungsi |
|---------------|--------|
| `ERC721` | Implementasi standar NFT — setiap tiket adalah token unik dengan kepemilikan yang tercatat on-chain |
| `ERC721URIStorage` | Penyimpanan metadata URI per token untuk menyimpan informasi tiket |
| `Ownable` | Pembatasan akses fungsi administratif hanya untuk pemilik kontrak |
| `ReentrancyGuard` | Pencegahan serangan reentrancy pada fungsi yang melibatkan transfer dana (`buyTicket`, `buyResale`, `claimRefund`) |
| `Pausable` | Kemampuan menghentikan sementara seluruh operasi kontrak dalam keadaan darurat |

### 4.2.2 Struktur Data On-Chain

Smart contract menyimpan data dalam beberapa struct dan mapping. Tabel 4.3 menjelaskan struct utama yang digunakan.

**Tabel 4.3** Struktur Data Utama Smart Contract

| Struct | Field | Tipe | Keterangan |
|--------|-------|------|------------|
| **EventData** | `eventId` | `uint256` | ID unik event |
| | `organizer` | `address` | Alamat wallet penyelenggara |
| | `metadataURI` | `string` | URI metadata event |
| | `ticketTypesCount` | `uint256` | Jumlah tipe tiket (maks. 10) |
| | `maxTickets` | `uint256` | Kapasitas total tiket |
| | `ticketsSold` | `uint256` | Jumlah tiket terjual |
| | `maxTicketsPerWallet` | `uint256` | Batas pembelian per wallet |
| | `resalePriceCap` | `uint256` | Batas harga resale (basis points, 10000 = 100%) |
| | `resaleDeadline` | `uint256` | Batas waktu resale (Unix timestamp) |
| | `primarySaleActive` | `bool` | Status penjualan primer |
| | `resaleActive` | `bool` | Status marketplace resale |
| | `cancelled` | `bool` | Status pembatalan event |
| **TicketData** | `eventId` | `uint256` | ID event terkait |
| | `ticketTypeId` | `uint256` | ID tipe tiket |
| | `originalPrice` | `uint256` | Harga asli (dalam wei) |
| | `resaleCount` | `uint8` | Jumlah kali di-resale (maks. 3) |
| | `maxResaleCount` | `uint8` | Batas maksimum resale |
| | `redeemed` | `bool` | Status penggunaan tiket |
| | `active` | `bool` | Status keaktifan tiket |
| **Listing** | `ticketId` | `uint256` | ID tiket yang dijual |
| | `seller` | `address` | Alamat penjual |
| | `price` | `uint256` | Harga listing (dalam wei) |
| | `active` | `bool` | Status listing aktif |
| **TicketType** | `typeId` | `uint256` | ID tipe tiket |
| | `name` | `string` | Nama tipe (VIP, Regular, dll.) |
| | `price` | `uint256` | Harga per tiket |
| | `maxSupply` | `uint256` | Jumlah maksimum tiket tipe ini |
| | `sold` | `uint256` | Jumlah terjual |
| | `active` | `bool` | Status ketersediaan |

### 4.2.3 Fungsi Inti Smart Contract

Smart contract memiliki total 35 fungsi yang terbagi ke dalam beberapa kategori. Tabel 4.4 menyajikan ringkasan fungsi-fungsi inti.

**Tabel 4.4** Fungsi Inti Smart Contract EventTicketing

| Kategori | Fungsi | Deskripsi |
|----------|--------|-----------|
| **Pembuatan Event** | `createEvent()` | Membuat event dengan satu tipe tiket |
| | `createEventWithTypes()` | Membuat event dengan beberapa tipe tiket (maks. 10) |
| **Pembelian Tiket** | `buyTicket()` | Membeli tiket pada penjualan primer — minting NFT ke wallet pembeli |
| **Resale Marketplace** | `listForResale()` | Mendaftarkan tiket untuk dijual kembali dengan validasi price cap |
| | `cancelResale()` | Membatalkan listing resale |
| | `buyResale()` | Membeli tiket dari marketplace sekunder — transfer atomik NFT dan dana |
| **Verifikasi Tiket** | `redeemTicket()` | Menandai tiket sebagai sudah digunakan (hanya oleh gate officer) |
| | `isTicketValid()` | Memeriksa validitas tiket untuk masuk |
| **Manajemen Event** | `setPrimarySaleActive()` | Mengaktifkan/menonaktifkan penjualan primer |
| | `setResaleActive()` | Mengaktifkan/menonaktifkan marketplace resale |
| | `cancelEvent()` | Membatalkan event (mengaktifkan mekanisme refund) |
| **Refund** | `claimRefund()` | Klaim pengembalian dana untuk event yang dibatalkan |
| **Gate Officer** | `addGateOfficer()` | Menambahkan petugas gate (hanya admin) |
| | `removeGateOfficer()` | Menghapus petugas gate |
| **Admin** | `pause()` / `unpause()` | Menghentikan/melanjutkan operasi kontrak |
| | `emergencyWithdraw()` | Penarikan dana darurat |

### 4.2.4 Mekanisme Anti-Scalping

Implementasi anti-scalping pada smart contract terdiri dari empat mekanisme utama yang di-enforce secara on-chain, sehingga tidak dapat dilewati (*bypass*) oleh pihak manapun.

#### a. Price Cap (Pembatasan Harga Resale)

Mekanisme price cap menggunakan sistem *basis points* di mana 10000 = 100%. Penyelenggara event dapat menetapkan batas harga resale antara 100% hingga 200% dari harga asli. Berikut implementasinya pada fungsi `listForResale()`:

```solidity
function listForResale(uint256 tokenId, uint256 price) external {
    // ... validasi kepemilikan dan status tiket ...
    
    // Menghitung harga maksimum berdasarkan price cap
    uint256 maxPrice = (ticket.originalPrice * eventData.resalePriceCap) / 10000;
    require(price <= maxPrice, "Price exceeds cap");
    
    // ... membuat listing ...
}
```

Sebagai contoh, jika harga asli tiket adalah 1.000.000 IDR dan `resalePriceCap` ditetapkan 15000 (150%), maka harga resale maksimum adalah 1.500.000 IDR. Transaksi resale dengan harga di atas batas ini akan otomatis ditolak oleh smart contract melalui pernyataan `require`.

#### b. Pembatasan Pembelian Per Wallet

Setiap event memiliki parameter `maxTicketsPerWallet` yang membatasi jumlah tiket yang dapat dibeli oleh satu wallet address. Validasi dilakukan pada fungsi `buyTicket()`:

```solidity
require(
    ticketsPurchasedByWallet[eventId][msg.sender] < eventData.maxTicketsPerWallet,
    "Purchase limit exceeded"
);
```

Mekanisme ini mengurangi kemampuan scalper untuk melakukan pembelian massal menggunakan satu wallet, meskipun tidak sepenuhnya mencegah penggunaan multiple wallet oleh satu individu.

#### c. Pembatasan Jumlah Resale

Setiap tiket memiliki batas maksimum jumlah kali dapat di-resale, yang ditetapkan sebanyak 3 kali (`maxResaleCount = 3`). Setiap kali tiket berhasil dijual kembali, counter `resaleCount` bertambah:

```solidity
// Pada fungsi buyResale()
require(ticket.resaleCount < ticket.maxResaleCount, "Max resale count reached");
ticket.resaleCount++;
```

#### d. Batas Waktu Resale (Resale Deadline)

Setiap event memiliki parameter `resaleDeadline` berupa Unix timestamp yang menentukan batas akhir resale diperbolehkan. Validasi dilakukan pada fungsi listing dan pembelian:

```solidity
require(block.timestamp < eventData.resaleDeadline, "Resale deadline passed");
```

### 4.2.5 Mekanisme Transfer Atomik pada Resale

Proses resale menggunakan mekanisme transfer atomik (*atomic swap*) pada fungsi `buyResale()`, yang memastikan bahwa transfer NFT dan transfer dana terjadi dalam satu transaksi yang tidak dapat dipisahkan:

```solidity
function buyResale(uint256 tokenId) external payable nonReentrant {
    // 1. Validasi listing, pembayaran, dan status
    require(listing.active, "Listing not active");
    require(msg.value == listing.price, "Incorrect payment amount");
    
    // 2. Tutup listing terlebih dahulu (Checks-Effects-Interactions pattern)
    listing.active = false;
    
    // 3. Tambah counter resale
    ticket.resaleCount++;
    
    // 4. Transfer NFT dari penjual ke pembeli
    _transfer(seller, msg.sender, tokenId);
    
    // 5. Transfer pembayaran ke penjual
    (bool success, ) = payable(seller).call{value: msg.value}("");
    require(success, "Payment transfer failed");
    
    emit TicketResold(tokenId, seller, msg.sender, listing.price);
}
```

Implementasi ini menerapkan pola *Checks-Effects-Interactions* untuk mencegah serangan reentrancy: (1) validasi dilakukan terlebih dahulu (Checks), (2) perubahan state diterapkan sebelum interaksi eksternal (Effects), dan (3) transfer dana dilakukan terakhir (Interactions). Modifier `nonReentrant` dari OpenZeppelin memberikan lapisan perlindungan tambahan.

### 4.2.6 Event Log untuk Transparansi

Smart contract memancarkan (*emit*) 12 jenis event log yang tercatat secara permanen di blockchain dan dapat diakses oleh siapa saja. Tabel 4.5 menyajikan event log utama.

**Tabel 4.5** Event Log Smart Contract

| Event | Deskripsi | Data yang Dicatat |
|-------|-----------|-------------------|
| `EventCreated` | Event baru dibuat | eventId, organizer, metadataURI, ticketTypesCount |
| `TicketMinted` | Tiket baru di-mint | tokenId, eventId, buyer, price |
| `TicketListed` | Tiket didaftarkan untuk resale | tokenId, seller, price |
| `TicketDelisted` | Listing resale dibatalkan | tokenId |
| `TicketResold` | Tiket berhasil dijual kembali | tokenId, from, to, price |
| `TicketRedeemed` | Tiket digunakan di gerbang masuk | tokenId, holder, eventId |
| `EventCancelled` | Event dibatalkan | eventId, organizer |
| `RefundClaimed` | Refund diklaim oleh pemegang tiket | tokenId, holder, amount |
| `GateOfficerAdded` | Petugas gate ditambahkan | officer address |
| `GateOfficerRemoved` | Petugas gate dihapus | officer address |

Event log ini dimanfaatkan oleh frontend untuk membangun *ownership history* tiket dan menampilkan riwayat transfer secara transparan kepada pengguna.

### 4.2.7 Estimasi Biaya Gas

Tabel 4.6 menyajikan estimasi biaya gas untuk setiap operasi smart contract pada jaringan Polygon Amoy.

**Tabel 4.6** Estimasi Biaya Gas Operasi Smart Contract

| Fungsi | Gas (estimasi) | Biaya (pada 30 gwei) |
|--------|----------------|---------------------|
| `createEvent()` | ~250.000 | ~$0,002 |
| `createEventWithTypes()` (3 tipe) | ~350.000 | ~$0,003 |
| `buyTicket()` | ~120.000 | ~$0,001 |
| `listForResale()` | ~60.000 | ~$0,0005 |
| `buyResale()` | ~100.000 | ~$0,0008 |
| `redeemTicket()` | ~50.000 | ~$0,0004 |
| `cancelResale()` | ~35.000 | ~$0,0003 |

Biaya gas yang rendah dimungkinkan oleh penggunaan jaringan Polygon sebagai *Layer 2 scaling solution*, yang menawarkan biaya transaksi secara signifikan lebih rendah dibandingkan Ethereum Layer 1.

---

## 4.3 Implementasi Dynamic QR Code

### 4.3.1 Arsitektur Dynamic QR Code

Dynamic QR Code merupakan mekanisme verifikasi tiket yang dirancang untuk mencegah duplikasi tiket melalui tangkapan layar (*screenshot*) atau penyalinan. Berbeda dengan QR Code statis yang kontennya tetap, Dynamic QR Code pada sistem Tivent mengandung payload yang berubah setiap 30 detik dan menyertakan informasi keamanan berupa *timestamp* dan tanda tangan kriptografis.

### 4.3.2 Struktur Payload QR Code

Setiap QR Code yang dihasilkan mengandung payload JSON dengan struktur sebagai berikut:

```typescript
interface QRPayload {
  tokenId: number;     // ID tiket (NFT token ID)
  owner: string;       // Alamat wallet pemilik tiket
  timestamp: number;   // Unix timestamp saat QR dibuat (milidetik)
  signature: string;   // Hash SHA-256 sebagai tanda tangan
}
```

Field `signature` dihasilkan melalui proses hashing SHA-256 menggunakan Web Crypto API (`crypto.subtle.digest`), dengan input berupa gabungan string `tokenId`, `owner`, dan `timestamp`. Hal ini memastikan bahwa setiap QR Code terikat pada kombinasi unik antara ID tiket, pemilik, dan waktu pembuatan.

### 4.3.3 Proses Pembuatan QR Code

Proses pembuatan Dynamic QR Code dilakukan di sisi klien (*client-side*) dengan alur sebagai berikut:

1. Sistem memeriksa kepemilikan tiket pada blockchain melalui fungsi `ownerOf()`.
2. Jika pengguna terverifikasi sebagai pemilik, sistem membuat payload dengan timestamp saat ini.
3. Signature di-generate menggunakan SHA-256: `hash(tokenId + "-" + owner + "-" + timestamp)`.
4. Payload di-encode menjadi JSON string dan di-render sebagai QR Code menggunakan library `qrcode`.
5. QR Code ditampilkan dengan level koreksi error H (30% recovery) dan ukuran 400×400 piksel.
6. Timer countdown 30 detik ditampilkan. Setelah 30 detik, QR Code di-regenerate secara otomatis.

```typescript
// Regenerasi QR Code setiap 30 detik
useEffect(() => {
  if (ticket && isOwner && address) {
    generateNewQR();
    const interval = setInterval(() => {
      generateNewQR();
    }, 30000);  // 30 detik
    return () => clearInterval(interval);
  }
}, [ticket, isOwner, address]);
```

### 4.3.4 Proses Verifikasi QR Code di Gerbang Masuk

Verifikasi dilakukan oleh petugas gate (*gate officer*) melalui halaman Gate Scanner. Proses verifikasi meliputi lima tahapan pengecekan:

**Tabel 4.7** Tahapan Verifikasi Dynamic QR Code

| Tahap | Pengecekan | Aksi jika Gagal |
|-------|-----------|-----------------|
| 1 | **Parse QR Data** — Validasi format JSON dan struktur payload | Ditolak: "Invalid QR code format" |
| 2 | **Validasi Signature** — Hitung ulang hash SHA-256 dan bandingkan dengan signature di payload | Ditolak: "QR code expired or invalid signature" |
| 3 | **Validasi Timestamp** — Pastikan timestamp dalam jendela 30 detik terakhir (`timeDiff <= 30.000ms`) | Ditolak: "QR code expired" |
| 4 | **Verifikasi Kepemilikan Blockchain** — Panggil `ownerOf(tokenId)` dan bandingkan dengan `payload.owner` | Ditolak: "Ownership verification failed" |
| 5 | **Cek Status Tiket** — Pastikan tiket belum di-redeem (`!redeemed`) dan masih aktif (`active`) | Ditolak: "Ticket already used" / "Ticket is not active" |

Implementasi validasi timestamp memastikan QR Code yang sudah kadaluarsa tidak dapat digunakan:

```typescript
async function validateQRPayload(payload: QRPayload): Promise<boolean> {
  // Verifikasi signature
  const expectedSignature = await generateQRSignature(
    payload.tokenId, payload.owner, payload.timestamp
  );
  if (payload.signature !== expectedSignature) return false;

  // Verifikasi timestamp (maksimum 30 detik)
  const now = Date.now();
  const timeDiff = now - payload.timestamp;
  const maxAge = 30 * 1000; // 30 detik
  if (timeDiff < 0 || timeDiff > maxAge) return false;

  return true;
}
```

### 4.3.5 Keunggulan Keamanan Dynamic QR Code

Mekanisme Dynamic QR Code menyediakan beberapa lapisan keamanan:

1. **Anti-screenshot**: QR Code kadaluarsa setelah 30 detik, sehingga tangkapan layar yang dikirimkan ke pihak lain kemungkinan besar sudah tidak valid saat di-scan.

2. **Binding ke pemilik**: Signature mengikat QR Code ke alamat wallet pemilik yang sah. Jika tiket sudah ditransfer ke wallet lain (melalui resale), QR Code yang dibuat oleh pemilik sebelumnya akan gagal pada tahap verifikasi kepemilikan.

3. **Verifikasi on-chain real-time**: Setiap scan QR Code memicu pengecekan kepemilikan langsung ke blockchain, memastikan data kepemilikan yang diverifikasi adalah data terkini.

4. **Single-use enforcement**: Setelah tiket di-redeem melalui fungsi `redeemTicket()` pada smart contract, status `redeemed` menjadi `true` secara permanen dan tidak dapat diubah, mencegah penggunaan ulang.

---

## 4.4 Implementasi Antarmuka Pengguna

### 4.4.1 Modul-Modul Antarmuka

Antarmuka pengguna sistem Tivent dikembangkan sebagai aplikasi web responsif menggunakan Next.js 14 dengan App Router. Sistem memiliki empat modul antarmuka utama berdasarkan aktor pengguna:

**Tabel 4.8** Modul Antarmuka Pengguna

| Modul | Aktor | Halaman Utama | Fungsi |
|-------|-------|---------------|--------|
| **Buyer Module** | Pembeli tiket | `/events`, `/events/[id]/purchase`, `/tickets`, `/tickets/[id]/qr` | Melihat event, membeli tiket, melihat tiket yang dimiliki, menampilkan QR Code untuk masuk |
| **Marketplace Module** | Penjual & pembeli resale | `/resale`, `/marketplace`, `/resale/[id]` | Mendaftarkan tiket untuk resale, melihat dan membeli tiket dari marketplace |
| **Organizer Module** | Penyelenggara event | `/organizer` | Dashboard analitik, manajemen event, melihat penjualan dan pendapatan |
| **Gate Officer Module** | Petugas gate | `/gate`, `/gate/redeem/[id]` | Scan QR Code tiket, verifikasi multi-layer, melakukan redemption tiket on-chain |
| **Admin Module** | Administrator | `/admin`, `/admin/fraud` | Manajemen fraud flags, monitoring aktivitas mencurigakan, manajemen gate officer |

### 4.4.2 Halaman Pembelian Tiket

Halaman pembelian tiket (`/events/[id]/purchase`) merupakan salah satu halaman kritis dalam sistem. Halaman ini menampilkan:

- Informasi detail event (judul, tanggal, venue).
- Daftar tipe tiket yang tersedia beserta harga dan ketersediaan.
- Selektor jumlah tiket dengan validasi batas per wallet.
- Kalkulasi total harga dengan konversi ke mata uang POL (Polygon).
- Integrasi langsung dengan wallet pengguna untuk eksekusi transaksi blockchain melalui hook `useEventTicketing`.

Pembelian tiket memerlukan koneksi wallet (MetaMask atau wallet Web3 lainnya) dan melibatkan transaksi blockchain yang men-trigger fungsi `buyTicket()` pada smart contract, yang secara atomik minting NFT tiket ke wallet pembeli dan mentransfer pembayaran ke wallet penyelenggara.

### 4.4.3 Halaman Dynamic QR Code

Halaman QR Code (`/tickets/[id]/qr`) menampilkan *digital pass* dalam format kartu yang berisi:

- Header dengan informasi event (judul, venue, tanggal).
- QR Code dinamis di bagian tengah dengan latar putih untuk memudahkan scanning.
- Timer countdown yang menunjukkan sisa waktu validitas QR Code (30 detik).
- Progress bar visual yang berkurang secara linear seiring berjalannya waktu.
- Keterangan keamanan yang menginformasikan pengguna bahwa QR Code bersifat sementara dan terikat ke pemilik.

### 4.4.4 Halaman Gate Scanner

Halaman Gate Scanner (`/gate`) menyediakan antarmuka bagi petugas gate untuk memverifikasi tiket. Halaman ini terdiri dari:

- Panel kamera untuk scan QR Code menggunakan komponen `QRScanner` yang memanfaatkan library jsQR dan react-webcam.
- Panel hasil verifikasi yang menampilkan status (VALID / INVALID) beserta detail tiket.
- Tombol "Admit Guest" untuk melakukan redemption tiket on-chain.
- Indikator keamanan yang menunjukkan lima jenis pengecekan yang dilakukan (QR signature, timestamp window, blockchain ownership, duplicate prevention, dan ticket status).

### 4.4.5 Marketplace Resale

Halaman marketplace (`/marketplace` dan `/resale`) memungkinkan:

- **Penjual**: Mendaftarkan tiket yang dimiliki untuk dijual kembali. Sistem memvalidasi harga yang ditetapkan terhadap price cap yang di-enforce oleh smart contract. Jika harga melebihi batas, transaksi listing akan gagal.

- **Pembeli**: Melihat daftar tiket yang tersedia di marketplace, dengan informasi harga asli, harga resale, dan persentase markup/diskon. Pembelian dilakukan melalui smart contract `buyResale()` yang secara atomik mentransfer NFT dan dana.

---

## 4.5 Implementasi Sistem Deteksi Fraud

### 4.5.1 Pendekatan Rule-Based Scoring

Sistem deteksi fraud pada Tivent menggunakan pendekatan *rule-based scoring* yang mengevaluasi perilaku wallet address berdasarkan lima kategori pengecekan. Setiap kategori memiliki bobot skor yang berkontribusi pada total risk score (0–100).

**Tabel 4.9** Kategori Pengecekan Fraud Detection

| # | Kategori | Bobot Skor | Kondisi Flag |
|---|----------|------------|--------------|
| 1 | **Rapid Purchasing** | +25 poin | Lebih dari 10 pembelian dalam 1 jam, atau lebih dari 2 pembelian dengan interval kurang dari 5 detik |
| 2 | **Excessive Resale** | +30 poin | Lebih dari 80% tiket yang dimiliki didaftarkan untuk resale, atau lebih dari 15 tiket telah dijual kembali |
| 3 | **Price Manipulation** | +35 poin | Lebih dari 50% listing memiliki markup di atas 300% |
| 4 | **Bot Behavior** | +40 poin | Interval transaksi sangat seragam (coefficient of variation < 0,1), atau akun baru (<24 jam) dengan lebih dari 20 transaksi |
| 5 | **Wash Trading** | +45 poin | Terjadi perdagangan berulang dengan 3 atau lebih alamat yang sama |

### 4.5.2 Klasifikasi Tingkat Risiko

Total risk score diklasifikasikan ke dalam empat tingkat risiko:

**Tabel 4.10** Klasifikasi Tingkat Risiko

| Risk Level | Rentang Skor | Aksi Sistem |
|------------|--------------|-------------|
| **LOW** | 0–24 | Transaksi diizinkan tanpa hambatan |
| **MEDIUM** | 25–49 | Transaksi diizinkan, ditandai untuk review manual |
| **HIGH** | 50–74 | Wallet otomatis di-flag, memerlukan verifikasi tambahan |
| **CRITICAL** | 75–100 | Wallet otomatis di-flag, transaksi berpotensi diblokir |

Ketika wallet terdeteksi pada level HIGH atau CRITICAL, sistem secara otomatis membuat entri *fraud flag* pada tabel `fraud_flags` di database melalui fungsi `flagWalletForFraud()`.

### 4.5.3 Dashboard Fraud Management

Administrator dapat memantau dan mengelola fraud flags melalui halaman `/admin/fraud` yang menampilkan:

- **Metrik ringkasan**: Total flags, flags aktif, flags yang sudah di-resolve, dan distribusi berdasarkan risk level.
- **Daftar fraud flags**: Setiap flag menampilkan wallet address, flag type, risk score, risk level, alasan deteksi, dan waktu flagging.
- **Aksi pengelolaan**: Administrator dapat menandai flag sebagai resolved atau membatalkan resolusi jika diperlukan.
- **Filter dan pencarian**: Berdasarkan status (aktif/resolved), risk level, dan wallet address.

---

## 4.6 Implementasi Basis Data Off-Chain

### 4.6.1 Skema Database

Basis data PostgreSQL pada Supabase terdiri dari 8 tabel utama yang menyimpan data off-chain. Tabel 4.11 menyajikan ringkasan skema database.

**Tabel 4.11** Ringkasan Skema Database

| Tabel | Jumlah Kolom | Fungsi | Relasi |
|-------|-------------|--------|--------|
| `events` | 20 | Menyimpan metadata event dan konfigurasi | — |
| `ticket_types` | 8 | Menyimpan konfigurasi tipe tiket per event | FK → events |
| `tickets` | 11 | Menyimpan metadata tiket yang di-mint | FK → events |
| `resale_listings` | 8 | Mencatat listing dan riwayat resale | FK → tickets |
| `users` | 10 | Data akun pengguna | — |
| `transactions` | 11 | Riwayat transaksi pembayaran | FK → users, events |
| `qr_nonces` | 4 | Mencatat nonce QR yang sudah digunakan (anti-replay) | FK → tickets |
| `fraud_checks` | 10 | Menyimpan hasil pengecekan fraud | FK → users, transactions |

Database menggunakan total 25 indeks untuk optimasi query. Selain itu, terdapat tabel `fraud_flags` yang digunakan oleh sistem deteksi fraud untuk mencatat wallet yang di-flag.

### 4.6.2 Sinkronisasi Data On-Chain dan Off-Chain

Sistem menggunakan mekanisme *event listener* yang memantau event log dari smart contract dan menyinkronkan data ke database off-chain. Proses ini memastikan bahwa database selalu memiliki salinan terkini dari data yang tercatat di blockchain, sehingga query yang membutuhkan pencarian dan filtering kompleks dapat dilayani dengan efisien oleh database tanpa perlu membaca langsung dari blockchain untuk setiap request.

---

## 4.7 Integrasi Pembayaran

### 4.7.1 Konfigurasi Xendit

Sistem terintegrasi dengan Xendit Payment Gateway dalam mode *sandbox* (development), mendukung tujuh kategori metode pembayaran yang umum digunakan di Indonesia:

**Tabel 4.12** Metode Pembayaran yang Didukung

| Kategori | Provider | Mekanisme |
|----------|----------|-----------|
| Virtual Account | BCA, Mandiri, BNI, BRI, Permata | Transfer bank ke nomor VA unik |
| E-Wallet | OVO, Dana, LinkAja, ShopeePay | Redirect ke aplikasi e-wallet |
| Kartu Kredit/Debit | Visa, Mastercard, JCB | Input kartu + 3D Secure |
| Retail Outlet | Alfamart, Indomaret | Kode pembayaran di kasir |
| QRIS | Standar nasional | Scan QR dengan aplikasi perbankan |

### 4.7.2 Alur Pembayaran

Alur pembayaran mengikuti model asinkron berbasis webhook:

1. Pengguna memilih tiket dan metode pembayaran.
2. Sistem membuat invoice melalui API Xendit.
3. Pengguna diarahkan ke halaman pembayaran Xendit.
4. Pengguna menyelesaikan pembayaran melalui metode yang dipilih.
5. Xendit mengirim webhook callback ke endpoint `/api/xendit`.
6. Sistem memverifikasi callback token dan memproses pembayaran.
7. Jika pembayaran berhasil, sistem men-trigger minting NFT tiket pada blockchain.
8. Konfirmasi dikirimkan ke pengguna.

---

## 4.8 Riwayat Kepemilikan Tiket

### 4.8.1 Implementasi Ownership History

Sistem menyediakan fitur pelacakan riwayat kepemilikan tiket yang sepenuhnya berbasis data on-chain. Modul `ownershipHistory.ts` membaca event log `Transfer`, `TicketListed`, `TicketResold`, dan `TicketRedeemed` dari blockchain melalui RPC Alchemy, kemudian menyusunnya menjadi *ownership chain* yang komprehensif.

Informasi yang ditampilkan dalam ownership history meliputi:

- **Timeline kepemilikan**: Mulai dari minting, setiap transfer, hingga redemption.
- **Riwayat harga**: Harga asli, harga tertinggi, harga terendah, dan total volume perdagangan.
- **Verifikasi provenance**: Skor verifikasi keaslian berdasarkan integritas rantai kepemilikan, validasi kontrak, dan deteksi aktivitas mencurigakan.

Komponen `OwnershipTimeline` pada frontend menampilkan riwayat ini dalam format *timeline* visual yang memudahkan pengguna untuk menelusuri perjalanan tiket dari minting hingga kondisi saat ini.
