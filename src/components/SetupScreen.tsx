'use client';
import React, { useState } from 'react';
import { PokerVariant, VARIANT_NAMES, VARIANT_DESCRIPTIONS } from '@/lib/types';
import Tutorial from './Tutorial';

interface SetupScreenProps {
  onStart: (config: GameConfig) => void;
}

export interface GameConfig {
  variant: PokerVariant;
  playerName: string;
  numBots: number;
  botDifficulty: 'easy' | 'medium' | 'hard';
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  mode: 'bots' | 'online';
}

const VARIANTS: PokerVariant[] = [
  'texas_holdem', 'omaha', 'omaha_hilo', 'seven_stud', 'seven_stud_hilo', 'five_draw', 'razz'
];

const VARIANT_ICONS: Record<PokerVariant, string> = {
  texas_holdem: '🃏', omaha: '🂡', omaha_hilo: '⚖️',
  seven_stud: '🎰', seven_stud_hilo: '🎲', five_draw: '✋', razz: '🔻'
};

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [variant, setVariant] = useState<PokerVariant>('texas_holdem');
  const [playerName, setPlayerName] = useState('You');
  const [numBots, setNumBots] = useState(3);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [startingChips, setStartingChips] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(5);
  const [mode, setMode] = useState<'bots' | 'online'>('bots');

  const [showTutorial, setShowTutorial] = useState(false);

  const bigBlind = smallBlind * 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 flex items-center justify-center p-4">
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      
      <div className="w-full max-w-2xl relative">
        {/* Help Button */}
        <button 
          onClick={() => setShowTutorial(true)}
          className="absolute -top-4 -right-4 w-12 h-12 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-xl hover:bg-slate-700 transition shadow-xl z-10"
          title="How to play / Setup"
        >
          📖
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🃏</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
            Royal Flush
          </h1>
          <p className="text-white/50 mt-2 text-lg">Premium Poker Experience</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-800 rounded-2xl">
            {(['bots', 'online'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  mode === m
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'text-white/50 hover:text-white'
                }`}>
                {m === 'bots' ? '🤖 vs Bots' : '🌐 Online Multiplayer'}
              </button>
            ))}
          </div>

          {mode === 'online' && (
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-2xl text-center">
              <div className="text-blue-300 font-semibold mb-1">🌐 Online Multiplayer</div>
              <div className="text-white/60 text-sm">
                Create or join a room below. Share the room code with friends!
              </div>
            </div>
          )}

          {/* Player name */}
          <div className="mb-4">
            <label className="block text-white/60 text-sm mb-2 font-medium">Your Name</label>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-green-500 transition"
              placeholder="Enter your name"
            />
          </div>

          {/* Variant selection */}
          <div className="mb-4">
            <label className="block text-white/60 text-sm mb-2 font-medium">Poker Variant</label>
            <div className="grid grid-cols-2 gap-2">
              {VARIANTS.map(v => (
                <button key={v} onClick={() => setVariant(v)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    variant === v
                      ? 'border-green-500 bg-green-900/30 shadow-lg shadow-green-900/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{VARIANT_ICONS[v]}</span>
                    <div>
                      <div className="text-white text-sm font-semibold">{VARIANT_NAMES[v]}</div>
                      <div className="text-white/40 text-[10px] leading-tight">{VARIANT_DESCRIPTIONS[v].slice(0, 45)}…</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white/60 text-sm mb-2 font-medium">Starting Chips</label>
              <select value={startingChips} onChange={e => setStartingChips(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-green-500">
                {[500, 1000, 2000, 5000, 10000].map(v => <option key={v} value={v}>${v.toLocaleString()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2 font-medium">Blinds</label>
              <select value={smallBlind} onChange={e => setSmallBlind(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-green-500">
                {[[1,2],[5,10],[10,20],[25,50],[50,100]].map(([sb,bb]) => (
                  <option key={sb} value={sb}>${sb}/${bb}</option>
                ))}
              </select>
            </div>
          </div>

          {mode === 'bots' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-white/60 text-sm mb-2 font-medium">Number of Bots</label>
                <select value={numBots} onChange={e => setNumBots(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-green-500">
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} bot{n>1?'s':''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2 font-medium">Bot Difficulty</label>
                <select value={botDifficulty} onChange={e => setBotDifficulty(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-green-500">
                  <option value="easy">😊 Easy</option>
                  <option value="medium">🧠 Medium</option>
                  <option value="hard">💀 Hard</option>
                </select>
              </div>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={() => onStart({ variant, playerName: playerName || 'You', numBots, botDifficulty, startingChips, smallBlind, bigBlind, mode })}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg rounded-2xl transition-all active:scale-95 shadow-xl shadow-green-900/40 border border-green-500/30"
          >
            {mode === 'bots' ? '🎮 Start Game' : '🌐 Find / Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
