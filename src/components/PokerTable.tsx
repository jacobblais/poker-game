'use client';
import React from 'react';
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
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {/* Table */}
      <div className="relative w-full" style={{ paddingBottom: '60%' }}>
        {/* Felt */}
        <div className="absolute inset-0 rounded-[40%] bg-gradient-to-br from-green-900 via-green-800 to-green-950 border-8 border-amber-900/60 shadow-2xl overflow-hidden">
          {/* Inner felt ring */}
          <div className="absolute inset-4 rounded-[40%] border-2 border-green-700/30" />

          {/* Community Cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            {/* Pot */}
            {potTotal > 0 && (
              <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-yellow-300 font-bold text-sm border border-yellow-500/30">
                💰 ${potTotal.toLocaleString()}
              </div>
            )}

            {/* Community cards */}
            {state.communityCards.length > 0 && (
              <div className="flex gap-2">
                {state.communityCards.map((card, i) => (
                  <Card key={i} card={card} faceDown={false} size="md" />
                ))}
                {/* Placeholder slots */}
                {state.variant === 'texas_holdem' || state.variant === 'omaha' || state.variant === 'omaha_hilo'
                  ? Array(5 - state.communityCards.length).fill(null).map((_, i) => (
                      <Card key={`ph-${i}`} size="md" />
                    ))
                  : null}
              </div>
            )}

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
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner announcement */}
      {showdown && state.winners && state.winners.length > 0 && (
        <div className="relative z-50 bg-gradient-to-r from-yellow-900/80 to-amber-900/80 border border-yellow-500/50 rounded-2xl p-4 text-center backdrop-blur-sm shadow-2xl">
          <div className="text-2xl mb-1">🏆 Winner!</div>
          {state.winners.map((w, i) => (
            <div key={i} className="text-white font-semibold">
              <span className="text-yellow-300">{w.playerName}</span> wins{' '}
              <span className="text-green-300">${w.potAmount.toLocaleString()}</span>{' '}
              with <span className="text-blue-300">{w.handName}</span>
              {w.isLow && <span className="text-purple-300"> (Low)</span>}
            </div>
          ))}
          <button
            onClick={onNewHand}
            className="mt-3 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition active:scale-95 border border-green-400"
          >
            Next Hand →
          </button>
        </div>
      )}

      {/* Human's hole cards */}
      {humanPlayer && humanPlayer.holeCards.length > 0 && (
        <div className="relative z-30 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            {humanPlayer.holeCards.map((card, i) => (
              <Card key={i} card={{ ...card, faceUp: true }} size="lg" />
            ))}
          </div>
          {humanPlayer.handResult && (
            <div className="text-green-300 text-sm font-semibold">{humanPlayer.handResult.name}</div>
          )}
        </div>
      )}

      {/* Action panel */}
      {isHumanTurn && humanPlayer && !humanPlayer.folded && (
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
