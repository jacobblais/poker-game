'use client';
import React from 'react';
import { Card as CardType, SUIT_SYMBOLS } from '@/lib/cards';
import { motion, AnimatePresence } from 'framer-motion';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  initial?: any;
  animate?: any;
  transition?: any;
}

const SIZE_CLASSES = {
  sm: { w: 44, h: 62, rank: 14, suit: 18 },
  md: { w: 64, h: 90, rank: 20, suit: 26 },
  lg: { w: 80, h: 112, rank: 26, suit: 34 },
};

export default function Card({ 
  card, faceDown = false, size = 'md', selected, onClick, className = '', 
  initial, animate, transition 
}: CardProps) {
  const dims = SIZE_CLASSES[size];
  const isRed = card && (card.suit === 'hearts' || card.suit === 'diamonds');
  const showFaceDown = faceDown || !card || card.faceUp === false;

  return (
    <motion.div
      layout
      initial={initial || { scale: 0.8, opacity: 0 }}
      animate={animate || { scale: 1, opacity: 1 }}
      transition={transition}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={onClick ? { scale: 1.05, y: -5 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      style={{ width: dims.w, height: dims.h }}
      className={`
        relative rounded-lg border-2 flex-shrink-0 select-none overflow-hidden
        ${selected ? 'ring-2 ring-yellow-400 shadow-yellow-500/50 shadow-lg' : ''}
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {showFaceDown ? (
          <motion.div
            key="back"
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full rounded-lg bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 border-2 border-blue-700 flex items-center justify-center overflow-hidden"
          >
            <div className="w-[85%] h-[85%] rounded border border-blue-600 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
              <div style={{ fontSize: dims.rank * 0.8 }} className="opacity-40">🂠</div>
            </div>
          </motion.div>
        ) : card ? (
          <motion.div
            key="front"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            transition={{ duration: 0.2 }}
            className={`w-full h-full rounded-lg bg-white border-2 flex flex-col justify-between p-0.5 shadow-md
              ${selected ? 'border-yellow-400' : 'border-gray-200'}
            `}
          >
            {/* Top left */}
            <div className={`leading-[0.8] font-bold text-left ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
              <div style={{ fontSize: dims.rank * 0.9 }}>{card.rank}</div>
              <div style={{ fontSize: dims.suit * 0.5 }}>{SUIT_SYMBOLS[card.suit]}</div>
            </div>
            {/* Center */}
            <div className={`flex-1 flex items-center justify-center font-bold ${isRed ? 'text-red-500' : 'text-gray-800'}`} style={{ fontSize: dims.suit * 1.1 }}>
              {SUIT_SYMBOLS[card.suit]}
            </div>
          </motion.div>
        ) : (
          <div className="w-full h-full rounded-lg border-2 border-dashed border-white/20 bg-white/5" />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
