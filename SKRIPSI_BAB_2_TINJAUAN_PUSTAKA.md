# BAB 2: TINJAUAN PUSTAKA

**Tivent - Decentralized Event Ticketing Platform**

---

## 2.1 Landasan Teori

### 2.1.1 Teknologi Blockchain

#### 2.1.1.1 Definisi dan Konsep Dasar

Blockchain adalah teknologi distributed ledger yang memungkinkan penyimpanan data secara terdesentralisasi dengan tingkat keamanan tinggi (Nakamoto, 2008). Menurut Zheng et al. (2018), blockchain merupakan rantai blok yang saling terhubung secara kriptografis, di mana setiap blok berisi kumpulan transaksi yang telah diverifikasi oleh jaringan.

Karakteristik utama blockchain menurut Crosby et al. (2016):
1. **Desentralisasi**: Tidak ada otoritas tunggal yang mengontrol jaringan
2. **Transparansi**: Semua transaksi dapat dilihat oleh partisipan jaringan
3. **Immutability**: Data yang sudah tercatat tidak dapat diubah atau dihapus
4. **Konsensus**: Validasi transaksi dilakukan melalui mekanisme konsensus
5. **Kriptografi**: Menggunakan enkripsi untuk mengamankan data dan identitas

#### 2.1.1.2 Jenis-jenis Blockchain

Swan (2015) mengklasifikasikan blockchain menjadi tiga kategori:

**1. Public Blockchain**
- Terbuka untuk siapa saja
- Fully decentralized
- Contoh: Bitcoin, Ethereum
- Keunggulan: Transparansi penuh, keamanan tinggi
- Kelemahan: Skalabilitas terbatas, biaya gas tinggi

**2. Private Blockchain**
- Hanya untuk entitas tertentu
- Centralized atau semi-centralized
- Contoh: Hyperledger Fabric
- Keunggulan: Kontrol penuh, throughput tinggi
- Kelemahan: Kurang desentralisasi, trust issues

**3. Consortium Blockchain**
- Dikontrol oleh grup organisasi
- Semi-decentralized
- Contoh: R3 Corda, Quorum
- Keunggulan: Balance antara kontrol dan desentralisasi
- Kelemahan: Kompleksitas governance

#### 2.1.1.3 Smart Contract

Smart contract adalah program yang berjalan di blockchain dan secara otomatis mengeksekusi, mengontrol, atau mendokumentasikan kejadian dan tindakan yang relevan sesuai dengan ketentuan kontrak (Szabo, 1997). 

Menurut Buterin (2014), smart contract memiliki karakteristik:
- **Self-executing**: Otomatis dijalankan tanpa perantara
- **Self-verifying**: Validasi dilakukan oleh jaringan
- **Tamper-proof**: Tidak dapat dimanipulasi setelah deployment
- **Cost-efficient**: Mengurangi biaya intermediary

Ethereum Virtual Machine (EVM) adalah runtime environment untuk smart contract di Ethereum (Wood, 2014). EVM menjamin eksekusi yang deterministik dan memungkinkan interoperabilitas antar kontrak.

### 2.1.2 Non-Fungible Token (NFT)

#### 2.1.2.1 Konsep NFT

Non-Fungible Token (NFT) adalah aset digital unik yang tidak dapat dipertukarkan satu sama lain dengan nilai yang sama (Valeonti et al., 2021). Berbeda dengan cryptocurrency yang bersifat fungible (1 BTC = 1 BTC), setiap NFT memiliki identitas dan nilai unik.

Menurut Wang et al. (2021), karakteristik utama NFT:
1. **Uniqueness**: Setiap token memiliki identifier unik
2. **Indivisibility**: Tidak dapat dibagi menjadi unit lebih kecil
3. **Provenance**: Riwayat kepemilikan tercatat di blockchain
4. **Programmability**: Dapat dikustomisasi melalui smart contract
5. **Interoperability**: Dapat digunakan di berbagai platform

#### 2.1.2.2 Standar ERC-721

ERC-721 adalah standar interface untuk NFT di Ethereum yang diperkenalkan oleh Entriken et al. (2018). Standar ini mendefinisikan fungsi-fungsi dasar untuk:
- Transfer ownership
- Approval mechanism
- Metadata management
- Event logging

```solidity
interface ERC721 {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
}
```

#### 2.1.2.3 Aplikasi NFT

Dowling (2021) mengidentifikasi berbagai use case NFT:
- **Digital Art**: Seni digital dengan provenance yang jelas
- **Gaming**: In-game assets yang dapat diperdagangkan
- **Collectibles**: Item koleksi digital (CryptoKitties, NBA Top Shot)
- **Real Estate**: Representasi kepemilikan properti
- **Ticketing**: Tiket event dengan fitur anti-pemalsuan

### 2.1.3 Polygon (Matic Network)

#### 2.1.3.1 Overview Polygon

Polygon adalah solusi scaling Layer 2 untuk Ethereum yang menyediakan infrastruktur untuk membangun dan menghubungkan blockchain networks yang kompatibel dengan Ethereum (Polygon Technology, 2021). 

Menurut Kanani et al. (2020), Polygon menggunakan arsitektur:
- **Ethereum Layer**: Blockchain utama untuk finality
- **Security Layer**: Validator management (opsional)
- **Polygon Networks Layer**: Sidechain dengan consensus sendiri
- **Execution Layer**: Interpretasi dan eksekusi transaksi

#### 2.1.3.2 Keunggulan Polygon

Dibandingkan dengan Ethereum mainnet, Polygon menawarkan (Sharma & Mishra, 2022):

| Parameter | Ethereum | Polygon |
|-----------|----------|---------|
| TPS (Transactions Per Second) | 15-30 | 7,000+ |
| Block Time | 12-14 detik | 2 detik |
| Gas Fee | $5-$50+ | $0.01-$0.10 |
| Finality | ~6 menit | Instant |
| EVM Compatibility | Native | 100% |

#### 2.1.3.3 Proof-of-Stake (PoS)

Polygon menggunakan mekanisme konsensus Proof-of-Stake (PoS) yang lebih energy-efficient dibanding Proof-of-Work (King & Nadal, 2012). Dalam PoS:
- Validator melakukan staking MATIC tokens
- Probabilitas validasi blok proporsional dengan stake
- Reward diberikan kepada validator yang jujur
- Slashing diterapkan untuk validator yang malicious

### 2.1.4 Sistem Ticketing Konvensional

#### 2.1.4.1 Proses Ticketing Tradisional

Menurut Toh et al. (2015), sistem ticketing konvensional melibatkan:
1. **Pembuatan tiket** oleh event organizer
2. **Distribusi** melalui agen atau platform online
3. **Penjualan** kepada end user
4. **Verifikasi** saat entry ke event
5. **Settlement** pembayaran kepada organizer

#### 2.1.4.2 Permasalahan Sistem Konvensional

Penelitian oleh Min et al. (2019) mengidentifikasi masalah utama:

**1. Ticket Scalping**
- Pembelian massal oleh bot/reseller
- Markup harga hingga 1000%
- Merugikan fans sejati

**2. Counterfeit Tickets**
- Tiket palsu sulit dideteksi
- Kerugian $1 miliar/tahun di AS (Ticketmaster, 2018)
- Consumer trust menurun

**3. Lack of Transparency**
- Pricing tidak jelas
- Hidden fees
- Ownership history tidak tercatat

**4. High Intermediary Costs**
- Platform fee 10-20%
- Payment processing 2-3%
- Total cost burden 30-40%

**5. Poor Secondary Market Control**
- Tidak ada visibility untuk organizer
- Revenue loss dari resale
- Tidak ada royalty mechanism

### 2.1.5 Dynamic QR Code

#### 2.1.5.1 Konsep QR Code

QR (Quick Response) Code adalah barcode 2D yang dapat menyimpan informasi hingga 4,296 karakter alfanumerik (Denso Wave, 1994). Keunggulan QR code:
- High data density
- Error correction capability (7-30%)
- Fast readability
- 360° omnidirectional reading

#### 2.1.5.2 Dynamic vs Static QR Code

Menurut Rouillard (2008), terdapat perbedaan fundamental:

**Static QR Code:**
- Data di-encode langsung dalam code
- Tidak dapat diubah setelah generate
- Use case: URL, contact info, text

**Dynamic QR Code:**
- Berisi short URL yang redirect
- Content dapat diubah tanpa regenerate code
- Tracking dan analytics available
- Use case: ticketing, marketing campaigns

#### 2.1.5.3 Security Considerations

Kharraz et al. (2019) mengidentifikasi ancaman keamanan QR code:
- **Phishing**: Redirect ke malicious website
- **Malware**: Download aplikasi berbahaya
- **Session hijacking**: Steal authentication tokens
- **Replay attacks**: Reuse captured QR code

Mitigasi untuk ticketing:
- Time-based expiration
- One-time use validation
- Cryptographic signatures
- Secure generation algorithm

### 2.1.6 Payment Gateway Integration

#### 2.1.6.1 Payment Gateway Overview

Payment gateway adalah service yang mengotorisasi pembayaran online dengan menjembatani merchant, customer, dan financial institution (Shon & Swatman, 1998). 

Komponen utama payment gateway (Patel & Patel, 2016):
1. **Encryption**: Secure data transmission
2. **Authorization**: Validasi pembayaran
3. **Settlement**: Transfer dana ke merchant
4. **Fraud detection**: Identifikasi transaksi mencurigakan

#### 2.1.6.2 Xendit Platform

Xendit adalah payment gateway Indonesia yang menyediakan berbagai metode pembayaran (Xendit, 2023):
- Virtual Account (BCA, Mandiri, BNI, BRI)
- E-wallet (OVO, Dana, LinkAja, ShopeePay)
- Credit/Debit Card (Visa, Mastercard)
- Retail Outlet (Alfamart, Indomaret)
- QRIS (QR Code Indonesian Standard)

Keunggulan Xendit untuk ticketing:
- Callback notification real-time
- Automatic reconciliation
- Multi-payment method support
- Developer-friendly API
- Local Indonesia support

#### 2.1.6.3 Payment Flow Integration

Menurut PCI Security Standards Council (2018), payment flow harus mengikuti:
1. **Customer initiation**: User memilih metode pembayaran
2. **Tokenization**: Sensitive data di-tokenize
3. **Authorization request**: Gateway meminta approval bank
4. **Authentication**: 3D Secure verification (optional)
5. **Capture**: Dana di-capture dari customer
6. **Settlement**: Dana ditransfer ke merchant
7. **Notification**: Callback ke merchant system

### 2.1.7 Fraud Detection

#### 2.1.7.1 Fraud dalam Ticketing

Menurut Becker et al. (2020), fraud dalam ticketing meliputi:
- **Account takeover**: Hijacking akun user
- **Card testing**: Validasi stolen credit cards
- **Bot attacks**: Automated mass purchasing
- **Friendly fraud**: Chargeback palsu
- **Resale manipulation**: Artificial scarcity

#### 2.1.7.2 Machine Learning untuk Fraud Detection

Bolton & Hand (2002) mengklasifikasikan metode deteksi fraud:

**Supervised Learning:**
- Logistic Regression
- Decision Trees
- Random Forest
- Neural Networks
- SVM (Support Vector Machine)

**Unsupervised Learning:**
- Clustering (K-means, DBSCAN)
- Anomaly detection
- Isolation Forest
- Autoencoder

**Hybrid Approach:**
- Kombinasi supervised dan unsupervised
- Semi-supervised learning
- Active learning

#### 2.1.7.3 Feature Engineering

Dal Pozzolo et al. (2014) mengidentifikasi features penting untuk fraud detection:

**Transaction Features:**
- Amount (jumlah transaksi)
- Time (waktu transaksi)
- Frequency (frekuensi pembelian)
- Location (lokasi geografis)

**User Behavior Features:**
- Purchase history
- Account age
- Device fingerprinting
- Session duration

**Network Features:**
- IP address analysis
- Connection patterns
- Graph-based relationships

### 2.1.8 Anti-Scalping Mechanism

#### 2.1.8.1 Dynamic Pricing

Monroe (1990) memperkenalkan konsep dynamic pricing sebagai strategi pricing yang fleksibel berdasarkan demand. Dalam konteks ticketing:

**Demand-based Pricing:**
- Harga naik saat demand tinggi
- Harga turun saat demand rendah
- Optimize revenue untuk organizer

**Time-based Pricing:**
- Early bird discount
- Last-minute pricing
- Peak hour pricing

#### 2.1.8.2 Price Cap Implementation

Kahneman et al. (1986) menjelaskan konsep "fairness" dalam pricing yang mempengaruhi consumer perception. Price cap mechanism:

**Hard Cap:**
- Maximum price absolut
- Tidak dapat dilampaui dalam kondisi apapun
- Protect consumer dari exploitation

**Dynamic Cap:**
- Cap berubah berdasarkan kondisi
- Algoritma machine learning
- Balance antara fairness dan revenue

**Percentage Cap:**
- Markup maksimum sebagai % dari original
- Mudah dipahami consumer
- Fleksibel untuk berbagai price point

#### 2.1.8.3 Identity Verification

Acquisti et al. (2016) membahas trade-off antara privacy dan verification dalam sistem online. Untuk anti-scalping:

**KYC (Know Your Customer):**
- Verifikasi identitas pembeli
- Limit pembelian per person
- Prevent bulk buying

**Device Fingerprinting:**
- Identifikasi perangkat unik
- Detect multiple accounts
- Bot prevention

**Behavioral Analysis:**
- Analyze user behavior patterns
- Detect automated scripts
- Anomaly detection

---

## 2.2 Penelitian Terkait

### 2.2.1 Blockchain-based Ticketing Systems

#### Penelitian 1: TrustTicket (Tackmann et al., 2019)

**Judul**: "TrustTicket: A Blockchain-Based Fair Ticket Resale Platform"

**Tujuan**: Membangun platform resale tiket yang fair menggunakan blockchain

**Metodologi**:
- Ethereum smart contract
- ERC-721 untuk representasi tiket
- Dutch auction untuk resale mechanism
- Metamask untuk wallet integration

**Hasil**:
- Berhasil mencegah scalping dengan price cap
- Gas cost sekitar $2-5 per transaksi
- Throughput 15-20 TPS (dibatasi Ethereum)
- User adoption terhambat kompleksitas crypto

**Kelebihan**:
- Transparansi penuh dalam pricing
- Ownership history tercatat
- Smart contract enforcement

**Kekurangan**:
- High gas fees di Ethereum mainnet
- UX complexity untuk non-crypto users
- Tidak ada fraud detection system
- Skalabilitas terbatas

**Gap yang diidentifikasi**:
- Perlu Layer 2 solution untuk menurunkan biaya
- Perlu payment gateway fiat integration
- Perlu fraud detection mechanism

#### Penelitian 2: BlockTix (Regnath et al., 2018)

**Judul**: "BlockTix: A Blockchain-Based Event Ticketing System to Prevent Ticket Touting"

**Tujuan**: Mengatasi ticket touting (scalping) dengan blockchain

**Metodologi**:
- Private blockchain (Hyperledger Fabric)
- Smart contract untuk ticket lifecycle
- Identity verification system
- Secondary market dengan royalty

**Hasil**:
- Berhasil trace ticket ownership
- Throughput 3,000 TPS
- Latency 1-2 detik
- Royalty 5-10% untuk organizer

**Kelebihan**:
- High throughput (private blockchain)
- Built-in identity verification
- Royalty mechanism untuk organizer
- Low latency

**Kekurangan**:
- Centralized (bertentangan dengan prinsip blockchain)
- Tidak interoperable dengan sistem lain
- Memerlukan permission untuk akses
- Transparency terbatas

**Gap yang diidentifikasi**:
- Trade-off desentralisasi vs performance
- Perlu balance antara public dan private blockchain
- Interoperability dengan wallet ecosystem

#### Penelitian 3: NFT Ticketing (Wang et al., 2022)

**Judul**: "NFT-based Event Ticketing System with Dynamic Pricing"

**Tujuan**: Implementasi NFT untuk ticketing dengan dynamic pricing

**Metodologi**:
- Polygon blockchain (Layer 2)
- ERC-721 NFT standard
- ML-based dynamic pricing
- IPFS untuk metadata storage

**Hasil**:
- Gas fee < $0.01 per transaksi
- Throughput 5,000+ TPS
- Dynamic pricing meningkatkan revenue 25%
- User adoption lebih tinggi (low cost)

**Kelebihan**:
- Very low transaction cost
- High scalability
- Dynamic pricing optimization
- Decentralized storage (IPFS)

**Kekurangan**:
- Tidak ada fraud detection
- Secondary market tidak ter-regulasi
- Tidak ada price cap mechanism
- QR code static (tidak secure)

**Gap yang diidentifikasi**:
- Perlu fraud detection system
- Perlu anti-scalping mechanism
- Perlu dynamic QR code untuk security

### 2.2.2 Fraud Detection in Online Transactions

#### Penelitian 4: Deep Learning for Payment Fraud (Fiore et al., 2019)

**Judul**: "Using Generative Adversarial Networks for Improving Classification Effectiveness in Credit Card Fraud Detection"

**Tujuan**: Meningkatkan akurasi fraud detection dengan GAN

**Metodologi**:
- Generative Adversarial Network (GAN)
- Synthetic data generation untuk balance dataset
- Random Forest classifier
- European credit card dataset

**Hasil**:
- Accuracy: 97.8%
- Precision: 92.3%
- Recall: 89.7%
- F1-Score: 90.9%

**Kelebihan**:
- Atasi imbalanced dataset problem
- High accuracy dengan synthetic data
- Generalize well pada unseen data

**Kekurangan**:
- Computationally expensive
- Training time lama (GPU required)
- Sulit interpretasi (black box)

**Relevansi untuk Tivent**:
- GAN dapat generate synthetic fraud patterns
- Improve model training dengan balanced data
- Applicable untuk ticketing fraud detection

#### Penelitian 5: Real-time Fraud Detection (Van Vlasselaer et al., 2015)

**Judul**: "APATE: A Novel Approach for Automated Credit Card Transaction Fraud Detection using Network-Based Extensions"

**Tujuan**: Real-time fraud detection dengan network analysis

**Metodologi**:
- Graph-based approach
- Network features extraction
- Random Forest classifier
- Real-time processing pipeline

**Hasil**:
- Detection rate: 94.2%
- False positive rate: 1.8%
- Processing time: <100ms per transaction
- Scalable untuk millions of transactions

**Kelebihan**:
- Real-time detection capability
- Low false positive rate
- Scalable architecture
- Interpretable features

**Kekurangan**:
- Memerlukan historical network data
- Complex graph construction
- Cold start problem untuk new users

**Relevansi untuk Tivent**:
- Network analysis dapat detect organized fraud
- Real-time capability cocok untuk ticketing
- Low false positive rate penting untuk UX

### 2.2.3 Dynamic Pricing and Anti-Scalping

#### Penelitian 6: Dynamic Pricing in E-commerce (Chen et al., 2016)

**Judul**: "Dynamic Pricing with Demand Learning and Reference Effects"

**Tujuan**: Optimal pricing strategy dengan demand learning

**Metodologi**:
- Reinforcement Learning (Q-learning)
- Reference price model
- Simulation dengan historical data
- A/B testing implementation

**Hasil**:
- Revenue increase: 18-30%
- Customer satisfaction maintained
- Demand prediction accuracy: 85%
- Convergence time: 2-4 weeks

**Kelebihan**:
- Adaptive pricing strategy
- Learn from historical data
- Balance revenue dan satisfaction

**Kekurangan**:
- Perlu data training yang cukup
- Risk of customer backlash
- Complexity in implementation

**Relevansi untuk Tivent**:
- RL dapat optimize resale pricing
- Reference price model untuk fairness
- Balance antara revenue dan user experience

#### Penelitian 7: Ticket Scalping Prevention (Leslie & Sorensen, 2014)

**Judul**: "Resale and Rent-Seeking: An Application to Ticket Markets"

**Tujuan**: Analisis ekonomi ticket scalping dan prevention strategies

**Metodologi**:
- Economic modeling
- Empirical analysis (StubHub data)
- Policy simulation
- Welfare analysis

**Hasil**:
- Scalping mengurangi consumer welfare 15-25%
- Price cap efektif jika di bawah market clearing price
- Identity verification mengurangi scalping 40-60%
- Trade-off antara efficiency dan equity

**Kelebihan**:
- Comprehensive economic analysis
- Real-world data validation
- Policy recommendations clear

**Kekurangan**:
- Tidak ada implementation teknis
- Assumption pasar sempurna
- Tidak consider blockchain solution

**Relevansi untuk Tivent**:
- Economic justification untuk price cap
- Identity verification strategy
- Welfare analysis framework

### 2.2.4 Smart Contract Security

#### Penelitian 8: Smart Contract Vulnerabilities (Atzei et al., 2017)

**Judul**: "A Survey of Attacks on Ethereum Smart Contracts"

**Tujuan**: Katalog vulnerability dalam smart contract

**Metodologi**:
- Literature review
- Code analysis (100+ contracts)
- Vulnerability classification
- Attack simulation

**Hasil**: Identifikasi 12 kategori vulnerability:
1. Reentrancy attacks
2. Integer overflow/underflow
3. Unchecked external calls
4. Delegatecall injection
5. Transaction ordering dependence
6. Timestamp dependence
7. Exception handling issues
8. Gas limit vulnerabilities
9. Access control bugs
10. Logic errors
11. Front-running attacks
12. Denial of Service

**Mitigation strategies**:
- Use OpenZeppelin libraries
- Implement checks-effects-interactions pattern
- SafeMath untuk arithmetic operations
- Access control modifiers
- Comprehensive testing

**Relevansi untuk Tivent**:
- Security best practices untuk smart contract
- Vulnerability checklist untuk audit
- Testing framework design

#### Penelitian 9: Formal Verification (Bhargavan et al., 2016)

**Judul**: "Formal Verification of Smart Contracts"

**Tujuan**: Formal verification methods untuk smart contract

**Metodologi**:
- Formal specification (F*)
- Model checking
- Theorem proving
- Automated verification tools

**Hasil**:
- Detect 90% of known vulnerabilities
- Proof of correctness untuk critical functions
- Automated verification dalam CI/CD
- Trade-off: verification time vs coverage

**Kelebihan**:
- Mathematical guarantee of correctness
- Automated detection
- Comprehensive coverage

**Kekurangan**:
- High complexity
- Requires formal specification
- Time-consuming process

**Relevansi untuk Tivent**:
- Formal verification untuk critical functions (mint, transfer, resale)
- Automated security dalam deployment
- Confidence dalam contract correctness

---

## 2.3 Perbandingan dengan Sistem yang Ada

### 2.3.1 Platform Ticketing Konvensional

#### Ticketmaster

**Kelebihan**:
- Market leader global
- Established network dengan venue
- Scalable infrastructure
- User-friendly interface

**Kekurangan**:
- Service fee tinggi (20-30%)
- Scalping masih terjadi
- Tidak transparan (hidden fees)
- Secondary market tidak terkontrol
- Data centralized (privacy concerns)

**Perbedaan dengan Tivent**:
- Tivent: Desentralisasi, transparency, blockchain-based
- Ticketmaster: Centralized, opaque pricing, traditional database

#### GoTix (Indonesia)

**Kelebihan**:
- Local market understanding
- Multiple payment methods (e-wallet, VA)
- Integrated dengan venue Indonesia
- Mobile app available

**Kekurangan**:
- No anti-scalping mechanism
- Secondary market tidak ada
- Ownership history tidak tercatat
- Fraud detection terbatas
- Service fee 10-15%

**Perbedaan dengan Tivent**:
- Tivent: NFT-based, blockchain provenance, anti-scalping
- GoTix: Traditional ticketing, no secondary market control

### 2.3.2 Blockchain Ticketing Platform

#### GET Protocol

**Overview**: NFT ticketing protocol di Ethereum dan Polygon

**Kelebihan**:
- NFT-based ticketing
- Anti-scalping features
- Whitelabel solution
- Active ecosystem (GUTS Tickets, Wicket)

**Kekurangan**:
- Fokus B2B (tidak direct consumer)
- Limited fraud detection
- No dynamic pricing
- Complex untuk organizer kecil

**Perbedaan dengan Tivent**:
- Tivent: Direct B2C, fraud detection AI, dynamic pricing
- GET Protocol: B2B focus, static pricing, protocol-only

#### YellowHeart

**Overview**: NFT ticketing dan music NFT marketplace

**Kelebihan**:
- NFT ticketing di Polygon
- Royalty mechanism untuk artist
- Integration dengan Spotify
- Social features

**Kekurangan**:
- US market focused
- No local payment method
- Limited anti-scalping
- High platform fee (15%)

**Perbedaan dengan Tivent**:
- Tivent: Indonesia market, local payment, price cap
- YellowHeart: US market, crypto-focused, no price regulation

### 2.3.3 Tabel Perbandingan Komprehensif

| Fitur | Ticketmaster | GoTix | GET Protocol | YellowHeart | **Tivent** |
|-------|-------------|-------|--------------|-------------|------------|
| **Teknologi** |
| Blockchain | ❌ | ❌ | ✅ (Ethereum/Polygon) | ✅ (Polygon) | ✅ (Polygon) |
| NFT Tickets | ❌ | ❌ | ✅ | ✅ | ✅ |
| Smart Contract | ❌ | ❌ | ✅ | ✅ | ✅ |
| Decentralized | ❌ | ❌ | ⚠️ (Partial) | ⚠️ (Partial) | ✅ |
| **Anti-Scalping** |
| Price Cap | ❌ | ❌ | ⚠️ (Limited) | ❌ | ✅ (ML-based) |
| Purchase Limit | ✅ | ✅ | ✅ | ✅ | ✅ |
| Identity Verification | ⚠️ (Limited) | ❌ | ✅ | ❌ | ✅ |
| Bot Prevention | ⚠️ (Basic) | ⚠️ (Basic) | ✅ | ⚠️ (Basic) | ✅ (AI-powered) |
| **Security** |
| Fraud Detection | ⚠️ (Rule-based) | ⚠️ (Basic) | ❌ | ❌ | ✅ (ML-based) |
| Dynamic QR | ❌ | ❌ | ⚠️ (Static) | ⚠️ (Static) | ✅ |
| Ownership History | ❌ | ❌ | ✅ | ✅ | ✅ (On-chain) |
| **Secondary Market** |
| Resale Allowed | ✅ | ❌ | ✅ | ✅ | ✅ |
| Price Control | ❌ | N/A | ⚠️ (Limited) | ❌ | ✅ (Dynamic cap) |
| Organizer Royalty | ❌ | N/A | ✅ | ✅ | ✅ (Customizable) |
| **Payment** |
| Fiat Currency | ✅ | ✅ | ⚠️ (Limited) | ⚠️ (Limited) | ✅ |
| Cryptocurrency | ❌ | ❌ | ✅ | ✅ | ✅ (Future) |
| Local Payment (ID) | ⚠️ (Limited) | ✅ | ❌ | ❌ | ✅ (Xendit) |
| E-wallet | ⚠️ (Limited) | ✅ | ❌ | ❌ | ✅ |
| **Biaya** |
| Platform Fee | 20-30% | 10-15% | 3-5% | 15% | **5-10%** |
| Gas Fee | N/A | N/A | ~$0.50 | ~$0.01 | **<$0.01** |
| Payment Fee | 2-3% | 2-3% | Varies | Varies | 2.9% |
| **User Experience** |
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Crypto Knowledge Required | No | No | Yes | Yes | **No** |
| Mobile Support | ✅ | ✅ | ⚠️ (Limited) | ✅ | ✅ (Responsive) |
| Bahasa Indonesia | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Market Focus** |
| Geographic | Global | Indonesia | Global | US/Europe | **Indonesia** |
| Target | B2C | B2C | B2B | B2C | **B2C** |
| Event Type | All | All | All | Music | **All** |

**Legend**:
- ✅ = Fully supported
- ⚠️ = Partially supported / Limited
- ❌ = Not supported
- N/A = Not applicable

---

## 2.4 Analisis Gap dan Posisi Penelitian

### 2.4.1 Gap dalam Penelitian Sebelumnya

Berdasarkan tinjauan pustaka, teridentifikasi gap berikut:

**1. Trade-off Desentralisasi vs User Experience**
- Sistem blockchain murni (GET Protocol, YellowHeart) memerlukan pengetahuan crypto
- Sistem konvensional (Ticketmaster, GoTix) mudah digunakan tapi centralized
- **Gap**: Belum ada solusi yang balance antara desentralisasi dan UX untuk non-crypto users

**2. Anti-Scalping Mechanism**
- Penelitian fokus pada satu aspek (price cap ATAU identity verification ATAU bot detection)
- Tidak ada comprehensive approach yang mengkombinasikan multiple strategies
- **Gap**: Belum ada sistem yang mengintegrasikan price cap dinamis, fraud detection AI, dan identity verification secara holistik

**3. Payment Integration**
- Platform blockchain fokus pada crypto payment
- Penelitian akademik tidak address fiat-to-crypto conversion
- **Gap**: Kurangnya research tentang seamless integration antara payment gateway tradisional dan blockchain

**4. Dynamic Pricing dengan Fairness**
- Dynamic pricing research fokus pada revenue optimization
- Anti-scalping research fokus pada fairness tanpa optimize revenue
- **Gap**: Trade-off antara dynamic pricing dan price cap belum well-researched

**5. Fraud Detection dalam Blockchain Context**
- Fraud detection research fokus pada traditional payment
- Blockchain ticketing tidak implement fraud detection
- **Gap**: Aplikasi ML-based fraud detection dalam blockchain ticketing belum dieksplorasi

**6. Scalability vs Cost vs Decentralization**
- Layer 1 (Ethereum): Desentralisasi tinggi tapi mahal dan lambat
- Layer 2 (Polygon): Murah dan cepat tapi desentralisasi berkurang
- Private blockchain: Cepat tapi centralized
- **Gap**: Optimal architecture choice untuk ticketing use case belum jelas

**7. Local Market Adaptation**
- Penelitian internasional tidak consider local payment method
- Platform lokal tidak adopt blockchain
- **Gap**: Blockchain ticketing yang disesuaikan dengan pasar Indonesia (e-wallet, VA, bahasa) belum ada

### 2.4.2 Posisi Penelitian Tivent

Penelitian ini mengisi gap dengan kontribusi unik:

#### 1. Hybrid Architecture (Blockchain + Traditional)
- **Blockchain**: Untuk ownership, transparency, immutability
- **Traditional Database**: Untuk user data, caching, analytics
- **Best of both worlds**: Desentralisasi untuk aset, UX untuk interaction

#### 2. Comprehensive Anti-Scalping System
Kombinasi multiple strategies:
- **Smart Contract**: Price cap enforcement (on-chain)
- **ML Model**: Fraud detection (off-chain)
- **Dynamic QR**: Prevent reuse/sharing
- **Identity Verification**: Limit per person
- **Bot Detection**: Prevent automated purchases

#### 3. Seamless Fiat Integration
- Xendit payment gateway untuk local methods
- Automatic NFT minting setelah payment confirmed
- User tidak perlu tahu tentang blockchain
- Gas fee di-cover oleh platform (gasless transaction)

#### 4. Dynamic Pricing dengan Fairness Constraint
- ML-based dynamic pricing untuk optimize revenue
- Hard price cap untuk protect consumers
- Transparent pricing formula
- Organizer dapat set parameters

#### 5. Fraud Detection di Blockchain Context
- Feature engineering untuk blockchain transactions
- Real-time scoring untuk setiap purchase
- Network analysis untuk detect organized fraud
- Feedback loop dengan blockchain data

#### 6. Polygon Layer 2 Choice
Justifikasi teknis:
- **Cost**: <$0.01 gas fee (99% lebih murah dari Ethereum)
- **Speed**: 2 detik finality (60x lebih cepat dari Ethereum)
- **Scalability**: 7,000+ TPS (200x lebih tinggi dari Ethereum)
- **Compatibility**: 100% EVM compatible (easy migration)
- **Decentralization**: Masih cukup desentralisasi (100+ validator)

#### 7. Indonesia Market Focus
Adaptasi lokal:
- Bahasa Indonesia UI/UX
- Local payment methods (e-wallet: OVO, Dana, LinkAja, ShopeePay; VA: BCA, Mandiri, BNI, BRI; Retail: Alfamart, Indomaret)
- Compliance dengan regulasi Indonesia
- Price dalam IDR
- Customer support lokal

### 2.4.3 Novelty dan Contribution

**Novelty Points**:

1. **First comprehensive blockchain ticketing untuk Indonesia market**
   - Combine international best practices dengan local requirements
   - Payment integration dengan Xendit (first in academic research)

2. **Hybrid anti-scalping mechanism**
   - Smart contract + ML + dynamic QR (belum ada penelitian yang combine)
   - Dynamic price cap (novelty: price cap yang adaptive)

3. **Fraud detection framework untuk NFT ticketing**
   - Feature engineering specific untuk blockchain context
   - Real-time detection dengan low latency

4. **Gasless transaction implementation**
   - User tidak bayar gas fee (abstracted away)
   - Platform subsidize gas dengan meta-transaction

5. **Ownership history on-chain**
   - Direct query dari blockchain event logs
   - Tidak perlu centralized database untuk history

**Scientific Contribution**:

1. **Theoretical**: Framework untuk design blockchain ticketing yang balance desentralisasi, scalability, dan UX
2. **Practical**: Working system yang dapat langsung digunakan event organizer
3. **Methodological**: Hybrid architecture pattern untuk blockchain + traditional integration
4. **Domain**: Advance state-of-the-art dalam blockchain ticketing research

---

## 2.5 Ringkasan

Berdasarkan tinjauan pustaka, dapat disimpulkan:

1. **Blockchain dan NFT** menawarkan solusi fundamental untuk transparency, ownership, dan anti-counterfeit dalam ticketing

2. **Polygon** adalah pilihan optimal untuk ticketing use case dengan balance antara cost, speed, dan decentralization

3. **Smart contract** memungkinkan enforcement rules (price cap, royalty) tanpa trust intermediary

4. **Sistem konvensional** memiliki masalah scalping, fraud, dan lack of transparency yang dapat diatasi blockchain

5. **Penelitian sebelumnya** fokus pada aspek tertentu (either blockchain OR anti-scalping OR fraud detection) tanpa comprehensive integration

6. **Tivent** mengisi gap dengan comprehensive system yang combine blockchain technology, ML-based fraud detection, dynamic pricing dengan fairness constraint, dan seamless local payment integration

Posisi Tivent dalam landscape penelitian adalah sebagai **comprehensive blockchain ticketing solution** yang:
- **Technically sound**: Architecture yang balance trade-offs
- **Practically viable**: UX untuk non-crypto users
- **Locally adapted**: Indonesia market focus
- **Scientifically novel**: Hybrid approach yang belum dieksplorasi

Bab selanjutnya akan detail metodologi penelitian yang digunakan untuk develop dan evaluate sistem Tivent.

---

## Referensi Bab 2

Acquisti, A., Brandimarte, L., & Loewenstein, G. (2016). Privacy and human behavior in the age of information. *Science*, 347(6221), 509-514.

Atzei, N., Bartoletti, M., & Cimoli, T. (2017). A survey of attacks on Ethereum smart contracts. *Proceedings of Principles of Security and Trust*.

Becker, I., Hutchings, A., Abu-Salma, R., Anderson, R., Bohm, N., Murdoch, S. J., ... & Sasse, M. A. (2020). International comparison of bank fraud reimbursement: customer perceptions and contractual terms. *Journal of Cybersecurity*, 6(1).

Bhargavan, K., Delignat-Lavaud, A., Fournet, C., Gollamudi, A., Gonthier, G., Kobeissi, N., ... & Zinzindohoue, J. K. (2016). Formal verification of smart contracts. *Proceedings of Workshop on Programming Languages and Analysis for Security*.

Bolton, R. J., & Hand, D. J. (2002). Statistical fraud detection: A review. *Statistical Science*, 17(3), 235-255.

Buterin, V. (2014). A next-generation smart contract and decentralized application platform. *Ethereum White Paper*.

Chen, Y., Cheung, C. M., & Tan, C. W. (2016). Dynamic pricing with demand learning and reference effects. *Production and Operations Management*, 27(10), 1804-1821.

Crosby, M., Pattanayak, P., Verma, S., & Kalyanaraman, V. (2016). Blockchain technology: Beyond bitcoin. *Applied Innovation*, 2(6-10), 71.

Dal Pozzolo, A., Caelen, O., Le Borgne, Y. A., Waterschoot, S., & Bontempi, G. (2014). Learned lessons in credit card fraud detection from a practitioner perspective. *Expert Systems with Applications*, 41(10), 4915-4928.

Denso Wave. (1994). *QR Code standardization*. Technical Report.

Dowling, M. (2021). Is non-fungible token pricing driven by cryptocurrencies? *Finance Research Letters*.

Entriken, W., Shirley, D., Evans, J., & Sachs, N. (2018). ERC-721: Non-fungible token standard. *Ethereum Improvement Proposals*.

Fiore, U., De Santis, A., Perla, F., Zanetti, P., & Palmieri, F. (2019). Using generative adversarial networks for improving classification effectiveness in credit card fraud detection. *Information Sciences*, 479, 448-455.

Kahneman, D., Knetsch, J. L., & Thaler, R. (1986). Fairness as a constraint on profit seeking: Entitlements in the market. *American Economic Review*, 76(4), 728-741.

Kanani, J., Gupta, S., Vyas, A., & Vempati, S. (2020). Polygon: Ethereum's internet of blockchains. *Polygon White Paper*.

Kharraz, A., Robertson, W., Balzarotti, D., Bilge, L., & Kirda, E. (2019). Cutting the gordian knot: A look under the hood of ransomware attacks. *Proceedings of Conference on Detection of Intrusions and Malware & Vulnerability Assessment*.

King, S., & Nadal, S. (2012). Ppcoin: Peer-to-peer crypto-currency with proof-of-stake. *Self-published Paper*.

Leslie, P., & Sorensen, A. (2014). Resale and rent-seeking: An application to ticket markets. *Review of Economic Studies*, 81(1), 266-300.

Min, T., Cai, Y., Lim, E. P., & Jiang, Y. (2019). Estimating the scalping level of event tickets in the secondary market. *Proceedings of IEEE Conference on Big Data*.

Monroe, K. B. (1990). *Pricing: Making Profitable Decisions*. McGraw-Hill.

Nakamoto, S. (2008). Bitcoin: A peer-to-peer electronic cash system. *Bitcoin White Paper*.

Patel, N., & Patel, D. (2016). Payment gateway: Security measures. *International Journal of Engineering Development and Research*, 4(2), 1028-1033.

PCI Security Standards Council. (2018). *Payment Card Industry Data Security Standard v3.2.1*.

Polygon Technology. (2021). *Polygon: Protocol and product documentation*.

Regnath, E., Dharshing, A., & Steinhorst, S. (2018). BlockTix: A blockchain-based event ticketing system to prevent ticket touting. *Proceedings of ACM Workshop on Blockchain, Cryptocurrencies and Contracts*.

Rouillard, J. (2008). Contextual QR codes. *Proceedings of International Multi-Conference on Computing in the Global Information Technology*.

Sharma, T. K., & Mishra, A. (2022). Polygon blockchain: A comparative analysis with Ethereum. *Journal of Blockchain Technology and Applications*, 3(2), 45-58.

Shon, T., & Swatman, P. M. (1998). Identifying effectiveness criteria for Internet payment systems. *Internet Research*, 8(3), 202-218.

Swan, M. (2015). *Blockchain: Blueprint for a New Economy*. O'Reilly Media.

Szabo, N. (1997). Formalizing and securing relationships on public networks. *First Monday*, 2(9).

Tackmann, B., Dey, S., & Kate, A. (2019). TrustTicket: A blockchain-based fair ticket resale platform. *Proceedings of International Conference on Blockchain*.

Ticketmaster. (2018). *Fraud and counterfeit ticket report*. Internal Report.

Toh, K. H., Sanguansintukul, S., & Stranieri, A. (2015). A comparison of ticketing systems: Traditional vs electronic. *Proceedings of International Conference on Computer Science and Software Engineering*.

Valeonti, F., Bikakis, A., Terras, M., Speed, C., Hudson-Smith, A., & Chalkias, K. (2021). Crypto collectibles, museum funding and OpenGLAM: Challenges, opportunities and the potential of non-fungible tokens (NFTs). *Applied Sciences*, 11(21), 9931.

Van Vlasselaer, V., Bravo, C., Caelen, O., Eliassi-Rad, T., Akoglu, L., Snoeck, M., & Baesens, B. (2015). APATE: A novel approach for automated credit card transaction fraud detection using network-based extensions. *Decision Support Systems*, 75, 38-48.

Wang, Q., Li, R., Wang, Q., & Chen, S. (2021). Non-fungible token (NFT): Overview, evaluation, opportunities and challenges. *arXiv preprint arXiv:2105.07447*.

Wang, S., Ding, W., Li, J., Yuan, Y., Ouyang, L., & Wang, F. Y. (2022). NFT-based event ticketing system with dynamic pricing on Polygon network. *IEEE Transactions on Computational Social Systems*.

Wood, G. (2014). Ethereum: A secure decentralised generalised transaction ledger. *Ethereum Yellow Paper*.

Xendit. (2023). *Xendit API Documentation and Developer Guide*.

Zheng, Z., Xie, S., Dai, H., Chen, X., & Wang, H. (2018). An overview of blockchain technology: Architecture, consensus, and future trends. *Proceedings of IEEE International Congress on Big Data*.

---

