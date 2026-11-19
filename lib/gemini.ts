/**
 * lib/gemini.ts
 *
 * Konfigurasi dan fungsi untuk memanggil Gemini API.
 * API key dibaca dari environment variable GEMINI_API_KEY.
 * File ini HANYA dijalankan di server.
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
 */
export async function generateFlashcardsWithGemini(
  text: string,
  cardCount: number
): Promise<FlashcardResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum diatur. Silakan buat file .env.local dan isi API key Anda."
    );
  }

  // Batasi panjang materi
  const MAX_CHARS = 50000;

  const truncatedText =
    text.length > MAX_CHARS
      ? text.slice(0, MAX_CHARS) +
        "\n\n[Catatan: Materi dipotong karena terlalu panjang. Hanya bagian awal yang digunakan.]"
      : text;

  if (truncatedText.length < 50) {
    throw new Error(
      "Materi terlalu pendek untuk membuat flashcard yang bermakna."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  /*
   * Model utama.
   *
   * Kalau model ini sedang overload dan memberikan 503,
   * sistem akan melakukan retry terlebih dahulu.
   *
   * Jika masih gagal, sistem mencoba fallback.
   */
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ];

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

FORMAT OUTPUT JSON:
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

  let lastError: unknown = null;

  /*
   * Coba model satu per satu.
   */
  for (const modelName of models) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    /*
     * Retry maksimal 3 kali untuk error sementara seperti 503.
     */
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[Gemini] Mencoba model ${modelName}, attempt ${attempt}/${MAX_RETRIES}`
        );

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON
        let parsed: FlashcardResult;

        try {
          parsed = JSON.parse(responseText);
        } catch {
          // Kalau AI memberikan JSON dengan tambahan teks
          const jsonMatch = responseText.match(
            /\{[\s\S]*"flashcards"[\s\S]*\}/
          );

          if (!jsonMatch) {
            throw new Error(
              "AI menghasilkan respons yang bukan JSON valid. Coba generate ulang."
            );
          }

          parsed = JSON.parse(jsonMatch[0]);
        }

        // Validasi struktur
        if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
          throw new Error(
            'Format respons AI tidak sesuai. Field "flashcards" tidak ditemukan.'
          );
        }

        if (parsed.flashcards.length === 0) {
          throw new Error(
            "AI tidak menghasilkan flashcard. Materi mungkin terlalu sedikit."
          );
        }

        // Validasi setiap flashcard
        const validCards = parsed.flashcards.filter(
          (card) =>
            card &&
            typeof card.question === "string" &&
            card.question.trim() !== "" &&
            typeof card.answer === "string" &&
            card.answer.trim() !== ""
        );

        if (validCards.length === 0) {
          throw new Error(
            "Semua flashcard tidak valid. Coba generate ulang."
          );
        }

        /*
         * Berhasil.
         */
        console.log(`[Gemini] Berhasil menggunakan model ${modelName}`);

        return {
          flashcards: validCards.slice(0, cardCount),
        };
      } catch (err: unknown) {
        lastError = err;

        const message =
          err instanceof Error ? err.message : String(err);

        const lowerMessage = message.toLowerCase();

        const is503 =
          lowerMessage.includes("503") ||
          lowerMessage.includes("service unavailable") ||
          lowerMessage.includes("high demand") ||
          lowerMessage.includes("overloaded");

        const is429 =
          lowerMessage.includes("429") ||
          lowerMessage.includes("rate limit") ||
          lowerMessage.includes("quota");

        const isAuthError =
          lowerMessage.includes("401") ||
          lowerMessage.includes("403") ||
          lowerMessage.includes("api key") ||
          lowerMessage.includes("invalid api key");

        /*
         * API key salah → tidak perlu retry.
         */
        if (isAuthError) {
          throw new Error(
            "API key Gemini tidak valid atau tidak memiliki akses ke model. Pastikan GEMINI_API_KEY di .env.local sudah benar."
          );
        }

        /*
         * Kalau quota/rate limit → jangan spam request.
         */
        if (is429) {
          throw new Error(
            "Quota atau rate limit Gemini API tercapai. Silakan tunggu beberapa saat lalu coba lagi."
          );
        }

        /*
         * Kalau 503 → tunggu lalu retry.
         */
        if (is503 && attempt < MAX_RETRIES) {
          const delay = attempt * 2000;

          console.log(
            `[Gemini] Model ${modelName} sedang overload. Retry dalam ${delay}ms...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        /*
         * Kalau bukan 503 atau retry sudah habis,
         * keluar dari loop retry dan coba model berikutnya.
         */
        break;
      }
    }

    console.log(
      `[Gemini] Model ${modelName} gagal. Mencoba fallback berikutnya...`
    );
  }

  /*
   * Semua model gagal.
   */
  if (lastError instanceof Error) {
    const message = lastError.message.toLowerCase();

    if (
      message.includes("503") ||
      message.includes("service unavailable") ||
      message.includes("high demand") ||
      message.includes("overloaded")
    ) {
      throw new Error(
        "Server Gemini sedang mengalami traffic tinggi. Sistem sudah mencoba beberapa kali. Silakan coba lagi beberapa saat."
      );
    }

    throw lastError;
  }

  throw new Error(
    "Terjadi kesalahan saat menghubungi Gemini API. Silakan coba lagi."
  );
}