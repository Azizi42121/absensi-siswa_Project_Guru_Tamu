# DOKUMENTASI PENGUJIAN SISTEM (TEST_CASES.md)
## Sistem Manajemen Absensi Siswa & Guru (PresensiEdu)

Spesifikasi Pengujian: Standar UKK / Industri (Node.js, Express MVC, Prisma SQLite, EJS Tailwind)

---

### SKENARIO PENGUJIAN 1: Login Guru Mapel & Membuka Daftar Siswa Class Binaan
- **Prasyarat**: Server aplikasi telah berjalan di `http://localhost:3000`.
- **Langkah-Langkah**:
  1. Buka `http://localhost:3000/auth/login`.
  2. Klik tombol quick switch **"Guru Mapel"** atau masukkan username `gurumapel` & password `password123`.
  3. Sistem mengarahkan ke `/guru/dashboard`.
  4. Pilih salah satu jadwal mengajar (contoh: kelas **X RPL 1** - Mapel **Pemrograman Web & Perangkat Bergerak**).
  5. Klik tombol **"Input Presensi & Jurnal"**.
- **Hasil yang Diharapkan (Expected Outcome)**:
  - Berhasil masuk ke halaman `/guru/attendance/:scheduleId`.
  - Tampil header rincian kelas, mapel, hari, jam mengajar, form jurnal materi pelajaran, dan daftar seluruh siswa terdaftar di kelas X RPL 1.
- **Status Verifikasi**: **PASSED (LULUS)** ✅

---

### SKENARIO PENGUJIAN 2: Input Presensi Siswa (H/S/I/A) & Penyimpanan Jurnal Materi Pelajaran
- **Prasyarat**: Berada di halaman `/guru/attendance/:scheduleId`.
- **Langkah-Langkah**:
  1. Isi form **Materi Pelajaran**: `"Implementasi Controller Express & EJS Dashboard"`.
  2. Isi form **Catatan Agenda Kelas**: `"Siswa mengikuti pembelajaran hands-on dengan baik"`.
  3. Pada tabel presensi siswa, pilih status untuk setiap siswa:
     - Ahmad Rizky -> **HADIR**
     - Dewi Lestari -> **HADIR**
     - Fajar Pratama -> **SAKIT**
     - Gita Gutawa -> **IZIN**
  4. Klik tombol **"Simpan Presensi & Jurnal"**.
- **Hasil yang Diharapkan (Expected Outcome)**:
  - Presensi dan jurnal materi tersimpan di database SQLite melalui Prisma.
  - Halaman dimuat ulang dengan pemberitahuan sukses dan radio button status siswa tetap terpilih sesuai input.
  - Log audit admin (`/admin/audit`) secara otomatis mencatat transaksi ini.
- **Status Verifikasi**: **PASSED (LULUS)** ✅

---

### SKENARIO PENGUJIAN 3: Siswa Mengunggah Foto/Dokumen Surat Dokter / Izin
- **Prasyarat**: Siswa login ke sistem.
- **Langkah-Langkah**:
  1. Buka `http://localhost:3000/auth/login`.
  2. Klik tombol quick switch **"Siswa"** atau gunakan credential username `siswa` & password `password123`.
  3. Sistem mengarahkan ke `/siswa/dashboard`.
  4. Klik menu/tombol **"Upload Surat Dokter / Izin"** (`/siswa/upload-note`).
  5. Pilih Mata Pelajaran: **Pemrograman Web & Perangkat Bergerak**.
  6. Pilih Kategori: **SAKIT (Surat Dokter / Klinik)**.
  7. Unggah berkas gambar/PDF surat keterangan dokter (`.jpg` / `.pdf`).
  8. Masukkan Alasan: `"Demam tinggi dan istirahat dokter selama 2 hari"`.
  9. Klik **"Kirim Dokumen Keterangan"**.
- **Hasil yang Diharapkan (Expected Outcome)**:
  - Berkas berhasil disimpan di folder `public/uploads/` dengan nama unik.
  - Rekam presensi siswa terbarui dengan status `SAKIT`, menyimpan `suratBuktiUrl`, dan status `verifiedByTeacher = false`.
  - Tampil notifikasi hijau *"Surat Keterangan Berhasil Diunggah!"*.
- **Status Verifikasi**: **PASSED (LULUS)** ✅

---

### SKENARIO PENGUJIAN 4: Guru Memverifikasi Surat Dokter Siswa
- **Prasyarat**: Guru login ke sistem dan membuka daftar pengajuan surat.
- **Langkah-Langkah**:
  1. Login sebagai Guru Mapel (`gurumapel`).
  2. Buka menu **"Verifikasi Surat Sakit/Izin"** (`/guru/verify-notes`).
  3. Tinjau dokumen surat yang diunggah oleh siswa (dapat mengeklik *"Buka File Surat"*).
  4. Klik tombol **"Setujui"** pada baris pengajuan siswa.
- **Hasil yang Diharapkan (Expected Outcome)**:
  - Column `verifiedByTeacher` pada database berubah menjadi `true`.
  - Badge status pada tabel berubah menjadi **"Disetujui"** berwarna hijau.
  - Pada dashboard siswa, status verifikasi surat berubah menjadi *"Terverifikasi"*.
- **Status Verifikasi**: **PASSED (LULUS)** ✅

---

### SKENARIO PENGUJIAN 5: Wali Kelas / Guru Mencetak Rekapitulasi Presensi Bulanan Resmi (Print / PDF)
- **Prasyarat**: Guru/Wali Kelas login ke sistem.
- **Langkah-Langkah**:
  1. Buka menu **"Cetak Rekap Bulanan"** (`/guru/monthly-recap`).
  2. Pilih Jadwal Kelas (contoh: **X RPL 1 - Pemrograman Web**) dan Bulan (contoh: **2026-09**).
  3. Klik tombol **"Tampilkan"**.
  4. Periksa data rekapitulasi hitungan otomatis per siswa (Hadir, Sakit, Izin, Alpa, % Kehadiran).
  5. Klik tombol **"Cetak Laporan (PDF/Print)"**.
- **Hasil yang Diharapkan (Expected Outcome)**:
  - Dialog print browser terbuka (`window.print()`).
  - Elemen navigasi sidebar/navbar dan tombol filter otomatis tersembunyi (`@media print`).
  - Dokumen cetak memiliki Kop Surat Resmi Sekolah, Tabel Rekapitulasi Bulanan yang rapi, dan Kolom Tanda Tangan Pengesahan (Waka Kurikulum & Guru Pengajar).
- **Status Verifikasi**: **PASSED (LULUS)** ✅
