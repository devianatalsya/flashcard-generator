/**
 * app/api/generate/route.ts
 *
 * API Route untuk memproses upload file dan generate flashcard.
 * File ini berjalan di SERVER, bukan di browser.
 * API key Gemini AMAN di sini karena tidak pernah dikirim ke client.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, extractTextFromDOCX } from "@/lib/extractText";
import { generateFlashcardsWithGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    // Parse FormData dari request
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Gagal membaca data yang dikirim. Pastikan Anda mengupload file." },
        { status: 400 }
      );
    }

    // Ambil file dari FormData
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "File tidak ditemukan. Silakan upload file PDF atau DOCX." },
        { status: 400 }
      );
    }

    // Ambil jumlah kartu
    const cardCountRaw = formData.get("cardCount");
    const cardCount = parseInt(String(cardCountRaw), 10);
    if (isNaN(cardCount) || cardCount < 1 || cardCount > 10) {
      return NextResponse.json(
        { error: "Jumlah flashcard tidak valid. Pilih antara 1 sampai 10." },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maks 20MB)
    if (file.size === 0) {
      return NextResponse.json(
        { error: "File kosong. Silakan upload file yang berisi materi." },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 20MB." },
        { status: 400 }
      );
    }

    // Validasi tipe file berdasarkan nama dan MIME type
    const fileName = file.name.toLowerCase();
    const isPDF = fileName.endsWith(".pdf") || file.type === "application/pdf";
    const isDOCX =
      fileName.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isPDF && !isDOCX) {
      return NextResponse.json(
        {
          error:
            "Format file tidak didukung. Hanya file PDF (.pdf) dan Word (.docx) yang diizinkan.",
        },
        { status: 400 }
      );
    }

    // Konversi File ke Buffer untuk diproses
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ekstrak teks dari file
    let extractedText: string;
    try {
      if (isPDF) {
        extractedText = await extractTextFromPDF(buffer);
      } else {
        extractedText = await extractTextFromDOCX(buffer);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal membaca isi file.";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // Validasi panjang teks
    if (extractedText.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            "Materi terlalu pendek (kurang dari 100 karakter). Silakan upload file yang berisi materi yang lebih lengkap.",
        },
        { status: 422 }
      );
    }

    // Generate flashcard dengan Gemini AI
    let result;
    try {
      result = await generateFlashcardsWithGemini(extractedText, cardCount);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menghubungi Gemini API.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Sukses! Kembalikan flashcard ke client
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error("[/api/generate] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan tidak terduga pada server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
