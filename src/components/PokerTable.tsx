'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, WinnerInfo } from '@/lib/types';
import Card from './Card';
import PlayerSeat from './PlayerSeat';
import ActionPanel from './ActionPanel';
import { Player, PlayerAction } from '@/lib/types';

// Table positions for up to 9 players
const SEAT_POSITIONS = [
  'bottom', 'bottom-right', 'right', 'top-right', 'top',
  'top-left', 'left', 'bottom-left', 'bottom'
] as const;

interface PokerTableProps {
  state: GameState;
  humanPlayer: Player | null;
  isHumanTurn: boolean;
  callAmount: number;
  onAction: (action: PlayerAction, amount?: number) => void;
  onDraw: (indices: number[]) => void;
  onNewHand: () => void;
}

export default function PokerTable({
  state, humanPlayer, isHumanTurn, callAmount, onAction, onDraw, onNewHand
}: PokerTableProps) {
  const showdown = state.phase === 'ended';
  const potTotal = state.pots.reduce((s, p) => s + p.amount, 0);

  // Arrange players: human at bottom, bots around table
  const humanIdx = state.players.findIndex(p => !p.isBot);
  const reordered = humanIdx >= 0
    ? [...state.players.slice(humanIdx), ...state.players.slice(0, humanIdx)]
    : state.players;

  return (
    <div className="flex flex-col gap-2 w-full max-w-3xl mx-auto h-full justify-between py-2">
      {/* Table */}
      <div className="relative w-full" style={{ paddingBottom: '60%' }}>
        {/* Felt */}
        <div className="absolute inset-0 rounded-[40%] bg-gradient-to-br from-green-900 via-green-800 to-green-950 border-8 border-amber-900/60 shadow-2xl overflow-hidden">
          {/* Inner felt ring */}
          <div className="absolute inset-4 rounded-[40%] border-2 border-green-700/30" />

          {/* Community Cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            {/* Pot */}
            <AnimatePresence>
              {potTotal > 0 && (
                <motion.div
                  layoutId="main-pot"
                  initial={{ scale: 0.5, y: -20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.5, y: -20, opacity: 0 }}
                  className="bg-black/80 backdrop-blur-xl px-6 py-2.5 rounded-2xl text-yellow-400 font-black text-2xl border-4 border-yellow-500/30 flex flex-col items-center gap-1 shadow-[0_0_50px_rgba(234,179,8,0.2)] mb-4"
                >
                  <div className="text-[10px] text-yellow-500/50 uppercase tracking-[0.3em] font-bold">Total Pot</div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-red-400 shadow-lg" />
                      <span className="w-5 h-5 rounded-full bg-blue-600 border-2 border-blue-400 shadow-lg" />
                      <span className="w-5 h-5 rounded-full bg-green-600 border-2 border-green-400 shadow-lg" />
                    </div>
                    <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">${potTotal.toLocaleString()}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Community cards & Deck */}
            <div className="flex items-center gap-4">
              {/* Deck */}
              {state.phase !== 'ended' && state.phase !== 'waiting' && (
                <div className="relative group perspective-1000 hidden sm:block">
                  <div className="w-10 h-14 bg-blue-800 rounded-md border border-blue-600 shadow-lg transform -rotate-6 translate-x-1 translate-y-1" />
                  <div className="absolute inset-0 w-10 h-14 bg-blue-700 rounded-md border border-blue-500 shadow-lg transform -rotate-3 translate-x-0.5 translate-y-0.5" />
                  <Card size="sm" faceDown={true} className="shadow-2xl" />
                </div>
              )}

              {state.communityCards.length > 0 && (
                <div className="flex gap-2">
                  {state.communityCards.map((card, i) => (
                    <Card key={i} card={card} faceDown={false} size="sm" />
                  ))}
                  {/* Placeholder slots */}
                  {state.variant === 'texas_holdem' || state.variant === 'omaha' || state.variant === 'omaha_hilo'
                    ? Array(5 - state.communityCards.length).fill(null).map((_, i) => (
                      <Card key={`ph-${i}`} size="sm" />
                    ))
                    : null}
                </div>
              )}
            </div>

            {/* Phase label */}
            <div className="text-white/40 text-xs uppercase tracking-widest font-light">
              {state.phase === 'preflop' ? 'Pre-Flop' :
                state.phase === 'flop' ? 'Flop' :
                  state.phase === 'turn' ? 'Turn' :
                    state.phase === 'river' ? 'River' :
                      state.phase === 'draw' ? '✋ Draw' :
                        state.phase === 'ended' ? '🏆 Showdown' : ''}
            </div>
          </div>

        </div>

        {/* Players around table - outside overflow-hidden to prevent clipping */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {reordered.map((player, i) => {
            const pos = SEAT_POSITIONS[Math.min(i, SEAT_POSITIONS.length - 1)];
            const winnerInfo = state.winners?.find(w => w.playerId === player.id);
            return (
              <div key={player.id} className="pointer-events-auto">
                <PlayerSeat
                  player={player}
                  state={state}
                  isCurrentTurn={state.players[state.currentPlayerIndex]?.id === player.id}
                   position={pos as any}
                  showCards={showdown}
                  winner={winnerInfo}
                  isSpectator={!humanPlayer}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner announcement */}
      {showdown && state.winners && state.winners.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl border-4 border-yellow-500/50 rounded-[40px] p-8 text-center shadow-[0_0_100px_rgba(234,179,8,0.3)] animate-in fade-in zoom-in duration-500 pointer-events-auto max-w-lg w-full mx-4">
            <div className="text-5xl mb-4 animate-bounce">
              {!humanPlayer || state.winners.some(w => w.playerId === humanPlayer.id) ? '🏆' : '💔'}
            </div>
            <h2 className="text-4xl font-black text-white mb-4 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent uppercase tracking-tighter">
              {!humanPlayer ? 'Hand Finished' : state.winners.some(w => w.playerId === humanPlayer.id) ? 'Winner!' : 'You Lost'}
            </h2>
            <div className="space-y-4 mb-8">
              {state.winners.map((w, i) => (
                <div key={i} className="text-xl text-white font-medium bg-white/5 py-3 px-6 rounded-2xl border border-white/10">
                  <span className="text-yellow-300 font-bold">{w.playerName}</span>
                  <div className="text-2xl font-black text-green-400 mt-1">${w.potAmount.toLocaleString()}</div>
                  <div className="text-sm text-white/50 mt-1">{w.handName}{w.isLow ? ' (Low)' : ''}</div>
                </div>
              ))}
            </div>
            <button
              onClick={onNewHand}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-xl rounded-2xl transition-all active:scale-95 shadow-xl shadow-green-900/40 border-b-4 border-green-700"
            >
              Next Hand →
            </button>
          </div>
        </div>
      )}

      {/* Human's hole cards */}
      {humanPlayer && humanPlayer.holeCards.length > 0 && (
        <div className="relative z-30 flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {humanPlayer.holeCards.map((card, i) => (
              <Card key={i} card={{ ...card, faceUp: true }} size="md" />
            ))}
          </div>
          {humanPlayer.handResult && (
            <div className="text-green-300 text-sm font-semibold">{humanPlayer.handResult.name}</div>
          )}
        </div>
      )}

      {/* Action panel */}
      {isHumanTurn && humanPlayer && !humanPlayer.folded && !humanPlayer.isAllIn && (
        <ActionPanel
          state={state}
          humanPlayer={humanPlayer}
          callAmount={callAmount}
          onAction={onAction}
          onDraw={onDraw}
        />
      )}

      {/* Waiting for bots */}
      {!isHumanTurn && state.phase !== 'ended' && state.phase !== 'waiting' && (
        <div className="text-center text-white/40 text-sm animate-pulse py-2">
          Waiting for {state.players[state.currentPlayerIndex]?.name}...
        </div>
      )}
    </div>
  );
}
