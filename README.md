# SIKEL Masyarakat – Edukasi (KIE) dan alur konseling

Website untuk masyarakat (tanpa login) dan halaman admin `#admin` untuk mengelola isinya.
Memakai Supabase yang sama dengan project admin SIKEL. Demo portofolio, bukan situs resmi BKKBN.

## Menyiapkan database
Jalankan berurutan di Supabase, SQL Editor: `supabase/schema_masyarakat.sql`, lalu `supabase/seed_masyarakat.sql` (satu kali).

## Menjalankan
1. Pastikan `.env` berisi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` (lihat `.env.example`).
2. `npm install`
3. `npm run dev`
Halaman admin: alamat website diikuti `#admin`. Login memakai akun admin Supabase yang sudah ada.

## Deploy
Repository GitHub baru, import di Vercel (Vite), isi dua variabel lingkungan yang sama, lalu Deploy.
