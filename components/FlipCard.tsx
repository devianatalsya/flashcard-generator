"use client";

import React, { useState } from "react";

interface Flashcard {
  question: string;
  answer: string;
}

interface FlipCardProps {
  card: Flashcard;
  index: number;
}

export function FlipCard({ card, index }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    }
  };

  const cardNumber = String(index + 1).padStart(2, "0");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Flashcard ${cardNumber}. ${isFlipped ? "Jawaban" : "Pertanyaan"}`}
      className="card card-perspective w-full cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] rounded-[12px]"
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      style={{ minHeight: "220px" }}
    >
      <div
        className={`card-inner h-full min-h-[220px] flex ${isFlipped ? "is-flipped" : ""}`}
      >
        {/* FRONT FACE (Pertanyaan) */}
        <div className="card-face card-front flex flex-col justify-between p-6 rounded-[12px] bg-[#FFFFFF] border border-[#E5E5E5] hover:border-[#A3A3A3] transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0F0F0]">
              <span className="font-mono text-xs font-semibold text-[#737373]">
                {cardNumber}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-[#737373]">
                Pertanyaan
              </span>
            </div>

            <p className="text-[#0A0A0A] text-base font-semibold leading-snug pt-1">
              {card.question}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-6 border-t border-[#F0F0F0] text-xs text-[#737373]">
            <span className="hover:text-[#0A0A0A] transition-colors">
              Klik untuk membalik
            </span>
          </div>
        </div>

        {/* BACK FACE (Jawaban) */}
        <div className="card-face card-back flex flex-col justify-between p-6 rounded-[12px] bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#A3A3A3] transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5E5]">
              <span className="font-mono text-xs font-semibold text-[#737373]">
                {cardNumber}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-[#0A0A0A] font-medium">
                Jawaban
              </span>
            </div>

            <p className="text-[#171717] text-sm md:text-base leading-relaxed pt-1">
              {card.answer}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-6 border-t border-[#E5E5E5] text-xs text-[#737373]">
            <span className="hover:text-[#0A0A0A] transition-colors">
              Klik untuk membalik
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
