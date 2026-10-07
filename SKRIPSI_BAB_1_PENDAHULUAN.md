# BAB I
# PENDAHULUAN

---

## 1.1 Latar Belakang

Industri event dan hiburan mengalami pertumbuhan yang signifikan dalam beberapa tahun terakhir, baik secara global maupun di Indonesia. Konser musik, festival, kompetisi olahraga, dan berbagai jenis event lainnya menjadi bagian penting dari kehidupan masyarakat modern. Seiring dengan pertumbuhan ini, digitalisasi proses penjualan tiket telah menjadi standar industri. Platform ticketing digital memungkinkan pembelian tiket secara daring, menggantikan sistem antrian fisik yang tidak efisien [BUTUH SUMBER].

Salah satu konsekuensi dari masifnya penjualan tiket digital adalah munculnya pasar resale (penjualan kembali) tiket. Resale tiket pada dasarnya merupakan kebutuhan yang wajar — pembeli yang berhalangan hadir memerlukan mekanisme untuk menjual kembali tiket mereka kepada pihak lain. Namun, ketiadaan sistem resale yang terkontrol membuka peluang bagi berbagai bentuk penyalahgunaan yang merugikan konsumen maupun penyelenggara event.

Masalah pertama yang muncul adalah penipuan tiket dan peredaran tiket palsu. Tiket digital dalam format konvensional — seperti file PDF, gambar barcode, atau tangkapan layar — dapat dengan mudah diduplikasi dan disebarluaskan tanpa sepengetahuan pemilik asli. Dalam konteks resale, pembeli tidak memiliki cara yang andal untuk memverifikasi apakah tiket yang dijual oleh pihak ketiga merupakan tiket yang sah, masih aktif, dan belum digunakan oleh orang lain. Permasalahan ini bukan sekadar teori; sejumlah kasus penipuan tiket event di Indonesia telah dilaporkan melalui berbagai media, di mana konsumen membayar untuk tiket yang ternyata palsu, sudah digunakan, atau dijual kepada lebih dari satu pembeli secara bersamaan [BUTUH SUMBER].

Masalah kedua adalah praktik scalping, yaitu pembelian tiket dalam jumlah besar oleh individu atau kelompok tertentu dengan tujuan menjual kembali dengan harga yang jauh lebih tinggi dari harga resmi. Praktik ini sering difasilitasi oleh penggunaan bot otomatis yang mampu membeli tiket dalam hitungan detik setelah penjualan dibuka, sehingga tiket habis sebelum konsumen biasa sempat mengaksesnya [BUTUH SUMBER]. Akibatnya, konsumen yang ingin menghadiri event terpaksa membeli tiket dari scalper dengan harga yang bisa mencapai dua hingga lima kali lipat dari harga asli. Penyelenggara event juga dirugikan karena tidak mendapat bagian dari keuntungan resale tersebut, sementara reputasi event dapat terdampak akibat keluhan konsumen terhadap harga tiket yang tidak terjangkau.

Sistem ticketing konvensional yang ada saat ini memiliki keterbatasan mendasar dalam mengatasi kedua masalah tersebut. Pertama, sistem terpusat (*centralized*) menyimpan data tiket pada satu server atau database yang dikelola oleh satu pihak, sehingga riwayat kepemilikan dan transfer tiket tidak dapat diverifikasi secara independen oleh pihak luar. Transparansi yang terbatas ini menyulitkan pembeli resale untuk memastikan legitimasi tiket yang mereka beli. Kedua, sistem konvensional umumnya tidak memiliki mekanisme bawaan untuk membatasi harga resale atau jumlah tiket yang dapat dibeli per individu secara enforceable. Kebijakan anti-scalping yang ada biasanya hanya berupa aturan tertulis pada syarat dan ketentuan, bukan pembatasan teknis yang diterapkan secara otomatis pada level transaksi. Ketiga, metode verifikasi tiket konvensional menggunakan barcode atau QR Code statis yang rentan terhadap duplikasi — sebuah tangkapan layar dari QR Code statis dapat digunakan oleh siapa saja, kapan saja, tanpa ada mekanisme untuk membedakan antara pemegang tiket asli dan pihak yang menduplikasi.

Teknologi blockchain menawarkan pendekatan yang berbeda terhadap permasalahan-permasalahan tersebut. Blockchain adalah teknologi *distributed ledger* yang memungkinkan pencatatan data secara terdesentralisasi dengan karakteristik transparansi dan *immutability* — artinya setiap transaksi yang tercatat tidak dapat diubah atau dihapus secara sepihak (Zheng et al., 2018). Dalam konteks ticketing, setiap tiket dapat direpresentasikan sebagai Non-Fungible Token (NFT) dengan standar ERC-721, di mana setiap token memiliki identitas unik dan riwayat kepemilikan yang tercatat secara permanen di blockchain (Entriken et al., 2018). Dengan demikian, keaslian tiket dan riwayat transfernya dapat diverifikasi oleh siapa saja melalui blockchain, tanpa bergantung pada satu pihak terpusat.

Lebih lanjut, smart contract — program yang berjalan di atas blockchain dan mengeksekusi logika bisnis secara otomatis (Buterin, 2014) — dapat digunakan untuk mengatur proses resale tiket secara terprogram. Smart contract memungkinkan penerapan aturan-aturan bisnis yang dieksekusi secara otomatis dan tidak dapat dimanipulasi, seperti: pembatasan harga maksimum resale (*price cap*) berdasarkan persentase tertentu dari harga asli, pembatasan jumlah tiket yang dapat dibeli oleh satu wallet address, pembatasan jumlah kali tiket dapat di-resale, serta distribusi royalti otomatis kepada penyelenggara event dari setiap transaksi resale. Mekanisme-mekanisme ini diterapkan pada level smart contract, sehingga berlaku secara konsisten dan tidak dapat dilewati (*bypass*) oleh pihak manapun.

Untuk mengatasi masalah verifikasi tiket saat digunakan di lokasi event, penelitian ini menggunakan pendekatan Dynamic QR Code. Berbeda dengan QR Code statis yang kontennya tetap, Dynamic QR Code mengandung informasi yang berubah secara periodik — dalam hal ini setiap 30 detik — dan menyertakan *timestamp* serta tanda tangan kriptografis (*cryptographic signature*) yang mengikat QR Code tersebut pada pemilik tiket yang sah serta waktu pembuatan yang spesifik. Mekanisme ini dirancang agar tangkapan layar dari QR Code tidak dapat digunakan untuk masuk ke event, karena QR Code yang sudah kadaluarsa (melewati jendela waktu 30 detik) akan ditolak oleh sistem verifikasi di gerbang masuk. Selain itu, proses verifikasi juga melakukan pengecekan kepemilikan tiket pada blockchain secara real-time, sehingga dapat mendeteksi jika tiket sudah ditransfer ke pihak lain atau sudah pernah digunakan.

Beberapa penelitian terdahulu telah mengeksplorasi penggunaan blockchain untuk sistem ticketing. Regner et al. (2019) mengusulkan platform ticketing berbasis NFT menggunakan Ethereum, namun fokus pada aspek tokenisasi tiket tanpa membahas mekanisme anti-scalping yang detail pada level smart contract. Tackmann (2020) menganalisis potensi blockchain untuk mengatasi masalah secondary ticketing market, namun pembahasannya bersifat konseptual tanpa implementasi sistem secara utuh [BUTUH SUMBER]. Penelitian lain seperti yang dilakukan oleh Bai et al. (2023) dan Umar et al. (2024) juga telah membahas integrasi blockchain dalam event ticketing, namun belum menggabungkan mekanisme smart contract price cap, Dynamic QR Code berbasis *timestamp*, dan sistem deteksi fraud dalam satu platform yang terintegrasi [BUTUH SUMBER].

Berdasarkan tinjauan terhadap penelitian dan sistem yang sudah ada, terdapat *research gap* berupa belum adanya sistem resale tiket event yang mengintegrasikan tiga komponen utama secara terpadu: (1) smart contract dengan mekanisme anti-scalping yang dapat di-enforce secara on-chain, (2) Dynamic QR Code berbasis *timestamp* dan tanda tangan kriptografis untuk verifikasi tiket, serta (3) sistem deteksi fraud berbasis rule-based scoring untuk mengidentifikasi pola pembelian yang mencurigakan. Integrasi ketiga komponen ini dalam satu platform diharapkan dapat memberikan perlindungan yang lebih komprehensif dibandingkan pendekatan yang hanya mengandalkan salah satu mekanisme saja.

Atas dasar permasalahan dan *research gap* tersebut, penelitian ini mengembangkan sebuah sistem resale tiket event berbasis blockchain dengan nama **Tivent** (*Decentralized Event Ticketing Platform*). Sistem ini dibangun di atas jaringan Polygon — sebuah *Layer 2 scaling solution* untuk Ethereum yang menawarkan biaya transaksi rendah dan waktu konfirmasi yang cepat (Polygon Technology, 2021) — menggunakan smart contract yang ditulis dalam bahasa Solidity dengan standar ERC-721. Sistem ini dirancang menggunakan Design Science Research Methodology (DSRM) yang dikemukakan oleh Peffers et al. (2007), suatu metodologi yang tepat untuk penelitian pengembangan artefak sistem informasi. Penelitian ini akan meliputi proses identifikasi masalah, perancangan solusi, implementasi sistem, demonstrasi, dan evaluasi efektivitas sistem dalam memitigasi penipuan tiket dan scalping.

---

## 1.2 Identifikasi Masalah

Berdasarkan latar belakang yang telah diuraikan, dapat diidentifikasi beberapa masalah sebagai berikut:

1. Tiket digital konvensional rentan terhadap pemalsuan dan duplikasi karena tidak memiliki mekanisme verifikasi keaslian yang berbasis bukti kriptografis, sehingga dalam konteks resale, pembeli tidak dapat memastikan legitimasi tiket yang dijual oleh pihak ketiga.

2. Tidak adanya mekanisme pembatasan harga resale yang bersifat teknis dan enforceable pada sistem ticketing konvensional memungkinkan praktik scalping, di mana tiket dijual kembali dengan harga yang jauh melebihi harga resmi sehingga merugikan konsumen.

3. Metode verifikasi tiket berbasis QR Code statis atau barcode konvensional tidak dapat mencegah penggunaan ulang tiket yang sudah di-redeem, karena tangkapan layar atau salinan dari kode tersebut tetap dapat dipindai selama kode aslinya valid.

4. Sistem ticketing terpusat tidak menyediakan transparansi riwayat kepemilikan dan transfer tiket yang dapat diverifikasi secara independen oleh pihak di luar pengelola platform, sehingga mengurangi tingkat kepercayaan dalam transaksi resale.

5. Belum terdapat sistem resale tiket event yang mengintegrasikan smart contract berbasis blockchain dengan mekanisme anti-scalping, Dynamic QR Code untuk verifikasi tiket, dan sistem deteksi fraud dalam satu platform yang terpadu.

---

## 1.3 Rumusan Masalah

Berdasarkan identifikasi masalah di atas, rumusan masalah dalam penelitian ini adalah sebagai berikut:

1. Bagaimana merancang dan mengimplementasikan sistem tiket event berbasis NFT (ERC-721) pada blockchain Polygon yang dapat memitigasi peredaran tiket palsu dan duplikat dalam proses resale?

2. Bagaimana menerapkan smart contract untuk mengontrol proses resale tiket melalui mekanisme *price cap*, pembatasan pembelian per wallet, dan distribusi royalti otomatis kepada penyelenggara event?

3. Bagaimana mengembangkan mekanisme Dynamic QR Code berbasis *timestamp* dan tanda tangan kriptografis yang dapat mencegah penggunaan tiket oleh pihak yang tidak berhak serta penggunaan ulang tiket yang sudah di-redeem?

4. Bagaimana membangun transparansi riwayat kepemilikan dan transaksi tiket melalui pencatatan on-chain yang dapat diverifikasi secara independen?

5. Bagaimana tingkat efektivitas sistem yang dikembangkan dalam memitigasi penipuan tiket dan scalping berdasarkan hasil pengujian fungsional, pengujian smart contract, dan evaluasi pengguna?

---

## 1.4 Batasan Masalah

Agar penelitian ini tetap fokus dan dapat diselesaikan dalam lingkup skripsi, ditetapkan batasan masalah sebagai berikut:

1. Sistem dikembangkan dan diuji pada jaringan **Polygon Amoy Testnet** (Chain ID: 80002), bukan pada jaringan *mainnet* yang memerlukan mata uang kripto sesungguhnya.

2. Smart contract ditulis menggunakan bahasa **Solidity versi 0.8.x** dengan memanfaatkan library **OpenZeppelin Contracts** untuk standar ERC-721.

3. Aplikasi web dibangun menggunakan framework **Next.js 14** dengan bahasa **TypeScript**, dan tampilan antarmuka menggunakan **Tailwind CSS**.

4. Basis data off-chain menggunakan **PostgreSQL** yang di-hosting pada layanan **Supabase**.

5. Proses pembayaran menggunakan **simulasi** melalui Xendit dalam mode *sandbox/test*, bukan transaksi pembayaran riil.

6. Dynamic QR Code diimplementasikan dengan mekanisme rotasi setiap **30 detik** dan validasi berbasis *timestamp* serta *hash signature* menggunakan SHA-256.

7. Sistem deteksi fraud menggunakan pendekatan **rule-based scoring** berdasarkan pola perilaku transaksi, bukan model *machine learning* yang di-*training* dengan dataset riil.

8. Aktor pengguna dalam sistem dibatasi pada empat peran: **Buyer** (pembeli tiket), **Organizer** (penyelenggara event), **Gate Officer** (petugas verifikasi di gerbang masuk), dan **Admin** (pengelola platform).

9. Penelitian ini **tidak** mencakup pengembangan aplikasi mobile native (iOS/Android), integrasi perangkat keras gate scanner, maupun deployment ke lingkungan produksi.

10. Pengujian sistem dilakukan melalui pengujian fungsional (*black-box testing*), pengujian unit smart contract, pengujian skenario keamanan QR Code, serta evaluasi pengguna melalui kuesioner.

---

## 1.5 Tujuan Penelitian

Berdasarkan rumusan masalah yang telah ditetapkan, tujuan penelitian ini adalah sebagai berikut:

1. Merancang dan mengimplementasikan sistem tiket event berbasis NFT (ERC-721) pada blockchain Polygon yang dapat memitigasi peredaran tiket palsu dan duplikat dalam proses resale.

2. Mengimplementasikan smart contract dengan mekanisme *price cap*, pembatasan pembelian per wallet, pembatasan jumlah resale, dan distribusi royalti otomatis kepada penyelenggara event untuk mengendalikan proses resale tiket.

3. Mengembangkan mekanisme Dynamic QR Code berbasis *timestamp* dan tanda tangan kriptografis yang mampu mencegah penggunaan tiket oleh pihak yang tidak berhak serta penggunaan ulang tiket yang sudah di-redeem.

4. Membangun transparansi riwayat kepemilikan dan transaksi tiket melalui pencatatan event log on-chain (*TicketMinted*, *TicketResold*, *TicketRedeemed*) yang dapat diverifikasi secara independen.

5. Menguji dan mengevaluasi efektivitas sistem yang dikembangkan dalam memitigasi penipuan tiket dan scalping melalui pengujian fungsional, pengujian smart contract, dan evaluasi pengguna.

---

## 1.6 Manfaat Penelitian

### 1.6.1 Manfaat Teoritis

1. Memberikan kontribusi ilmiah mengenai penerapan teknologi blockchain dan smart contract dalam domain sistem ticketing event, khususnya pada aspek mitigasi penipuan dan pengendalian resale.

2. Memperkaya literatur tentang pendekatan Design Science Research Methodology (DSRM) dalam pengembangan artefak sistem informasi yang mengintegrasikan blockchain, smart contract, dan Dynamic QR Code.

3. Menyediakan referensi akademis mengenai mekanisme anti-scalping berbasis smart contract yang dapat di-*enforce* secara on-chain, termasuk implementasi *price cap*, pembatasan per wallet, dan royalti otomatis.

### 1.6.2 Manfaat Praktis

1. **Bagi Penyelenggara Event**: Menyediakan platform resale tiket yang terkontrol, di mana penyelenggara dapat menetapkan batas harga resale dan menerima royalti dari setiap transaksi resale secara otomatis, sehingga membantu melindungi konsumen dari scalping sekaligus meningkatkan pendapatan.

2. **Bagi Pembeli Tiket**: Memberikan jaminan keaslian tiket melalui verifikasi berbasis blockchain dan mekanisme Dynamic QR Code yang mengurangi risiko pembelian tiket palsu atau duplikat pada pasar resale.

3. **Bagi Pengembang Sistem**: Menyediakan referensi arsitektur dan implementasi teknis untuk membangun sistem ticketing terdesentralisasi yang mengintegrasikan blockchain (Polygon), smart contract (Solidity/ERC-721), dan Dynamic QR Code pada *technology stack* berbasis web modern (Next.js, TypeScript, PostgreSQL).

4. **Bagi Peneliti Selanjutnya**: Menjadi dasar bagi penelitian lanjutan yang dapat mengembangkan aspek-aspek yang belum tercakup dalam penelitian ini, seperti penggunaan model *machine learning* untuk deteksi fraud, deployment pada *mainnet*, atau integrasi dengan aplikasi mobile.

---

## 1.7 Sistematika Penulisan

Penulisan skripsi ini disusun dalam lima bab dengan sistematika sebagai berikut:

**BAB I PENDAHULUAN**

Bab ini menguraikan latar belakang masalah yang mendasari penelitian, identifikasi masalah yang ditemukan, rumusan masalah dalam bentuk pertanyaan penelitian, batasan masalah yang menetapkan ruang lingkup penelitian, tujuan yang ingin dicapai, manfaat penelitian baik secara teoritis maupun praktis, serta sistematika penulisan skripsi.

**BAB II TINJAUAN PUSTAKA**

Bab ini menyajikan landasan teori yang relevan dengan penelitian, mencakup konsep teknologi blockchain, smart contract, Non-Fungible Token (NFT) dengan standar ERC-721, jaringan Polygon, sistem ticketing digital, Dynamic QR Code, mekanisme anti-scalping, serta Design Science Research Methodology (DSRM). Selain itu, bab ini juga memuat kajian terhadap penelitian-penelitian terdahulu yang berkaitan dengan penggunaan blockchain dalam sistem ticketing, serta mengidentifikasi *research gap* yang menjadi dasar dilakukannya penelitian ini.

**BAB III METODOLOGI PENELITIAN**

Bab ini menjelaskan metodologi yang digunakan dalam penelitian, yaitu Design Science Research Methodology (DSRM) yang meliputi enam tahapan: identifikasi masalah dan motivasi, penentuan tujuan solusi, desain dan pengembangan, demonstrasi, evaluasi, serta komunikasi. Bab ini juga menguraikan instrumen penelitian, teknik pengumpulan data, metode pengujian sistem (pengujian fungsional, pengujian smart contract, pengujian keamanan QR Code, dan evaluasi pengguna), serta teknik analisis data yang digunakan.

**BAB IV HASIL DAN PEMBAHASAN**

Bab ini memaparkan hasil perancangan dan implementasi sistem Tivent, mencakup arsitektur sistem, implementasi smart contract, implementasi Dynamic QR Code, dan implementasi antarmuka pengguna. Selanjutnya, bab ini menyajikan hasil pengujian yang meliputi pengujian fungsionalitas, pengujian unit smart contract, pengujian skenario keamanan, serta hasil evaluasi pengguna. Pembahasan dilakukan untuk menganalisis temuan-temuan dari hasil pengujian dan mengevaluasi efektivitas sistem dalam memitigasi penipuan dan scalping.

**BAB V KESIMPULAN DAN SARAN**

Bab ini berisi kesimpulan yang menjawab rumusan masalah penelitian berdasarkan hasil pengujian dan evaluasi yang telah dilakukan. Selain itu, bab ini juga menguraikan keterbatasan penelitian serta saran untuk pengembangan dan penelitian selanjutnya.
