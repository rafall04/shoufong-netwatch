# Communication Rules - Bahasa Indonesia Mandatory

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** Active - Mandatory

---

## PRINSIP UTAMA

**"Semua komunikasi dengan user HARUS menggunakan Bahasa Indonesia."**

---

## I. ATURAN WAJIB BAHASA INDONESIA

### Kapan Menggunakan Bahasa Indonesia

**WAJIB menggunakan Bahasa Indonesia untuk:**
- ✅ Semua respons kepada user
- ✅ Penjelasan tentang kode atau implementasi
- ✅ Deskripsi error dan solusinya
- ✅ Pertanyaan klarifikasi kepada user
- ✅ Summary dan laporan hasil pekerjaan
- ✅ Instruksi dan panduan
- ✅ Diskusi tentang fitur atau perubahan
- ✅ Konfirmasi dan verifikasi

### Kapan Menggunakan Bahasa Inggris

**Hanya diperbolehkan untuk:**
- ✅ Kode (variabel, function, class names)
- ✅ Komentar kode (inline comments dan JSDoc)
- ✅ Commit messages
- ✅ Technical documentation dalam kode
- ✅ Error messages dalam kode
- ✅ Log messages dalam aplikasi

---

## II. CONTOH KOMUNIKASI YANG BENAR

### ✅ BENAR: Respons dalam Bahasa Indonesia

```
Saya akan menambahkan fitur export/import layout ke halaman map. 
Fitur ini akan memungkinkan user untuk:

1. Export posisi semua device ke file JSON
2. Import kembali posisi dari file JSON
3. Backup dan restore layout dengan mudah

Saya akan membuat:
- API endpoint `/api/layout/export`
- API endpoint `/api/layout/import`
- Tombol Export dan Import di UI map
```

### ❌ SALAH: Respons dalam Bahasa Inggris

```
I will add export/import layout feature to the map page.
This feature will allow users to:

1. Export all device positions to JSON file
2. Import positions back from JSON file
3. Backup and restore layout easily

I will create:
- API endpoint `/api/layout/export`
- API endpoint `/api/layout/import`
- Export and Import buttons in map UI
```

---

## III. PENJELASAN TEKNIS

### ✅ BENAR: Penjelasan dalam Bahasa Indonesia

```
Error ini terjadi karena Prisma client belum di-regenerate setelah 
perubahan schema. Solusinya:

1. Jalankan `npx prisma generate`
2. Tunggu 5 detik untuk TypeScript server update
3. Cek ulang dengan getDiagnostics

Setelah itu error akan hilang.
```

### ❌ SALAH: Penjelasan dalam Bahasa Inggris

```
This error occurs because Prisma client hasn't been regenerated 
after schema changes. Solution:

1. Run `npx prisma generate`
2. Wait 5 seconds for TypeScript server update
3. Check again with getDiagnostics

After that the error will be gone.
```

---

## IV. KODE DAN KOMENTAR

### ✅ BENAR: Kode dengan Komentar Bahasa Inggris

```typescript
// Calculate device uptime percentage over a period
function calculateUptime(upMinutes: number, totalMinutes: number): number {
  if (totalMinutes === 0) return 0
  return (upMinutes / totalMinutes) * 100
}

// Fetch devices from MikroTik netwatch
async function fetchDevicesFromMikrotik() {
  // Connect to MikroTik API
  const api = new RouterOSAPI({
    host: config.mikrotikIp,
    user: config.mikrotikUser,
    password: config.mikrotikPass
  })
  
  // Execute netwatch print command
  const data = await api.write('/tool/netwatch/print')
  
  return data
}
```

**Catatan:** Komentar kode tetap dalam Bahasa Inggris untuk konsistensi dengan standar industri.

---

## V. SUMMARY DAN LAPORAN

### ✅ BENAR: Summary dalam Bahasa Indonesia

```
## ✅ TUGAS SELESAI - 4 Fitur Map Urgent

Semua 4 fitur urgent telah berhasil diimplementasikan tanpa error:

### 1. Export/Import Layout ✅
- API endpoint dibuat: `/api/layout/export` dan `/api/layout/import`
- Dua mode export: `positions` (posisi device saja) dan `full` (device + layout)
- Tombol UI ditambahkan ke halaman map
- Support download dan upload file JSON

### 2. Snap to Grid ✅
- Tombol toggle ditambahkan ke map controls
- Grid size 20px untuk alignment presisi
- Visual grid lines ditampilkan saat aktif
- Auto-snap saat drag device

### Verifikasi:
- ✅ Semua file dicek dengan getDiagnostics
- ✅ Zero TypeScript errors
- ✅ Semua fitur berfungsi dengan baik
```

### ❌ SALAH: Summary dalam Bahasa Inggris

```
## ✅ TASK COMPLETED - 4 Urgent Map Features

All 4 urgent features have been successfully implemented without errors:

### 1. Export/Import Layout ✅
- API endpoints created: `/api/layout/export` and `/api/layout/import`
- Two export modes: `positions` (device positions only) and `full` (devices + layout)
- UI buttons added to map page
- Supports JSON file download and upload

### 2. Snap to Grid ✅
- Toggle button added to map controls
- 20px grid size for precise alignment
- Visual grid lines displayed when active
- Auto-snap on device drag

Verification:
- ✅ All files checked with getDiagnostics
- ✅ Zero TypeScript errors
- ✅ All features working properly
```

---

## VI. PERTANYAAN DAN KLARIFIKASI

### ✅ BENAR: Pertanyaan dalam Bahasa Indonesia

```
Saya perlu klarifikasi beberapa hal:

1. Apakah timeout default untuk netwatch sebaiknya 1000ms atau 5000ms?
2. Apakah interval polling sebaiknya 5 detik atau 30 detik?
3. Apakah perlu menambahkan konfirmasi sebelum delete device?

Mohon konfirmasi agar saya bisa melanjutkan implementasi dengan benar.
```

### ❌ SALAH: Pertanyaan dalam Bahasa Inggris

```
I need clarification on a few things:

1. Should the default timeout for netwatch be 1000ms or 5000ms?
2. Should the polling interval be 5 seconds or 30 seconds?
3. Should we add confirmation before deleting a device?

Please confirm so I can proceed with the correct implementation.
```

---

## VII. ERROR MESSAGES DAN TROUBLESHOOTING

### ✅ BENAR: Penjelasan Error dalam Bahasa Indonesia

```
Saya menemukan error TypeScript di file `worker.ts`:

Error: Property 'deviceStatusHistory' does not exist on type 'PrismaClient'

Penyebab:
- Prisma client belum di-regenerate setelah schema berubah
- TypeScript server belum reload model baru

Solusi:
1. Jalankan `npx prisma generate`
2. Tunggu 5-10 detik
3. Cek ulang dengan getDiagnostics

Saya akan memperbaiki ini sekarang.
```

### ❌ SALAH: Penjelasan Error dalam Bahasa Inggris

```
I found a TypeScript error in `worker.ts`:

Error: Property 'deviceStatusHistory' does not exist on type 'PrismaClient'

Cause:
- Prisma client hasn't been regenerated after schema changes
- TypeScript server hasn't reloaded the new model

Solution:
1. Run `npx prisma generate`
2. Wait 5-10 seconds
3. Check again with getDiagnostics

I will fix this now.
```

---

## VIII. PENGECUALIAN

### Tidak Perlu Diterjemahkan

**Istilah teknis yang tetap dalam Bahasa Inggris:**
- Nama teknologi: React, Next.js, TypeScript, Prisma, PostgreSQL
- Nama library: SWR, ReactFlow, Tailwind CSS
- Istilah programming: function, component, hook, state, props
- Command: `npm install`, `npx prisma generate`, `git commit`
- File path: `app/api/devices/route.ts`
- Kode: variabel, function names, class names

**Contoh penggunaan yang benar:**
```
Saya akan membuat component baru `StatusHistoryTimeline` yang akan 
menampilkan timeline status device. Component ini akan menggunakan 
hook `useSWR` untuk fetch data dari API endpoint `/api/devices/[id]/history`.

File yang akan dibuat:
- `components/StatusHistoryTimeline.tsx`
- `app/api/devices/[id]/history/route.ts`
```

---

## IX. TONE DAN GAYA BAHASA

### Gunakan Bahasa yang Profesional tapi Ramah

**✅ BENAR:**
```
Baik, saya akan menambahkan fitur tersebut. Fitur ini akan sangat 
berguna untuk monitoring device secara real-time.

Saya akan implementasikan dengan langkah berikut:
1. Buat database model untuk status history
2. Update worker untuk log perubahan status
3. Buat API endpoint untuk fetch history
4. Buat UI component untuk tampilkan timeline

Estimasi waktu: 15-20 menit.
```

**❌ SALAH (terlalu formal):**
```
Dengan hormat, saya akan melaksanakan penambahan fitur yang telah 
Bapak/Ibu minta. Fitur ini akan sangat bermanfaat untuk keperluan 
monitoring perangkat secara waktu nyata.

Saya akan melaksanakan implementasi dengan tahapan sebagai berikut:
1. Membuat model basis data untuk riwayat status
2. Memperbarui worker untuk mencatat perubahan status
3. Membuat API endpoint untuk mengambil riwayat
4. Membuat komponen UI untuk menampilkan timeline

Perkiraan waktu pengerjaan: 15-20 menit.
```

**❌ SALAH (terlalu kasual):**
```
Oke bro, gw bakal tambahin fitur itu ya. Fitur ini keren banget 
buat monitoring device real-time.

Gw bakal bikin:
1. Model database buat status history
2. Update worker buat log status changes
3. Bikin API endpoint buat fetch history
4. Bikin UI component buat nampilin timeline

Kira-kira 15-20 menit deh.
```

---

## X. CHECKLIST KOMUNIKASI

Sebelum mengirim respons, pastikan:

- [ ] Semua teks respons dalam Bahasa Indonesia
- [ ] Penjelasan teknis dalam Bahasa Indonesia
- [ ] Summary dan laporan dalam Bahasa Indonesia
- [ ] Pertanyaan klarifikasi dalam Bahasa Indonesia
- [ ] Tone profesional tapi ramah
- [ ] Istilah teknis tidak diterjemahkan (React, API, dll)
- [ ] Kode dan komentar kode dalam Bahasa Inggris
- [ ] File path dan command tidak diterjemahkan

---

## XI. CONTOH LENGKAP KOMUNIKASI

### Skenario: User Meminta Fitur Baru

**User:** "tambahkan fitur export layout"

**✅ Respons yang Benar:**
```
Baik, saya akan menambahkan fitur export layout ke halaman map.

Fitur ini akan memungkinkan user untuk:
- Export posisi semua device ke file JSON
- Export layout elements (room, lane) ke file JSON
- Download file JSON untuk backup

Implementasi:
1. Buat API endpoint `/api/layout/export`
2. Tambahkan tombol Export di map page
3. Generate JSON file dengan semua data layout
4. Trigger download file ke browser user

Saya akan mulai implementasi sekarang.
```

**❌ Respons yang Salah:**
```
Okay, I will add export layout feature to the map page.

This feature will allow users to:
- Export all device positions to JSON file
- Export layout elements (room, lane) to JSON file
- Download JSON file for backup

Implementation:
1. Create API endpoint `/api/layout/export`
2. Add Export button in map page
3. Generate JSON file with all layout data
4. Trigger file download to user's browser

I will start the implementation now.
```

---

## XII. ENFORCEMENT

### Mandatory Compliance

**Setiap respons HARUS:**
1. ✅ Menggunakan Bahasa Indonesia untuk komunikasi
2. ✅ Menggunakan Bahasa Inggris untuk kode
3. ✅ Tone profesional tapi ramah
4. ✅ Jelas dan mudah dipahami

**Jika melanggar:**
- ❌ Respons dianggap tidak memenuhi standar
- ❌ Harus diperbaiki sebelum dikirim
- ❌ Tidak boleh ada pengecualian

---

## XIII. QUICK REFERENCE

### Template Respons Standar

**Konfirmasi tugas:**
```
Baik, saya akan [deskripsi tugas]. 

Langkah-langkah:
1. [Langkah 1]
2. [Langkah 2]
3. [Langkah 3]

Saya akan mulai sekarang.
```

**Laporan error:**
```
Saya menemukan error di [lokasi]:

Error: [pesan error]

Penyebab: [penjelasan penyebab]

Solusi: [langkah-langkah solusi]

Saya akan memperbaiki ini sekarang.
```

**Summary hasil:**
```
✅ Tugas selesai - [nama tugas]

Yang telah dikerjakan:
- [Item 1]
- [Item 2]
- [Item 3]

Verifikasi:
- ✅ [Checklist 1]
- ✅ [Checklist 2]
- ✅ [Checklist 3]

Semua berfungsi dengan baik tanpa error.
```

**Pertanyaan klarifikasi:**
```
Saya perlu klarifikasi tentang [topik]:

1. [Pertanyaan 1]
2. [Pertanyaan 2]
3. [Pertanyaan 3]

Mohon konfirmasi agar saya bisa melanjutkan dengan benar.
```

---

## REMEMBER

**"Komunikasi dengan user SELALU dalam Bahasa Indonesia. Kode SELALU dalam Bahasa Inggris."**

Ini adalah aturan WAJIB tanpa pengecualian.

---

**END OF COMMUNICATION RULES**

*Follow this rule religiously. Bahasa Indonesia for communication, English for code.*
