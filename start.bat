@echo off
title AI Flashcard Generator
echo.
echo ==========================================
echo   AI Flashcard Generator - MVP
echo ==========================================
echo.
echo Memeriksa konfigurasi...

REM Cek apakah .env.local ada dan berisi API key
if not exist ".env.local" (
    echo.
    echo [ERROR] File .env.local tidak ditemukan!
    echo Silakan buat file .env.local dan isi GEMINI_API_KEY.
    echo Contoh: lihat file .env.example
    echo.
    pause
    exit /b 1
)

findstr /C:"isi_api_key_anda_disini" .env.local >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo [PERINGATAN] GEMINI_API_KEY belum diisi di file .env.local!
    echo Buka file .env.local dan ganti "isi_api_key_anda_disini" dengan API key Anda.
    echo Dapatkan API key gratis di: https://aistudio.google.com/apikey
    echo.
    pause
)

echo.
echo Menjalankan server...
echo Buka browser di: http://localhost:3000
echo.
echo Tekan Ctrl+C untuk menghentikan server.
echo.

node_modules\.bin\next dev
