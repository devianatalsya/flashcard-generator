import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Flashcard Generator",
  description: "Upload PDF/DOCX dan buat flashcard otomatis dengan AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
