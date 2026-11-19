# 🎴 AI Flashcard Generator - MVP

Aplikasi web sederhana untuk mengubah materi PDF/DOCX menjadi flashcard belajar menggunakan Google Gemini AI.

---

## 📁 Struktur Folder

```
ai-flashcard-generator/
├── app/
│   ├── layout.tsx          ← Layout utama (HTML wrapper)
│   ├── page.tsx            ← Halaman utama (UI/Frontend)
│   ├── globals.css         ← CSS global (Tailwind)
│   └── api/
│       └── generate/
│           └── route.ts    ← Backend API route (server-side)
├── lib/
│   ├── extractText.ts      ← Utility baca PDF & DOCX
│   └── gemini.ts           ← Konfigurasi & fungsi Gemini AI
├── .env.local              ← ⚠️ File API key (JANGAN di-share!)
├── .env.example            ← Template .env (aman di-share)
├── .gitignore              ← File yang tidak di-upload ke Git
├── package.json            ← Daftar dependencies
├── next.config.js          ← Konfigurasi Next.js
├── tailwind.config.js      ← Konfigurasi Tailwind CSS
└── tsconfig.json           ← Konfigurasi TypeScript
```

---

## 🚀 Cara Menjalankan

### Langkah 1: Masuk ke folder project

Buka Terminal/PowerShell, lalu:
```bash
cd "C:\Users\devia\.gemini\antigravity\scratch\ai-flashcard-generator"
```

### Langkah 2: Install dependencies

```bash
npm install
```

> Hanya perlu dilakukan sekali. Proses ini akan mengunduh semua library yang diperlukan.

### Langkah 3: Isi API Key

1. Buka file `.env.local` di folder project
2. Ganti `isi_api_key_anda_disini` dengan API key Anda
3. Simpan file

### Langkah 4: Jalankan aplikasi

```bash
npm run dev
```

### Langkah 5: Buka di browser

```
http://localhost:3000
```

---

## 🔑 Cara Mendapatkan Gemini API Key (GRATIS)

1. Buka **https://aistudio.google.com/apikey**
2. Login dengan akun Google
3. Klik tombol **"Create API key"**
4. Pilih project (atau buat project baru)
5. Copy API key yang muncul
6. Paste ke file `.env.local`

> Free tier Gemini 2.5 Flash: 10 request/menit, 500 request/hari. Lebih dari cukup untuk penggunaan pribadi!

---

## 📄 File yang Harus Diisi API Key

Buka file: **`.env.local`**

```
GEMINI_API_KEY=isi_api_key_anda_disini
            ↑ Ganti ini dengan API key Anda
```

Contoh setelah diisi:
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## ⚠️ Keamanan

- File `.env.local` sudah ada di `.gitignore` → **tidak akan ter-upload ke GitHub**
- API key **tidak pernah** dikirim ke browser
- File yang diupload **tidak disimpan** ke disk, hanya diproses di memori
