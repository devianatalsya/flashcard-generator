import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashCard",
  description: "Buat flashcard dari materi belajarmu. . .",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen text-[#0A0A0A] bg-[#FFFFFF] font-sans antialiased selection:bg-[#0A0A0A] selection:text-[#FFFFFF]">
        {children}
      </body>
    </html>
  );
}
