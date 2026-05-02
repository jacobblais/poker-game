'use client';
import React, { useState } from 'react';
import { PokerVariant, VARIANT_NAMES, VARIANT_DESCRIPTIONS } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
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
  texas_holdem: '♠️', omaha: '♥️', omaha_hilo: '♣️',
  seven_stud: '♦️', seven_stud_hilo: '🃏', five_draw: '✋', razz: '🔻'
};

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [variant, setVariant] = useState<PokerVariant>('texas_holdem');
  const [playerName, setPlayerName] = useState('Player');
  const [numBots, setNumBots] = useState(3);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [startingChips, setStartingChips] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(5);
  const [mode, setMode] = useState<'bots' | 'online'>('bots');
  const [showTutorial, setShowTutorial] = useState(false);

  const bigBlind = smallBlind * 2;

  return (
    <div className="min-h-screen bg-[#05080a] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Assets */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              rotate: Math.random() * 360,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * 100 + '%'],
              rotate: [null, Math.random() * 360]
            }}
            transition={{ 
              duration: Math.random() * 20 + 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute text-4xl text-green-500/30"
          >
            {['♠️', '♥️', '♣️', '♦️'][i % 4]}
          </motion.div>
        ))}
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Help Button */}
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowTutorial(true)}
          className="absolute -top-4 -right-4 w-14 h-14 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-2xl hover:bg-slate-800 transition shadow-2xl z-20 backdrop-blur-xl"
          title="How to play / Setup"
        >
          🎓
        </motion.button>

        {/* Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="text-7xl mb-4 drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            🃏
          </motion.div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent uppercase tracking-tighter italic">
            Royal Flush
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/20"></div>
            <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-xs">Premium Poker</p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20"></div>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-8 p-1.5 bg-black/40 rounded-3xl border border-white/5">
            {(['bots', 'online'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 ${
                  mode === m
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)] scale-100'
                    : 'text-white/30 hover:text-white/60'
                }`}>
                {m === 'bots' ? '🆚 AI Bots' : '🌐 Online'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'bots' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'bots' ? 20 : -20 }}
              className="space-y-6"
            >
              {/* Player name */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-bold ml-1">Player Identity</label>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold placeholder-white/10 focus:outline-none focus:border-green-500/50 transition-all focus:ring-4 focus:ring-green-500/10"
                  placeholder="Enter your name"
                />
              </div>

              {/* Variant selection */}
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-3 font-bold ml-1">Select Game</label>
                <div className="grid grid-cols-2 gap-3">
                  {VARIANTS.map(v => (
                    <motion.button 
                      key={v} 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVariant(v)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                        variant === v
                          ? 'border-green-500/50 bg-green-500/10'
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {variant === v && (
                        <motion.div layoutId="variant-active" className="absolute inset-0 bg-green-500/5 pointer-events-none" />
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                        <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{VARIANT_ICONS[v]}</span>
                        <div>
                          <div className={`text-sm font-black uppercase tracking-tight ${variant === v ? 'text-green-400' : 'text-white/80'}`}>
                            {VARIANT_NAMES[v]}
                          </div>
                          <div className="text-white/30 text-[9px] leading-tight font-medium mt-0.5 line-clamp-1">{VARIANT_DESCRIPTIONS[v]}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Settings row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-bold ml-1">Starting Chips</label>
                  <select value={startingChips} onChange={e => setStartingChips(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-black text-xl focus:outline-none cursor-pointer appearance-none">
                    {[500, 1000, 2000, 5000, 10000].map(v => <option key={v} value={v} className="bg-slate-900">${v.toLocaleString()}</option>)}
                  </select>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-bold ml-1">Blinds</label>
                  <select value={smallBlind} onChange={e => setSmallBlind(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-black text-xl focus:outline-none cursor-pointer appearance-none">
                    {[[1,2],[5,10],[10,20],[25,50],[50,100]].map(([sb,bb]) => (
                      <option key={sb} value={sb} className="bg-slate-900">${sb}/${bb}</option>
                    ))}
                  </select>
                </div>
              </div>

              {mode === 'bots' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-bold ml-1">Bots</label>
                    <select value={numBots} onChange={e => setNumBots(Number(e.target.value))}
                      className="w-full bg-transparent text-white font-black text-xl focus:outline-none cursor-pointer appearance-none">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-slate-900">{n} Opponents</option>)}
                    </select>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-bold ml-1">Difficulty</label>
                    <select value={botDifficulty} onChange={e => setBotDifficulty(e.target.value as any)}
                      className="w-full bg-transparent text-white font-black text-xl focus:outline-none cursor-pointer appearance-none">
                      <option value="easy" className="bg-slate-900">Easy</option>
                      <option value="medium" className="bg-slate-900">Medium</option>
                      <option value="hard" className="bg-slate-900">Hardcore</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Start button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart({ variant, playerName: playerName || 'Player', numBots, botDifficulty, startingChips, smallBlind, bigBlind, mode })}
                className="w-full py-5 bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 bg-[length:200%_auto] hover:bg-right transition-all duration-700 text-white font-black text-xl rounded-3xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] uppercase tracking-widest border-b-4 border-green-700"
              >
                {mode === 'bots' ? 'Enter Game' : 'Enter Lobby'}
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
