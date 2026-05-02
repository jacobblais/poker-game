'use client';
import React, { useState } from 'react';
import { PlayerAction, GameState } from '@/lib/types';
import { Player } from '@/lib/types';

interface ActionPanelProps {
  state: GameState;
  humanPlayer: Player;
  callAmount: number;
  onAction: (action: PlayerAction, amount?: number) => void;
  onDraw?: (indices: number[]) => void;
}

export default function ActionPanel({ state, humanPlayer, callAmount, onAction, onDraw }: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(state.currentBet * 2 + state.bigBlind);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [drawMode, setDrawMode] = useState(false);

  const potTotal = state.pots.reduce((s, p) => s + p.amount, 0) +
    state.players.reduce((s, p) => s + p.bet, 0);
  const canCheck = callAmount === 0;
  const minRaise = Math.max(state.currentBet + state.lastRaiseAmount, state.bigBlind * 2);
  const maxRaise = humanPlayer.chips;
  const isDrawPhase = state.phase === 'draw' && state.variant === 'five_draw';

  const toggleCard = (i: number) => {
    setSelectedCards(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  if (isDrawPhase) {
    return (
      <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
        <div className="text-white text-sm font-semibold text-center">
          Select cards to discard (tap to select, then click Draw)
        </div>
        <div className="flex gap-2 justify-center">
          {humanPlayer.holeCards.map((_, i) => (
            <button
              key={i}
              onClick={() => toggleCard(i)}
              className={`w-8 h-8 rounded-lg text-sm font-bold border-2 transition-all
                ${selectedCards.includes(i)
                  ? 'bg-red-600 border-red-400 text-white scale-110'
                  : 'bg-slate-700 border-slate-500 text-gray-300 hover:border-white'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { onDraw?.(selectedCards); setSelectedCards([]); }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
          >
            Draw ({selectedCards.length})
          </button>
          <button
            onClick={() => { onDraw?.([]); }}
            className="px-5 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl transition"
          >
            Stand Pat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-30 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col gap-3 shadow-2xl">
      {/* Pot info */}
      <div className="flex justify-between text-sm text-white/60">
        <span>Pot: <span className="text-yellow-300 font-bold">${potTotal.toLocaleString()}</span></span>
        <span>To Call: <span className="text-blue-300 font-bold">${callAmount.toLocaleString()}</span></span>
        <span>Stack: <span className="text-green-300 font-bold">${humanPlayer.chips.toLocaleString()}</span></span>
      </div>

      {/* Raise slider */}
      <div className="flex items-center gap-3">
        <span className="text-white/60 text-sm w-14">Raise:</span>
        <input
          type="range"
          min={minRaise}
          max={maxRaise}
          step={state.bigBlind}
          value={Math.min(raiseAmount, maxRaise)}
          onChange={e => setRaiseAmount(Number(e.target.value))}
          className="flex-1 accent-yellow-400"
        />
        <span className="text-yellow-300 font-mono font-bold text-sm w-20 text-right">
          ${Math.min(raiseAmount, maxRaise).toLocaleString()}
        </span>
      </div>

      {/* Quick raise buttons */}
      <div className="flex gap-2 justify-center">
        {[0.5, 0.75, 1].map(frac => {
          const amt = Math.floor(potTotal * frac);
          const label = frac === 0.5 ? '½ Pot' : frac === 0.75 ? '¾ Pot' : 'Pot';
          return (
            <button key={frac} onClick={() => setRaiseAmount(Math.min(Math.max(amt, minRaise), maxRaise))}
              className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition">
              {label}
            </button>
          );
        })}
        <button onClick={() => setRaiseAmount(maxRaise)}
          className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 transition">
          All In
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => onAction('fold')}
          className="flex-1 py-3 bg-red-700/80 hover:bg-red-600 border border-red-500 text-white font-bold rounded-xl transition active:scale-95">
          Fold
        </button>

        {canCheck ? (
          <button onClick={() => onAction('check')}
            className="flex-1 py-3 bg-slate-600/80 hover:bg-slate-500 border border-slate-400 text-white font-bold rounded-xl transition active:scale-95">
            Check
          </button>
        ) : (
          <button onClick={() => onAction('call')}
            className="flex-1 py-3 bg-blue-700/80 hover:bg-blue-600 border border-blue-400 text-white font-bold rounded-xl transition active:scale-95">
            Call ${callAmount.toLocaleString()}
          </button>
        )}

        <button
          onClick={() => {
            if (raiseAmount >= maxRaise) {
              onAction('all_in');
            } else {
              onAction('raise', raiseAmount);
            }
          }}
          disabled={humanPlayer.chips <= callAmount}
          className="flex-1 py-3 bg-yellow-600/80 hover:bg-yellow-500 border border-yellow-400 text-white font-bold rounded-xl transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
          {raiseAmount >= maxRaise ? 'All In 🚀' : `Raise $${Math.min(raiseAmount, maxRaise).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
