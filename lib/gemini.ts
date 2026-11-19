/**
 * lib/gemini.ts
 *
 * Konfigurasi dan fungsi untuk memanggil Gemini API.
 * API key dibaca dari environment variable GEMINI_API_KEY.
 * File ini HANYA dijalankan di server, tidak pernah dikirim ke browser.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Tipe data flashcard
export interface Flashcard {
  question: string;
  answer: string;
}

export interface FlashcardResult {
  flashcards: Flashcard[];
}

/**
 * Membuat flashcard dari teks materi menggunakan Gemini AI.
 *
 * @param text - Teks materi yang sudah diekstrak dari PDF/DOCX
 * @param cardCount - Jumlah flashcard yang diminta (1-10)
 * @returns Array of flashcard {question, answer}
 */
export async function generateFlashcardsWithGemini(
  text: string,
  cardCount: number
): Promise<FlashcardResult> {
  // Ambil API key dari environment variable (hanya tersedia di server)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum diatur. Silakan buat file .env.local dan isi API key Anda."
    );
  }

  // Batasi panjang teks agar tidak melebihi context window
  // Gemini 2.5 Flash mendukung 1M token, tapi kita batasi untuk efisiensi
  const MAX_CHARS = 50000;
  const truncatedText =
    text.length > MAX_CHARS
      ? text.slice(0, MAX_CHARS) +
        "\n\n[Catatan: Materi dipotong karena terlalu panjang. Hanya bagian awal yang digunakan.]"
      : text;

  if (truncatedText.length < 50) {
    throw new Error("Materi terlalu pendek untuk membuat flashcard yang bermakna.");
  }

  // Inisialisasi Gemini API client
  const genAI = new GoogleGenerativeAI(apiKey);

  // Gunakan Gemini 2.5 Flash (tersedia di free tier)
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  // Prompt yang dikirim ke AI
  const prompt = `Kamu adalah asisten belajar yang bertugas membuat flashcard dari materi pelajaran.

TUGAS:
Buat tepat ${cardCount} flashcard berdasarkan materi berikut.

ATURAN WAJIB:
1. HANYA buat flashcard berdasarkan informasi yang terdapat dalam materi di bawah. Jangan mengarang atau menambahkan informasi dari luar materi.
2. Pertanyaan harus menguji pemahaman konsep, bukan sekadar hafalan kata per kata.
3. Jawaban harus singkat, jelas, dan langsung menjawab pertanyaan (maksimal 2-3 kalimat).
4. Hindari pertanyaan yang terlalu mudah. Prioritaskan konsep penting.
5. Jumlah flashcard HARUS tepat ${cardCount}, tidak kurang, tidak lebih.
6. Output HARUS dalam format JSON yang valid seperti contoh di bawah.

FORMAT OUTPUT JSON (ikuti persis):
{
  "flashcards": [
    {
      "question": "Pertanyaan flashcard di sini",
      "answer": "Jawaban singkat dan jelas di sini"
    }
  ]
}

MATERI PELAJARAN:
---
${truncatedText}
---

Sekarang buat ${cardCount} flashcard dalam format JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    let parsed: FlashcardResult;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Coba ekstrak JSON dari dalam teks jika ada teks tambahan
      const jsonMatch = responseText.match(/\{[\s\S]*"flashcards"[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(
          "AI menghasilkan respons yang bukan JSON valid. Coba generate ulang."
        );
      }
    }

    // Validasi struktur JSON
    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error('Format respons AI tidak sesuai. Field "flashcards" tidak ditemukan.');
    }

    if (parsed.flashcards.length === 0) {
      throw new Error("AI tidak menghasilkan flashcard. Materi mungkin terlalu sedikit.");
    }

    // Validasi setiap flashcard punya question dan answer
    const validCards = parsed.flashcards.filter(
      (card) =>
        card &&
        typeof card.question === "string" &&
        card.question.trim() !== "" &&
        typeof card.answer === "string" &&
        card.answer.trim() !== ""
    );

    if (validCards.length === 0) {
      throw new Error("Semua flashcard tidak valid. Coba generate ulang.");
    }

    return { flashcards: validCards };
  } catch (err: unknown) {
    // Handle error rate limit Gemini
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("429")) {
        throw new Error(
          "API rate limit tercapai. Silakan tunggu beberapa menit lalu coba lagi."
        );
      }
      if (msg.includes("api key") || msg.includes("invalid") || msg.includes("401")) {
        throw new Error(
          "API key tidak valid. Pastikan GEMINI_API_KEY di file .env.local sudah benar."
        );
      }
      // Re-throw error yang sudah kita format
      throw err;
    }
    throw new Error("Terjadi kesalahan saat menghubungi Gemini API.");
  }
}
