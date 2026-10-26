# Apex Global — Next.js (MODE DEMO, tanpa database)

Versi ini menjalankan **seluruh website + dashboard admin tanpa MySQL/Prisma**. Database diganti database tiruan
in-memory (`src/lib/mock-db.ts`) yang diisi data contoh (`src/lib/mock-seed.ts`). Semua halaman dan server action
lama tetap dipakai apa adanya (nama `prisma` di `src/lib/db.ts` dipertahankan).

> ⚠️ Data hidup di memori server. **Semua perubahan (CRUD, pesan kontak, sesi login, file upload) hilang saat server
> restart / cold start.** Gunakan hanya untuk testing & demo.

## Menjalankan lokal
```bash
npm install
npm run dev          # http://localhost:3000
# produksi: npm run build && npm run start
```
Tidak perlu `.env`. Akun admin demo (dibuat otomatis): `admin@apex-demo.test` / `Demo-Admin-2026`
(petunjuknya tampil di halaman login). Ganti lewat `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` — **wajib jika situs demo bersifat publik**.

## Deploy ke Vercel
1. Push ke GitHub (disarankan branch baru, mis. `demo-tanpa-db`, supaya versi berdatabase tetap utuh).
2. Vercel → *Add New → Project* → import repo → framework **Next.js**, biarkan pengaturan default.
3. (Opsional) Environment Variables: `SITE_URL` (URL Vercel Anda), `DEMO_ADMIN_PASSWORD`.
4. Deploy.

**Keterbatasan di Vercel (serverless):** tiap instance punya memori sendiri.
- ✅ Halaman publik selalu konsisten (data awal sama di setiap instance).
- ✅ Login admin stabil: sesi berupa token bertanda tangan di cookie, valid di instance mana pun (isi `SESSION_SECRET` sendiri untuk keamanan lebih baik).
- ⚠️ **Hasil edit admin (CRUD, pesan kontak, upload) hanya tampil di instance yang memprosesnya** dan hilang saat cold start/restart. Untuk demo CRUD yang konsisten, pakai host satu-proses (Railway, Render, VPS: `npm run build && npm start`), jalankan lokal, atau tambahkan penyimpanan eksternal.

## Variabel lingkungan (semua opsional)
| Variabel | Fungsi |
|---|---|
| `SITE_URL` | URL publik (canonical, sitemap, Open Graph) |
| `DEMO_ADMIN_NAME` / `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` | Akun Super Admin demo |
| `DEMO_SEED_ADMIN=false` | Tidak membuat akun demo; pakai `/dashboard-admin/signup` + `BOOTSTRAP_TOKEN` |
| `MAX_UPLOAD_MB` | Batas upload (default 4 MB; batas body serverless ±4,5 MB) |
| `SESSION_SECRET` | Kunci penandatangan token sesi admin (string acak panjang; wajib sama di semua instance) |
| `SESSION_IDLE_MINUTES`, `SESSION_MAX_HOURS` | Masa berlaku sesi admin |

## Fitur yang tetap berfungsi
Semua halaman publik (Home, Services, Products + detail, Portfolio, Gallery, Our Team, Blogs + detail & pencarian, Contact),
sitemap/robots, SEO per halaman, dashboard admin (login, bootstrap signup, CRUD semua modul, pesan kontak, media library
dengan validasi magic-bytes, pengguna & role, activity logs, settings, SEO), idle-timeout sesi, rate limit, honeypot.

## Kembali ke versi berdatabase
Ganti `src/lib/db.ts` dengan `PrismaClient`, kembalikan `prisma/` + dependensi `@prisma/client`/`prisma`, dan
`src/lib/media.ts` ke penyimpanan disk/S3 dari repo asli Anda.
