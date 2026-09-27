# Sistem Manajemen Absensi Siswa & Guru (PresensiEdu)

Aplikasi web utuh, modular, dan siap pakai untuk **Sistem Manajemen Absensi Siswa & Guru (Jurnal Mengajar)** dengan pengamanan otorisasi **3 Level Role-Based Access Control (RBAC)**: Admin (Waka Kurikulum / IT), Guru Mapel (Wali Kelas), dan Siswa (Wali Murid).

---

## 🛠️ Tech Stack & Arsitektur
- **Runtime & Server**: Node.js & Express.js (Arsitektur MVC: Controllers, Models, Routes, Views, Middlewares)
- **Database & ORM**: SQLite dengan Prisma ORM
- **View Engine**: EJS (Embedded JavaScript)
- **Styling**: Vanilla CSS + Tailwind CSS (Clean Modern Light Dashboard with Glassmorphism)
- **Authentication**: Session-based auth (`express-session`) + `bcryptjs` password hashing
- **File Upload**: `multer` (Upload surat sakit / dokter / izin)

---

## 🔐 3 Level Role & Kredensial Demo (Quick Switch)

Aplikasi menyediakan **1-Click Quick Demo Login** pada halaman login:

| Role | Username | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `password123` | Master Data Kelas, Siswa, Guru, Mapel, Jadwal, Dashboard Statistik Real-Time & Audit Log Presensi Guru |
| **GURU_MAPEL** | `gurumapel` | `password123` | Input Presensi Siswa (H/S/I/A), Input Jurnal Materi & Agenda Kelas, Verifikasi Surat Sakit, Cetak Rekap Bulanan |
| **SISWA** | `siswa` | `password123` | Lihat Rekap Kehadiran Pribadi per Mapel, Upload Surat Dokter/Izin, Warning Kehadiran <75% |

---

## 🚀 Cara Menjalankan Aplikasi

1. **Install Dependensi**:
   ```bash
   npm install
   ```

2. **Inisialisasi Skema Database**:
   ```bash
   npx prisma db push
   ```

3. **Populasi Data Awal (Seed)**:
   ```bash
   node prisma/seed.js
   ```

4. **Jalankan Server Express**:
   ```bash
   npm start
   ```

5. **Akses di Browser**:
   Buka [http://localhost:3000](http://localhost:3000)

---

## 📄 Pengujian Sistem (5 Skenario Wajib)
Seluruh pengujian sesuai spesifikasi tugas praktik UKK dapat dilihat secara mendalam pada file [`TEST_CASES.md`](file:///d:/absensi-siswa_Project_Guru_Tamu/TEST_CASES.md).
