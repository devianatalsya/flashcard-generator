"use client";

import { useState, useCallback, useRef } from "react";
import { FlipCard } from "@/components/FlipCard";

interface Flashcard {
  question: string;
  answer: string;
}

type AppState = "idle" | "loading" | "result" | "error";
type InputMode = "file" | "text";

export default function HomePage() {
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>("");
  const [cardCount, setCardCount] = useState<number>(5);
  const [appState, setAppState] = useState<AppState>("idle");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExtensions = [".pdf", ".docx"];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(ext)) {
      setErrorMessage("Format file tidak didukung. Gunakan PDF atau DOCX.");
      setAppState("error");
      return;
    }

    if (selectedFile.size === 0) {
      setErrorMessage("File kosong.");
      setAppState("error");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMessage("Ukuran file melebihi batas 20MB.");
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isInputValid =
    inputMode === "file" ? file !== null : textInput.trim().length > 0;

  const handleGenerate = async () => {
    if (inputMode === "file" && !file) {
      setErrorMessage("Pilih file PDF atau DOCX terlebih dahulu.");
      setAppState("error");
      return;
    }

    if (inputMode === "text" && textInput.trim().length === 0) {
      setErrorMessage("Masukkan materi terlebih dahulu.");
      setAppState("error");
      return;
    }

    setAppState("loading");
    setFlashcards([]);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("inputType", inputMode);
      formData.append("cardCount", String(cardCount));

      if (inputMode === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("text", textInput.trim());
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses materi.");
      }

      if (!data.flashcards || data.flashcards.length === 0) {
        throw new Error("Gagal membuat flashcard.");
      }

      setFlashcards(data.flashcards);
      setAppState("result");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setErrorMessage(message);
      setAppState("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setTextInput("");
    setFlashcards([]);
    setErrorMessage("");
    setAppState("idle");
    setCardCount(5);
  };

  const handleRegenerate = () => {
    if (isInputValid) {
      handleGenerate();
    }
  };

  const handleDownloadMarkdown = () => {
    if (flashcards.length === 0) return;

    const sourceName = inputMode === "file" && file ? file.name : "Materi";
    let content = `# Flashcard: ${sourceName}\n\n`;

    flashcards.forEach((card, index) => {
      content += `### ${index + 1}. ${card.question}\n\n`;
      content += `${card.answer}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flashcards-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#0A0A0A] font-sans">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] bg-[#FFFFFF]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-tight text-[#0A0A0A]">
            FlashCard.
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#737373] hover:text-[#0A0A0A] transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <section>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#0A0A0A]">
            Buat flashcard dari materi belajar.
          </h1>
        </section>

        {/* Input Panel */}
        <section className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-[12px] p-6 space-y-6 shadow-sm">
          {/* Tabs */}
          <div className="inline-flex bg-[#F5F5F5] p-1 border border-[#E5E5E5] rounded-[8px]">
            <button
              type="button"
              onClick={() => {
                setInputMode("file");
                if (errorMessage) setErrorMessage("");
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                inputMode === "file"
                  ? "bg-[#FFFFFF] text-[#0A0A0A] font-semibold shadow-xs"
                  : "text-[#737373] hover:text-[#0A0A0A]"
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode("text");
                if (errorMessage) setErrorMessage("");
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                inputMode === "text"
                  ? "bg-[#FFFFFF] text-[#0A0A0A] font-semibold shadow-xs"
                  : "text-[#737373] hover:text-[#0A0A0A]"
              }`}
            >
              Masukkan Teks
            </button>
          </div>

          {/* Tab 1: Upload File */}
          {inputMode === "file" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-[8px] p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-[#0A0A0A] bg-[#F5F5F5]"
                  : "border-[#E5E5E5] hover:border-[#A3A3A3] bg-[#FAFAFA]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileInput}
                className="hidden"
              />

              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#0A0A0A] truncate">
                    {file.name}
                  </p>
                  <p className="font-mono text-xs text-[#737373]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#737373]">
                  Upload PDF atau DOCX.
                </p>
              )}
            </div>
          )}

          {/* Tab 2: Masukkan Teks */}
          {inputMode === "text" && (
            <textarea
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="Tempel materi di sini..."
              className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-[8px] p-4 text-sm text-[#0A0A0A] placeholder-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:bg-[#FFFFFF] min-h-[180px] resize-y leading-relaxed transition-colors"
            />
          )}

          {/* Jumlah & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#F0F0F0]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#737373]">
                Jumlah kartu
              </span>
              <div className="inline-flex items-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-[8px] p-0.5">
                <button
                  type="button"
                  onClick={() => setCardCount((prev) => Math.max(1, prev - 1))}
                  disabled={cardCount <= 1}
                  aria-label="Kurangi"
                  className="w-8 h-8 flex items-center justify-center font-mono text-sm text-[#737373] hover:text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="w-8 text-center font-mono text-sm font-semibold text-[#0A0A0A]">
                  {cardCount}
                </span>
                <button
                  type="button"
                  onClick={() => setCardCount((prev) => Math.min(10, prev + 1))}
                  disabled={cardCount >= 10}
                  aria-label="Tambah"
                  className="w-8 h-8 flex items-center justify-center font-mono text-sm text-[#737373] hover:text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!isInputValid || appState === "loading"}
              className={`h-10 px-5 rounded-[8px] text-xs font-semibold tracking-wide transition-colors ${
                !isInputValid || appState === "loading"
                  ? "bg-[#E5E5E5] text-[#A3A3A3] cursor-not-allowed"
                  : "bg-[#0A0A0A] text-[#FFFFFF] hover:bg-[#262626]"
              }`}
            >
              {appState === "loading" ? "Memproses..." : "Buat Flashcard"}
            </button>
          </div>
        </section>

        {/* Error State */}
        {appState === "error" && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] p-4 text-xs text-[#DC2626] flex items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[#DC2626] font-medium underline shrink-0"
            >
              Reset
            </button>
          </div>
        )}

        {/* Hasil Flashcard */}
        {appState === "result" && flashcards.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
              <span className="font-mono text-xs font-medium text-[#737373]">
                {flashcards.length} Flashcard
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="h-8 px-3 text-xs font-medium text-[#0A0A0A] border border-[#E5E5E5] rounded-[8px] hover:bg-[#F5F5F5] transition-colors"
                >
                  Download .md
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="h-8 px-3 text-xs font-medium text-[#737373] border border-[#E5E5E5] rounded-[8px] hover:text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
                >
                  Buat Ulang
                </button>
              </div>
            </div>

            {/* Flashcard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {flashcards.map((card, index) => (
                <FlipCard key={index} card={card} index={index} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
