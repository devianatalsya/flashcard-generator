/**
 * lib/extractText.ts
 *
 * Utility untuk mengekstrak teks dari file PDF atau DOCX.
 * Fungsi ini HANYA dijalankan di server (API route), tidak di browser.
 */

/**
 * Ekstrak teks dari buffer file PDF menggunakan pdf-parse.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Import dinamis agar tidak error di sisi client
  const pdfParse = (await import("pdf-parse")).default;

  try {
    const data = await pdfParse(buffer);
    const text = data.text?.trim();

    if (!text || text.length < 50) {
      throw new Error(
        "Teks dalam PDF terlalu sedikit atau tidak bisa dibaca. " +
        "Pastikan PDF bukan gambar hasil scan tanpa OCR."
      );
    }

    return text;
  } catch (err: unknown) {
    // Re-throw error yang kita buat sendiri
    if (err instanceof Error && err.message.includes("terlalu sedikit")) {
      throw err;
    }
    throw new Error("Gagal membaca file PDF. Pastikan file tidak rusak dan berisi teks yang dapat dibaca.");
  }
}

/**
 * Ekstrak teks dari buffer file DOCX menggunakan mammoth.
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;

  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim();

    if (!text || text.length < 50) {
      throw new Error(
        "Teks dalam dokumen Word terlalu sedikit atau kosong. " +
        "Pastikan dokumen berisi materi yang cukup."
      );
    }

    return text;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("terlalu sedikit")) {
      throw err;
    }
    throw new Error("Gagal membaca file DOCX. Pastikan file tidak rusak dan merupakan format .docx (bukan .doc lama).");
  }
}
