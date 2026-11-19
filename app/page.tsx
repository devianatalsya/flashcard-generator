"use client";

import { useState, useCallback } from "react";

// --- Tipe Data ---
interface Flashcard {
  question: string;
  answer: string;
}

type AppState = "idle" | "loading" | "result" | "error";

// --- Komponen Utama ---
export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [cardCount, setCardCount] = useState<number>(5);
  const [appState, setAppState] = useState<AppState>("idle");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // Validasi dan set file
  const handleFile = useCallback((selectedFile: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExtensions = [".pdf", ".docx"];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(ext)) {
      setErrorMessage("❌ Format file tidak didukung. Hanya PDF (.pdf) dan Word (.docx) yang diizinkan.");
      setAppState("error");
      return;
    }

    if (selectedFile.size === 0) {
      setErrorMessage("❌ File kosong. Silakan pilih file yang berisi materi.");
      setAppState("error");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMessage("❌ Ukuran file terlalu besar. Maksimal 20MB.");
      setAppState("error");
      return;
    }

    setFile(selectedFile);
    setAppState("idle");
    setFlashcards([]);
    setErrorMessage("");
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Generate flashcard
  const handleGenerate = async () => {
    if (!file) return;

    setAppState("loading");
    setFlashcards([]);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cardCount", String(cardCount));

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan pada server.");
      }

      if (!data.flashcards || data.flashcards.length === 0) {
        throw new Error("AI tidak menghasilkan flashcard. Coba lagi.");
      }

      setFlashcards(data.flashcards);
      setAppState("result");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui.";
      setErrorMessage(message);
      setAppState("error");
    }
  };

  // Reset / Mulai Lagi
  const handleReset = () => {
    setFile(null);
    setFlashcards([]);
    setErrorMessage("");
    setAppState("idle");
    setCardCount(5);
  };

  // Generate Ulang (file yang sama)
  const handleRegenerate = () => {
    if (file) {
      handleGenerate();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎴</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AI Flashcard Generator</h1>
              <p className="text-sm text-slate-500">Upload materi → Generate flashcard otomatis dengan AI</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* LANGKAH 1: Upload File */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            Upload File Materi
          </h2>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50"}
              ${file ? "border-green-400 bg-green-50" : ""}
            `}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileInput}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                <div className="text-4xl">✅</div>
                <p className="font-semibold text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024).toFixed(1)} KB · Siap diproses
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setAppState("idle");
                    setFlashcards([]);
                  }}
                  className="text-xs text-slate-400 underline hover:text-slate-600"
                >
                  Ganti file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl">📄</div>
                <div>
                  <p className="font-medium text-slate-700">Klik atau drag & drop file di sini</p>
                  <p className="text-sm text-slate-400 mt-1">Format: PDF (.pdf) atau Word (.docx) · Maks. 20MB</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* LANGKAH 2: Pilih Jumlah Flashcard */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Jumlah Flashcard
          </h2>

          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setCardCount(n)}
                className={`w-11 h-11 rounded-xl font-semibold text-sm transition-all
                  ${cardCount === n
                    ? "bg-indigo-600 text-white shadow-md scale-105"
                    : "bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700"
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400 mt-3">
            AI akan membuat <span className="font-medium text-indigo-600">{cardCount} flashcard</span> dari materi Anda.
          </p>
        </section>

        {/* LANGKAH 3: Tombol Generate */}
        <section className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!file || appState === "loading"}
            className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-white text-base transition-all
              ${!file || appState === "loading"
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95"
              }`}
          >
            {appState === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                AI sedang membaca materi...
              </span>
            ) : (
              "✨ Buat Flashcard"
            )}
          </button>
        </section>

        {/* Pesan Error */}
        {appState === "error" && (
          <section className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-red-700 font-medium">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="mt-3 text-sm text-red-500 underline hover:text-red-700"
            >
              Mulai lagi
            </button>
          </section>
        )}

        {/* HASIL: Flashcard */}
        {appState === "result" && flashcards.length > 0 && (
          <section className="space-y-4">
            {/* Header hasil */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">
                🎉 {flashcards.length} Flashcard Berhasil Dibuat
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                >
                  🔄 Generate Ulang
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  🗑️ Mulai Lagi
                </button>
              </div>
            </div>

            {/* Grid Flashcard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  {/* Nomor kartu */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Flashcard
                    </span>
                  </div>

                  {/* Pertanyaan */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Pertanyaan</p>
                    <p className="text-slate-800 font-medium leading-snug">{card.question}</p>
                  </div>

                  {/* Divider */}
                  <hr className="border-slate-100 my-3" />

                  {/* Jawaban */}
                  <div>
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1">Jawaban</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{card.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-slate-400">
        AI Flashcard Generator · Dibuat untuk proyek kuliah
      </footer>
    </main>
  );
}
