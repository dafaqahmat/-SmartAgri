# 🌾 Smart Village Agriculture & Irrigation System (Smart Agri Desa)

**Smart Agri Desa** adalah sebuah aplikasi web pintar berbasis *role* (Admin & Petani) yang dirancang untuk mendigitalisasi dan mempermudah tata kelola sumber daya air (irigasi) dan penjadwalan tanam di lingkup desa. Aplikasi ini hadir untuk mencegah bentrok/perebutan jadwal air antar petani dan memberikan wawasan (*insight*) menyeluruh terkait proyeksi panen dan harga pasar desa.

---

## ✨ Fitur Utama

### 🧑‍🌾 Untuk Petani (User)
*   **Booking Jadwal Air (Irigasi)**: Memesan giliran pengairan sawah melalui peta interaktif. Sistem secara otomatis mencegah terjadinya bentrok waktu (jadwal ganda) dengan sawah milik petani lain. Petani dapat membatalkan atau mengubah pesanan yang masih berstatus **PENDING**.
*   **Jadwal Tanam & Laporan Keuangan**: Mencatat komoditas yang ditanam dan melihat estimasi otomatis tanggal panen. Dilengkapi dengan **Sistem Pencatatan Pengeluaran Terperinci (Itemized Expenses)** yang memotong estimasi kotor menjadi pendapatan bersih secara *real-time*.
*   **Monitoring Harga Pasar**: Memantau perkembangan harga pasar terkini per-kilogram untuk masing-masing komoditas.
*   **Laporan Mandiri**: Melihat statistik pribadi (jumlah sawah, frekuensi irigasi, dan estimasi hasil panen) serta bisa di-*export* ke CSV.
*   **Manajemen Profil**: Mengubah data diri dan kata sandi.

### 👑 Untuk Perangkat Desa (Admin)
*   **Manajemen Petani & Sawah (Aman dari Penghapusan)**: Menambah atau mendaftarkan titik lokasi sawah. Fitur hapus digantikan dengan **Soft Delete (Nonaktif)** agar riwayat data panen atau pengeluaran lama tidak rusak.
*   **Manajemen Komoditas & Harga**: Admin dapat memperbarui, menambah, atau menonaktifkan (*Soft Delete*) komoditas yang tidak lagi relevan agar tidak dipilih oleh petani.
*   **Pengaturan Master Irigasi**: Mengatur slot waktu jam irigasi harian yang diperbolehkan di desa.
*   **Penyetujuan Booking & Proteksi Integritas**: 
    - Menerima/Menolak pengajuan air Petani (lengkap dengan fitur **Alasan Penolakan** / *Info Tolak*). 
    - Admin dapat memesankan air atas nama petani, namun **Admin tidak diizinkan mengubah/menghapus pengajuan yang dibuat murni oleh Petani** (demi transparansi data).
*   **Pemantauan Dashboard Global**: Melihat total estimasi panen seluruh desa, jumlah blok yang sedang dialiri air hari ini, dan tabel jadwal antrean terbaru.
*   **Laporan Desa**: Menarik laporan aktivitas seluruh petani di desa dalam format CSV/Excel.

### 🗺️ Fitur Publik (Live Map)
*   **Peta Status Irigasi (Halaman Login)**: Peta satelit publik yang dapat dilihat sebelum login. Titik sawah yang *sedang* dialiri air detik ini akan otomatis menyala biru 💦, sedangkan sawah yang kering/menunggu giliran akan berwarna hijau 🟢.

---

## 🛠️ Teknologi yang Digunakan

**Frontend:**
*   **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Maps**: [Leaflet.js](https://leafletjs.com/) (Google Maps Hybrid Tile)
*   **UI/UX**: Custom CSS (Glassmorphism & Dark Mode Aesthetic), [SweetAlert2](https://sweetalert2.github.io/), Vue3-Toastify

**Backend:**
*   **Runtime & Framework**: Node.js & [Express.js](https://expressjs.com/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: MySQL / PostgreSQL (Sesuai konfigurasi `.env`)
*   **Keamanan**: JSON Web Token (JWT) untuk Otentikasi & `bcrypt` untuk enkripsi Password.

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal (Local Development)

Proyek ini terdiri dari dua folder utama: `backend-express` dan `frontend-vue`. Keduanya harus dijalankan secara bersamaan.

### 1. Menyiapkan Backend (Node.js)
1. Buka terminal baru dan masuk ke folder backend:
   ```bash
   cd backend-express
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Pastikan Anda memiliki file `.env` yang berisi URL database MySQL/PostgreSQL Anda serta `JWT_SECRET`.
4. Migrasi database Prisma:
   ```bash
   npx prisma db push
   ```
5. Jalankan server:
   ```bash
   npm run dev
   ```
   *(Server akan berjalan secara default di `http://localhost:3000`)*

### 2. Menyiapkan Frontend (Vue.js)
1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend-vue
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan Vite Development Server:
   ```bash
   npm run dev
   ```
   *(Frontend akan berjalan secara default di `http://localhost:5173`)*

---

## 🔑 Hak Akses & Dummy Akun

Sistem ini memiliki proteksi keamanan rute. Anda dapat melakukan pengujian (testing) menggunakan akun awal berikut (asumsi data sudah di-*seeding* ke dalam database):

*   **Akun Admin**
    *   Email: `admin@desa.com`
    *   Password: `admin123`
*   **Akun Petani**
    *   Email: `petani1@desa.com`
    *   Password: `petani123`

---
*Didesain dan dikembangkan sebagai solusi cerdas (Smart Village) untuk memajukan kesejahteraan dan tata tertib agrikultur desa.* 🌱
