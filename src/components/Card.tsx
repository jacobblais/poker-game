'use client';
import React from 'react';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '@/lib/cards';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { w: 44, h: 62, rank: 14, suit: 18 },
  md: { w: 64, h: 90, rank: 20, suit: 26 },
  lg: { w: 80, h: 112, rank: 26, suit: 34 },
};

export default function Card({ card, faceDown = false, size = 'md', selected, onClick, className = '' }: CardProps) {
  const dims = SIZE_CLASSES[size];
  const isRed = card && (card.suit === 'hearts' || card.suit === 'diamonds');
  const showFaceDown = faceDown || !card || card.faceUp === false;

  return (
    <div
      onClick={onClick}
      style={{ width: dims.w, height: dims.h }}
      className={`
        relative rounded-lg border-2 flex-shrink-0 select-none overflow-hidden
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${selected ? 'ring-2 ring-yellow-400 -translate-y-3 shadow-yellow-500/50 shadow-lg' : ''}
        ${className}
      `}
    >
      {showFaceDown ? (
        // Card back
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 border-2 border-blue-700 flex items-center justify-center overflow-hidden">
          <div className="w-[85%] h-[85%] rounded border border-blue-600 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
            <div style={{ fontSize: dims.rank * 0.8 }} className="opacity-40">🂠</div>
          </div>
        </div>
      ) : card ? (
        // Card face
        <div className={`w-full h-full rounded-lg bg-white border-2 flex flex-col justify-between p-0.5 shadow-md
          ${selected ? 'border-yellow-400' : 'border-gray-200'}
        `}>
          {/* Top left */}
          <div className={`leading-[0.8] font-bold text-left ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            <div style={{ fontSize: dims.rank * 0.9 }}>{card.rank}</div>
            <div style={{ fontSize: dims.suit * 0.5 }}>{SUIT_SYMBOLS[card.suit]}</div>
          </div>
          {/* Center */}
          <div className={`flex-1 flex items-center justify-center font-bold ${isRed ? 'text-red-500' : 'text-gray-800'}`} style={{ fontSize: dims.suit * 1.1 }}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          {/* Bottom right (rotated) */}
          <div className={`rotate-180 leading-[0.8] font-bold text-left ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            <div style={{ fontSize: dims.rank * 0.9 }}>{card.rank}</div>
            <div style={{ fontSize: dims.suit * 0.5 }}>{SUIT_SYMBOLS[card.suit]}</div>
          </div>
        </div>
      ) : (
        // Empty placeholder
        <div className="w-full h-full rounded-lg border-2 border-dashed border-white/20 bg-white/5" />
      )}
    </div>
  );
}
