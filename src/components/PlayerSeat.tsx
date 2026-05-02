'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Player, GameState, WinnerInfo } from '@/lib/types';
import Card from './Card';

interface PlayerSeatProps {
  player: Player;
  state: GameState;
  isCurrentTurn: boolean;
  position: 'bottom' | 'top' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showCards?: boolean;
  winner?: WinnerInfo;
  isSpectator?: boolean;
}

const positionStyles: Record<string, string> = {
  bottom: 'bottom-0 left-1/2 -translate-x-1/2',
  top: 'top-0 left-1/2 -translate-x-1/2',
  left: 'left-0 top-1/2 -translate-y-1/2',
  right: 'right-0 top-1/2 -translate-y-1/2',
  'top-left': 'top-8 left-16',
  'top-right': 'top-8 right-16',
  'bottom-left': 'bottom-8 left-16',
  'bottom-right': 'bottom-8 right-16',
};

export default function PlayerSeat({ player, state, isCurrentTurn, position, showCards, winner, isSpectator }: PlayerSeatProps) {
  const isHuman = !player.isBot;
  const winAmount = winner?.potAmount ?? 0;
  const isWinner = !!winner;

  return (
    <div className={`absolute flex flex-col items-center gap-1 ${positionStyles[position]}`}>
      {/* Cards */}
      <div className="flex gap-1 mb-1">
        {player.holeCards.map((card, i) => {
          const shouldShow = isHuman || isWinner || card.faceUp === true || isSpectator || (showCards && !player.folded);
          return (
            <Card
              key={i}
              card={card}
              faceDown={!shouldShow}
              size="sm"
            />
          );
        })}
        {player.holeCards.length === 0 && !player.folded && (
          <div className="w-10 h-14 rounded-md border border-dashed border-white/20" />
        )}
      </div>

      {/* Player info box */}
      <div className={`
        relative px-3 py-1.5 rounded-xl border text-center min-w-[90px] transition-all duration-300
        ${player.folded ? 'opacity-40 scale-95' : ''}
        ${isCurrentTurn ? 'border-yellow-400 scale-105 glow-active' : 'border-white/20'}
        ${isWinner ? 'border-green-400 shadow-lg shadow-green-500/40' : ''}
        ${isHuman ? 'bg-blue-900/80 backdrop-blur-sm' : 'bg-slate-800/80 backdrop-blur-sm'}
      `}>
        {/* Turn indicator */}
        {isCurrentTurn && !player.folded && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(234,179,8,1)]" />
        )}

        {/* Dealer/Blind badges */}
        <div className="flex gap-1 justify-center mb-0.5">
          {player.isDealer && (
            <span className="text-[9px] bg-white text-black font-bold px-1 rounded">D</span>
          )}
          {player.isSmallBlind && (
            <span className="text-[9px] bg-blue-500 text-white font-bold px-1 rounded">SB</span>
          )}
          {player.isBigBlind && (
            <span className="text-[9px] bg-orange-500 text-white font-bold px-1 rounded">BB</span>
          )}
        </div>

        <div className="text-sm font-semibold text-white truncate max-w-[80px]">
          {player.avatar} {player.name}
        </div>
        <div className="text-xs text-yellow-300 font-mono">${player.chips.toLocaleString()}</div>

        {player.bet > 0 && !player.folded && (
          <motion.div
            key={`${player.id}-${player.bet}`}
            layoutId={`bet-${player.id}`}
            initial={{ scale: 0.5, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="text-[10px] text-blue-300 flex items-center justify-center gap-1"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-300 inline-block shadow-sm" />
            Bet: ${player.bet}
          </motion.div>
        )}
        {player.folded && (
          <div className="text-[10px] text-red-400 font-bold">FOLDED</div>
        )}
        {player.isAllIn && !player.folded && (
          <div className="text-[10px] text-orange-400 font-bold animate-pulse">ALL IN</div>
        )}
        {player.handResult && showCards && (
          <div className="text-[9px] text-green-300 mt-0.5 font-medium">{player.handResult.name}</div>
        )}
        {isWinner && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-green-400 animate-bounce z-50 whitespace-nowrap">
            🏆 Winner +${winAmount.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
